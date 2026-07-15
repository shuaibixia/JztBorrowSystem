const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cloudfunctionsDir = path.join(root, 'cloudfunctions');
const ignoredCloudDirs = new Set(['_shared']);

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
}

function getFunctionDirs() {
  return fs.readdirSync(cloudfunctionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !ignoredCloudDirs.has(name))
    .sort();
}

function uniqueSorted(items) {
  return Array.from(new Set(items)).sort();
}

function diff(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => !rightSet.has(item));
}

function extractSyncTargets() {
  const text = fs.readFileSync(path.join(root, 'scripts', 'sync-cloud-shared.js'), 'utf8');
  const match = text.match(/const\s+targets\s*=\s*\[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Cannot find targets array in scripts/sync-cloud-shared.js');
  }
  const targets = [];
  const itemPattern = /['"]([^'"]+)['"]/g;
  let item = itemPattern.exec(match[1]);
  while (item) {
    targets.push(item[1]);
    item = itemPattern.exec(match[1]);
  }
  return uniqueSorted(targets);
}

const functionDirs = getFunctionDirs();
const cloudbaserc = readJson('cloudbaserc.json');
const packageJson = readJson('package.json');
const configFunctions = uniqueSorted((cloudbaserc.functions || []).map((item) => item.name));
const deployScripts = uniqueSorted(
  Object.keys(packageJson.scripts || {})
    .filter((name) => name.startsWith('deploy:') && name !== 'deploy:all')
    .map((name) => name.replace(/^deploy:/, ''))
);
const syncTargets = extractSyncTargets();

const failures = [];

function compare(label, actual) {
  const missingFromActual = diff(functionDirs, actual);
  const extraInActual = diff(actual, functionDirs);
  if (missingFromActual.length > 0 || extraInActual.length > 0) {
    failures.push(`${label} mismatch. missing=[${missingFromActual.join(', ')}] extra=[${extraInActual.join(', ')}]`);
  }
}

compare('cloudbaserc functions', configFunctions);
compare('package deploy scripts', deployScripts);
compare('sync-cloud-shared targets', syncTargets);

for (const fn of functionDirs) {
  const packagePath = path.join(cloudfunctionsDir, fn, 'package.json');
  const indexPath = path.join(cloudfunctionsDir, fn, 'index.js');
  if (!fs.existsSync(packagePath)) {
    failures.push(`cloudfunctions/${fn}/package.json is missing`);
  }
  if (!fs.existsSync(indexPath)) {
    failures.push(`cloudfunctions/${fn}/index.js is missing`);
  }
}

if (!packageJson.scripts || !packageJson.scripts['deploy:all']) {
  failures.push('package.json script deploy:all is missing');
}

if (failures.length > 0) {
  console.error('Function list check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Function list check passed (${functionDirs.length} functions)`);
