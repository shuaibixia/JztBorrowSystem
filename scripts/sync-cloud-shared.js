const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'cloudfunctions', '_shared');
const targets = [
  'admin-web',
  'approval',
  'equipment',
  'maintenance',
  'migration',
  'notification',
  'record',
  'reservation',
  'stats',
  'user',
];

for (const target of targets) {
  const targetDir = path.join(root, 'cloudfunctions', target, '_shared');
  fs.mkdirSync(targetDir, { recursive: true });
  for (const file of fs.readdirSync(sourceDir)) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
  }
}

console.log('cloud shared modules synced');
