const FLAGS = {
  DEVELOPMENT: '--dev',

  get: () => {
    try {
      const npm_args = JSON.parse(process.env.npm_config_argv)
        .original.slice(2)
        .filter(value => !process.argv.includes(value));
      const args = [...process.argv, ...npm_args];
      return args.filter(arg => arg.substr(0, 2) === '--');
    } catch (err) {
      console.error('FLAGS.get():', err)
      return [];
    }
  }
}

module.exports = FLAGS;
