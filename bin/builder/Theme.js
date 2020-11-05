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
        OPTIONS: { ALL: 'all' }
      },
      EXTEND: {
        KEYWORD: 'extended',
        OPTIONS: { ALL: 'all', DIF: 'difference', INS: 'intersect' },
      }
    }
  }

  Object.keys(THEME.OPERATIONS).forEach(keyword => {
    const operation = THEME.OPERATIONS[keyword];
    if (operation.OPTIONS) operation._options = Object.values(operation.OPTIONS);
  });

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

  // clear-sky-theme:         01 02 03 __ __ 06 07 __ __ __ __ 12 13
  // citrus-theme:            __ __ __ 04 05 06 07 08 09 10 __ __ __
  // sunrise-theme:           01 02 03 04 05 __ 07 __ __ 10 11 __ __
  // ___________________________________________________________
  // "themes": [...]          01 02 03 __ __ 06 07 __ __ __ __ 12 13
  // "overridden": "all"      01 02 03 __ __ 06 07 __ __ __ __ 12 13
  // "extended": "difference" 01 02 03 04 05 06 07 08 09 10 11 12 13

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

  _isValidOption(operation, option) {
    // only string and Array are allowed
    if (typeof option !== 'string' && !Array.isArray(option)) return false;
    if (typeof option === 'string' && !operation._options.includes(option)) return false;
    return true;
  }

  _themesTask(themes) {
    this._themes = [...themes];
    this._generated = this._styles[this._themes[0]];
  }

  _resetTask(value) {
    // TODO: not implemented
  }

  _overrideTask(option) {
    const { OVERRIDE } = THEME.OPERATIONS;
    if (!this._isValidOption(OVERRIDE, option)) return;

    if (option === OVERRIDE.OPTIONS.ALL) {
      for (const theme of this._themes) {
        for (const component of Object.keys(this._styles[theme])) {
          if (!this._generated[component]) continue;

          // TODO: production mode
          // this._generated[component] = this._styles[theme][component];

          this._generated[component] = { ...this._styles[theme][component], _from: `${theme} | ${OVERRIDE.KEYWORD}` }
        }
      }
      return;
    }

    // TODO: for Array<Components>
  }

  _extendTask(option) {
    const { EXTEND } = THEME.OPERATIONS;
    if (!this._isValidOption(EXTEND, option)) return;

    if (option === EXTEND.OPTIONS.ALL) {

    }
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

    console.log('themes', run._themes);
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
