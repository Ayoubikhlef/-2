const fs = require('fs');
const path = require('path');
const src = path.join('C:', 'Users', 'PC', 'Desktop', "Ayoub’s Work & Tech Store (Community)");
const dest = path.join('C:', 'Users', 'PC', 'Desktop', 'AyoubWorkTechStore');
try {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.renameSync(src, dest);
  console.log('Renamed successfully');
} catch (error) {
  console.error('Rename failed:', error.message);
}
