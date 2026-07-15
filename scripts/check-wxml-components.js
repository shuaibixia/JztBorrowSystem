const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appJsonPath = path.join(root, 'app.json');
const scanDirs = ['pages', 'components', 'custom-tab-bar'];
const nativeTags = new Set([
  'block',
  'button',
  'canvas',
  'checkbox',
  'checkbox-group',
  'cover-image',
  'cover-view',
  'editor',
  'form',
  'icon',
  'image',
  'input',
  'label',
  'map',
  'movable-area',
  'movable-view',
  'navigator',
  'open-data',
  'picker',
  'picker-view',
  'picker-view-column',
  'progress',
  'radio',
  'radio-group',
  'rich-text',
  'scroll-view',
  'slider',
  'slot',
  'swiper',
  'swiper-item',
  'switch',
  'template',
  'text',
  'textarea',
  'view',
  'video',
  'web-view',
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function walk(dir, files) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'miniprogram_npm') continue;
      walk(fullPath, files);
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith('.wxml') || entry.name.endsWith('.json'))) {
      files.push(fullPath);
    }
  }
}

function toPosix(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function resolveComponentPath(fromJson, componentPath) {
  if (componentPath.startsWith('/')) {
    return path.join(root, componentPath.slice(1));
  }
  if (componentPath.startsWith('.')) {
    return path.resolve(path.dirname(fromJson), componentPath);
  }
  return path.join(root, 'miniprogram_npm', componentPath);
}

function componentExists(fromJson, componentPath) {
  const resolved = resolveComponentPath(fromJson, componentPath);
  return fs.existsSync(`${resolved}.json`) || fs.existsSync(`${resolved}.wxml`);
}

function tagsInWxml(file) {
  const text = fs.readFileSync(file, 'utf8');
  const tags = new Set();
  const pattern = /<\/?([a-z][a-z0-9-]*)\b/g;
  let match = pattern.exec(text);
  while (match) {
    const tag = match[1];
    if (!nativeTags.has(tag) && tag.includes('-')) {
      tags.add(tag);
    }
    match = pattern.exec(text);
  }
  return Array.from(tags).sort();
}

const globalComponents = fs.existsSync(appJsonPath)
  ? (readJson(appJsonPath).usingComponents || {})
  : {};

const files = [];
for (const dir of scanDirs) {
  walk(path.join(root, dir), files);
}

const violations = [];

for (const file of files.filter((item) => item.endsWith('.json'))) {
  let json;
  try {
    json = readJson(file);
  } catch (err) {
    violations.push(`${toPosix(file)}: invalid JSON: ${err.message}`);
    continue;
  }
  for (const [name, componentPath] of Object.entries(json.usingComponents || {})) {
    if (!componentExists(file, componentPath)) {
      violations.push(`${toPosix(file)}: ${name} path not found: ${componentPath}`);
    }
  }
}

for (const wxmlFile of files.filter((item) => item.endsWith('.wxml'))) {
  const jsonFile = wxmlFile.replace(/\.wxml$/, '.json');
  let localComponents = {};
  if (fs.existsSync(jsonFile)) {
    try {
      localComponents = readJson(jsonFile).usingComponents || {};
    } catch (err) {
      violations.push(`${toPosix(jsonFile)}: invalid JSON: ${err.message}`);
      continue;
    }
  }

  const availableComponents = { ...globalComponents, ...localComponents };
  for (const tag of tagsInWxml(wxmlFile)) {
    if (!availableComponents[tag]) {
      violations.push(`${toPosix(wxmlFile)}: uses <${tag}> but it is not registered`);
    }
  }
}

if (violations.length > 0) {
  console.error('WXML component check failed:');
  for (const item of violations) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log('WXML component check passed');
