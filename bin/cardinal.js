const path = require('path');
const octopus = require('octopus');
const { FlagManager, octopusCallback } = require('./helpers');

const FLAGS = {
  DEVELOPMENT: '--dev',
  ROOT_FOLDER: '--no-root',
  ONLY_MODULE: '--only-module'
}

const SCOPE = {
  CORE: 'core',
  EXTENDED: 'extended'
}

const cardinal = {
  core: {
    build: (flags) => {
      const production = !flags.includes(FLAGS.DEVELOPMENT);
      return {
        name: 'build-cardinal-core',
        actions: [
          {
            type: 'execute',
            cmd: `npm run build-${production ? 'prod' : 'dev'}`
          }
        ]
      }
    },

    copy: (target, flags) => {
      let src = './dist';

      if (flags.includes(FLAGS.ROOT_FOLDER)) {
        target = path.join(target, 'cardinal')
      }

      if (flags.includes(FLAGS.ONLY_MODULE)) {
        src = path.join(src, 'cardinal')
      }

      return {
        name: 'copy-cardinal-core',
        actions: [
          {
            type: 'copy',
            src,
            target,
            options: { 'overwrite': true }
          }
        ]
      }
    }
  },

  extended: {
    build: (flags) => {
      const production = !flags.includes(FLAGS.DEVELOPMENT);
      return {
        name: 'build-cardinal-extended',
        actions: [
          {
            type: 'execute',
            cmd: `npm run build-${production ? 'prod' : 'dev'}`
          }
        ]
      }
    },

    copy: (target, flags) => {
      let src = './dist';

      if (flags.includes(FLAGS.ONLY_MODULE)) {
        src = path.join(src, 'cardinal')
      }

      return {
        name: 'copy-cardinal-extended',
        actions: [
          {
            type: 'copy',
            src,
            target,
            options: { 'overwrite': true }
          }
        ]
      }
    }
  }
}

function run(scope, options) {
  const args = process.argv;
  const flags = new FlagManager(options).toArray;

  if (args.length < 3) {
    console.error(`Usage: node build_dist.js <path_for_cardinal_${scope}_distribution> [${FLAGS.DEVELOPMENT}]\n`);
    process.exit(1);
  }

  const destination = args[2];
  console.log('flags', flags);

  const config = {
    workDir: '.',
    dependencies: [
      cardinal[scope].build(flags),
      cardinal[scope].copy(destination, flags)
    ]
  }

  octopus.run(config, (error, result) => {
    octopusCallback(error, result, scope);
  });
}

module.exports = { FLAGS, SCOPE, run }
