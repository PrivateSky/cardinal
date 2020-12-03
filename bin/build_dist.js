/**
 * @deprecated Use build_core.js and build_extended.js
 * Kept only for backward compatibility
 **/

const { SCOPE, FLAGS, run } = require('./cardinal');
run(SCOPE.CORE, [ FLAGS.ROOT_FOLDER, FLAGS.ONLY_MODULE ]);
