const FlagManager = require('./flags');
const callback = require('./octopus');
const remove_warnings = require('./remove_warnings_plugin')

module.exports = {
  FlagManager,
  octopusCallback: callback,
  remove_warnings
};
