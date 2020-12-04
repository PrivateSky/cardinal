class FlagManager {
  constructor(options = []) {
    try {
      let args = process.argv;
      if (process.env.npm_config_argv) {
        args.concat(JSON.parse(process.env.npm_config_argv).original)
      }
      this.flags = args.filter(arg => arg.substr(0, 2) === '--');
      for (const flag of options) { this.add(flag); }
    } catch (error) {
      console.error('FlagManager:', error)
      this.flags = [];
    }
  }

  get toArray() {
    return this.flags;
  }

  add(flag) {
    if (flag && !this.flags.includes(flag)) {
      this.flags.push(flag);
    }
  }
}

module.exports = FlagManager;
