const ENV_ID = 'studentpress-d6gj8ugww75193e6d';
const SETUP_CODE = 'admin2026';

function initCloud(cloud) {
  cloud.init({ env: ENV_ID });
}

module.exports = {
  ENV_ID,
  SETUP_CODE,
  initCloud,
};
