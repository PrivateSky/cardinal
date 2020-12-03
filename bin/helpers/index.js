const FlagManager = require('./flags');
const callback = require('./octopus');
const removeWarnings = require('./remove_warnings_plugin');

module.exports = {
  FlagManager,
  octopusCallback: callback,
  removeWarnings
};
