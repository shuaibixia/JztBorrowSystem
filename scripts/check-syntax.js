const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const scanDirs = [
  'cloudfunctions',
  'pages',
  'utils',
  'behaviors',
  'components',
  'custom-tab-bar',
  'tests',
  'scripts',
];

function walk(dir, files) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'miniprogram_npm') continue;
      walk(fullPath, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
}

const files = [];
for (const dir of scanDirs) {
  walk(path.join(root, dir), files);
}

const failures = [];
for (const file of files.sort()) {
  const res = spawnSync(process.execPath, ['-c', file], {
    cwd: root,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    failures.push({
      file: path.relative(root, file),
      output: `${res.stdout || ''}${res.stderr || ''}`.trim(),
    });
  }
}

if (failures.length > 0) {
  console.error('JS syntax check failed:');
  for (const failure of failures) {
    console.error(`\n${failure.file}`);
    console.error(failure.output);
  }
  process.exit(1);
}

console.log(`JS syntax check passed (${files.length} files)`);
