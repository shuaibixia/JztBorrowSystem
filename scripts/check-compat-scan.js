const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scanDirs = ['cloudfunctions', 'pages', 'utils', 'behaviors', 'components', 'custom-tab-bar'];

const deprecatedCalls = [
  { cloud: 'approval', action: 'createReservation', allowed: ['cloudfunctions/approval/index.js'] },
  { cloud: 'approval', action: 'listReservations', allowed: ['cloudfunctions/approval/index.js'] },
  { cloud: 'approval', action: 'getMyReservations', allowed: ['cloudfunctions/approval/index.js'] },
  { cloud: 'approval', action: 'cancelReservation', allowed: ['cloudfunctions/approval/index.js'] },
  { cloud: 'approval', action: 'confirmReservation', allowed: ['cloudfunctions/approval/index.js'] },
  { cloud: 'approval', action: 'getReservationById', allowed: ['cloudfunctions/approval/index.js'] },
  { cloud: 'record', action: 'getStats', allowed: ['cloudfunctions/record/index.js'] },
  { cloud: 'record', action: 'addMaintenance', allowed: ['cloudfunctions/record/index.js'] },
  { cloud: 'record', action: 'getMaintenance', allowed: ['cloudfunctions/record/index.js'] },
];

const legacyWriteFields = ['qr_code', 'applicantOpenId', 'reviewerOpenId'];
const legacyWriteAllowedPrefixes = [
  'cloudfunctions/migration/',
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

function toPosixRelative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

function findDeprecatedCallMatches(text, item) {
  const cloud = item.cloud.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const action = item.action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`callCloud\\(\\s*['"]${cloud}['"][\\s\\S]{0,240}?action\\s*:\\s*['"]${action}['"]`, 'g'),
    new RegExp(`(?:wx\\.)?cloud\\.callFunction\\(\\s*\\{[\\s\\S]{0,360}?name\\s*:\\s*['"]${cloud}['"][\\s\\S]{0,360}?action\\s*:\\s*['"]${action}['"]`, 'g'),
  ];
  const matches = [];
  for (const pattern of patterns) {
    let match = pattern.exec(text);
    while (match) {
      matches.push(match.index);
      match = pattern.exec(text);
    }
  }
  return matches;
}

const files = [];
for (const dir of scanDirs) {
  walk(path.join(root, dir), files);
}

const violations = [];

for (const file of files) {
  const rel = toPosixRelative(file);
  const text = fs.readFileSync(file, 'utf8');

  for (const item of deprecatedCalls) {
    if (item.allowed.includes(rel)) continue;
    for (const index of findDeprecatedCallMatches(text, item)) {
      violations.push({
        file: rel,
        line: lineNumberAt(text, index),
        message: `deprecated action call ${item.cloud}.${item.action}`,
      });
    }
  }

  const allowLegacyWrites = legacyWriteAllowedPrefixes.some((prefix) => rel.startsWith(prefix));
  if (!allowLegacyWrites) {
    for (const field of legacyWriteFields) {
      const pattern = new RegExp(`\\b${field}\\s*:`, 'g');
      let match = pattern.exec(text);
      while (match) {
        violations.push({
          file: rel,
          line: lineNumberAt(text, match.index),
          message: `legacy field write-like key ${field}`,
        });
        match = pattern.exec(text);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Compatibility scan failed:');
  for (const item of violations) {
    console.error(`${item.file}:${item.line} ${item.message}`);
  }
  process.exit(1);
}

console.log('Compatibility scan passed');
