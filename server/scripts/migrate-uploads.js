const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getUploadsDir } = require('../config/uploadStorage');

const sourceDir = path.resolve(__dirname, '../uploads');
const targetDir = getUploadsDir();

function moveFiles(source, target) {
  if (!fs.existsSync(source)) return 0;
  let moved = 0;

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      moved += moveFiles(sourcePath, targetPath);
      continue;
    }
    if (!entry.isFile()) continue;

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
    }
    const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');
    const targetHash = crypto.createHash('sha256').update(fs.readFileSync(targetPath)).digest('hex');
    if (sourceHash !== targetHash) {
      throw new Error(`Upload migration verification failed for ${entry.name}; source was kept.`);
    }
    fs.unlinkSync(sourcePath);
    moved += 1;
  }

  return moved;
}

const moved = moveFiles(sourceDir, targetDir);
console.log(`Moved ${moved} upload file(s) to ${targetDir} after checksum verification.`);
