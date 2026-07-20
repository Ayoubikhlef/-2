const fs = require('fs');
const path = require('path');

const src = path.join('C:', 'Users', 'PC', 'Desktop', "Ayoub's Work & Tech Store (Community)");
const dest = path.join('C:', 'Users', 'PC', 'Desktop', 'AyoubWorkTechStore');

function copyRecursive(srcPath, destPath) {
  if (!fs.existsSync(destPath)) {
    fs.mkdirSync(destPath, { recursive: true });
  }
  
  const files = fs.readdirSync(srcPath);
  files.forEach(file => {
    const srcFile = path.join(srcPath, file);
    const destFile = path.join(destPath, file);
    const stat = fs.statSync(srcFile);
    
    if (stat.isDirectory()) {
      copyRecursive(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

try {
  copyRecursive(src, dest);
  console.log('Copy completed successfully');
} catch (error) {
  console.error('Copy failed:', error.message);
}
