const path = require('path');
// const octopus = require('octopus');

const ThemeBuilder = require('./builder/Theme');
const { FLAGS } = require('./helpers');

const cardinal = {
  distribution: {
    build: (production = true) => ({
      name: 'build-cardinal-dist',
      actions: [
        {
          type: 'execute',
          cmd: `npm run build-${production ? 'prod' : 'dev'}`
        }
      ]
    }),

    copy: (destination) => ({
      name: 'copy-cardinal-dist',
      actions: [
        {
          type: 'copy',
          src: './dist/cardinal',
          target: path.join(destination, 'cardinal'),
          options: { 'overwrite': true }
        }
      ]
    })
  },

  theme: {
    build: (production = true) => new ThemeBuilder(production).run()
  }
}

function generateDistribution() {
  const args = process.argv;
  const flags = FLAGS.get();

  if (args.length !== 3) {
    console.error(`Usage: node build_dist.js <path_for_cardinal_distribution> [${FLAGS.DEVELOPMENT}]\n`);
    process.exit(1);
  }

  const destination = args[2];
  const production = !flags.includes(FLAGS.DEVELOPMENT);

  return {
    workDir: '.',
    dependencies: [
      cardinal.distribution.build(production),
      cardinal.distribution.copy(destination),
      cardinal.theme.build(production)
    ]
  }
}

generateDistribution();

// octopus.run(generateDistribution(), (err, result) => {
//   if (err) {
//     throw err;
//   }
//   console.log('\nOctopus result:', result);
//   console.log('Job done!');
// })
