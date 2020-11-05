const fs = require('fs');
const path = require('path');

const THEME = (_ => {
  const THEME = {
    CONFIG: 'config.themes.json',
    OPERATIONS: {
      THEMES: {
        KEYWORD: 'themes'
      },
      RESET: {
        KEYWORD: 'reset'
      },
      OVERRIDE: {
        KEYWORD: 'overridden',
        OPTIONS: {
          MATCH: { COMPONENT: 'component', MODE: 'mode' },
          TYPE: { ALL: 'all', DIF: 'difference', INS: 'intersect' }
        }
      },
      EXTEND: {
        KEYWORD: 'extended',
        OPTIONS: {
          MATCH: { COMPONENT: 'component', MODE: 'mode' },
          TYPE: { ALL: 'all', DIF: 'difference', INS: 'intersect' }
        }
      }
    }
  }

  const check = (OPERATION, option) => {
    if (typeof option !== 'object') return false;
    const { OPTIONS } = OPERATION;
    const keys = Object.keys(OPTIONS).map(key => key.toLowerCase());
    for (const key of keys) {
      if (!(key in option)) return false;
      if (!(Object.values(OPTIONS[key.toUpperCase()]).includes(option[key]))) return false;
    }
    if (option.components) {
      if (!Array.isArray(option.components)) return false;
      for (const item of option.components) {
        if (typeof item !== 'string') return false;
      }
    }
    return true;
  }

  const { OPERATIONS: { OVERRIDE, EXTEND } } = THEME;
  OVERRIDE._check = (option) => check(OVERRIDE, option);
  EXTEND._check = (option) => check(EXTEND, option);

  return THEME;
})();

class ThemeLoader {
  devPath = '';

  constructor(devPath) {
    this.devPath = devPath;
  }

  getStyles() {
    const themes = getDirectories(this.devPath);
    const styles = {};
    for (const theme of themes) {
      const componentsPath = path.join(this.devPath, theme, 'src', 'components');
      const components = getDirectories(componentsPath);
      styles[theme] = {};
      for (const component of components) {
        const modesPath = path.join(componentsPath, component);
        const modes = fs.readdirSync(modesPath);
        for (const mode of modes) {
          const style = getFile(path.join(modesPath, mode));
          if (style) {
            if (!styles[theme][component]) styles[theme][component] = {};
            styles[theme][component][getMode(mode)] = style;
          }
        }
      }
    }
    return styles;
  }

  getConfig() {
    return JSON.parse(getFile(path.join(this.devPath, THEME.CONFIG)));
  }
}

class ThemeRunner {
  _themes = [];
  _styles = {};
  _generated = {};

  constructor(styles) {
    this._styles = styles;
  }

  task(command, option) {
    const { OPERATIONS } = THEME;
    switch (option) {
      case OPERATIONS.THEMES.KEYWORD:
        this._themesTask(command[option]);
        break;
      case OPERATIONS.RESET.KEYWORD:
        this._resetTask(command[option]);
        break;
      case OPERATIONS.OVERRIDE.KEYWORD:
        this._overrideTask(command[option]);
        break;
      case OPERATIONS.EXTEND.KEYWORD:
        this._extendTask(command[option]);
        break;
    }
  }

  _themesTask(themes) {
    // TODO: checking
    const { THEMES } = THEME.OPERATIONS;
    this._themes = [...themes];
    this._generated = {};

    const theme = this._themes[0];
    for (const component of Object.keys(this._styles[theme])) {
      this._generated[component] = {};
      for (const mode of Object.keys(this._styles[theme][component])) {
        this._generated[component][mode] = {
          _max_priority: 1,
          [theme]: {
            _code: this._styles[theme][component][mode],
            _from: THEMES.KEYWORD,
            _priority: 1
          }
        }
      }
    }
  }

  _resetTask(value) {
    // TODO: not implemented
  }

  _overrideTask(option) {
    if (!THEME.OPERATIONS.OVERRIDE._check(option)) return;

    const { KEYWORD, OPTIONS } = THEME.OPERATIONS.OVERRIDE;
    const { match, type } = option;
    const themes = this._themes.slice(1);

    // type is 'intersect'
    if (type === OPTIONS.TYPE.INS) {
      for (const theme of themes) {
        const components = option.components ? option.components : Object.keys(this._styles[theme]);

        for (const component of components) {
          if (!this._styles[theme][component]) continue;
          if (!this._generated[component]) continue;

          if (match === OPTIONS.MATCH.COMPONENT) this._generated[component] = {};

          for (const mode of Object.keys(this._styles[theme][component])) {
            if (match === OPTIONS.MATCH.MODE && !this._generated[component][mode]) continue;

            this._generated[component][mode] = {
              _max_priority: 1,
              [theme]: {
                _code: this._styles[theme][component][mode],
                _from: KEYWORD,
                _priority: 1,
              }
            }
          }
        }
      }

      return;
    }

    // type is 'difference'
    if (type === OPTIONS.TYPE.DIF) {
      const styles = {};

      for (const theme of themes) {
        const components = option.components ? option.components : Object.keys(this._styles[theme]);

        for (const component of components) {
          if (!this._styles[theme][component]) continue;

          // match is 'component'
          if (match === OPTIONS.MATCH.COMPONENT) {
            if (this._generated[component]) continue;
            styles[component] = {};

            for (const mode of Object.keys(this._styles[theme][component])) {
              styles[component][mode] = {
                _max_priority: 1,
                [theme]: {
                  _code: this._styles[theme][component][mode],
                  _from: KEYWORD,
                  _priority: 1
                }
              }
            }
            continue;
          }

          // match is 'mode'
          if (!styles[component]) styles[component] = {};
          for (const mode of Object.keys(this._styles[theme][component])) {
            if (this._generated[component] && this._generated[component][mode]) continue;

            styles[component][mode] = {
              _max_priority: 1,
              [theme]: {
                _code: this._styles[theme][component][mode],
                _from: KEYWORD,
                _priority: 1
              }
            }
          }

          if (Object.keys(styles[component]).length === 0) delete styles[component];
        }
      }

      // match is 'component'
      if (match === OPTIONS.MATCH.COMPONENT) {
        for (const component in styles) {
          this._generated[component] = styles[component];
        }
        return;
      }

      // match is 'mode'
      for (const component in styles) {
        for (const mode of Object.keys(styles[component])) {
          if (!this._generated[component]) {
            this._generated[component] = { [mode]: styles[component][mode] };
            continue;
          }
          if (!this._generated[component][mode]) {
            this._generated[component][mode] = styles[component][mode];
          }
        }
      }

      return;
    }

    // type is 'all'
    if (type === OPTIONS.TYPE.ALL) {
      // TODO: not implemented
    }
  }

  _extendTask(option) {
    const { EXTEND } = THEME.OPERATIONS;
    if (!EXTEND._check(option)) return;

    // TODO: not implemented
  }
}

class ThemeGenerator {
  config = {};

  constructor(production = true) {
    this.loader = new ThemeLoader(path.join('..', 'themes'))
  }

  run() {
    this.config = this.loader.getConfig();
    const run = new ThemeRunner(this.loader.getStyles());

    console.log('config', this.config);
    const devPath = path.join('..', 'themes');
    fs.writeFileSync(path.join(devPath, 'styles.json'), JSON.stringify(run._styles, null, 4));

    for (const command of this.config) {
      for (const option of Object.keys(command)) {
        run.task(command, option);
      }
    }

    fs.writeFileSync(path.join(devPath, 'styles.generated.json'), JSON.stringify(run._generated, null, 4));
  }
}



// TODO: probably you need to integrate those in ThemeLoader

const getDirectories = p => fs.readdirSync(p).filter(d => fs.statSync(path.join(p, d)).isDirectory());
const getFile = p => fs.readFileSync(p, 'utf8');
const getMode = f => {
  const items = f.split('.');
  if (items.length < 2) return; // error
  if (items.length === 2) return 'default';
  return items.slice(1, -1).join('.');
};

module.exports = ThemeGenerator;
