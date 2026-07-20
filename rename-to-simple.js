const fs = require('fs');
const path = require('path');
const desktop = path.join('C:', 'Users', 'PC', 'Desktop');
const destName = 'AyoubWorkTechStore';

const files = fs.readdirSync(desktop, { withFileTypes: true });
const candidate = files.find((entry) => entry.isDirectory() && entry.name.startsWith('Ayoub'));
if (!candidate) {
  fs.writeFileSync(path.join(desktop, 'rename-action-log.txt'), 'No folder starting with Ayoub found on desktop.');
  process.exit(1);
}

const source = path.join(desktop, candidate.name);
const dest = path.join(desktop, destName);
if (fs.existsSync(dest)) {
  fs.rmdirSync(dest, { recursive: true });
}
fs.renameSync(source, dest);
fs.writeFileSync(path.join(desktop, 'rename-action-log.txt'), `Renamed ${candidate.name} -> ${destName}`);
console.log('done');
