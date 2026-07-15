const { callCloud } = require('./cloud');

function dryRun() {
  return callCloud('migration', { action: 'dryRun' });
}

function apply() {
  return callCloud('migration', { action: 'apply' });
}

module.exports = {
  dryRun,
  apply,
};
