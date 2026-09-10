const fs = require('fs');
const path = require('path');

async function saveBase64Image(dataUrl, targetFolder, baseName) {
  const match = dataUrl.match(/^data:(image\/(png|jpe?g|webp));base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image format. Use base64 data URI for PNG, JPEG or WEBP.');
  }

  const mimeType = match[1];
  const payload = match[3];
  const extension = mimeType.includes('jpeg') ? 'jpg' : mimeType.split('/')[1];
  const folderPath = path.join(__dirname, '..', 'uploads', targetFolder);
  await fs.promises.mkdir(folderPath, { recursive: true });
  const fileName = `${baseName}.${extension}`;
  const filePath = path.join(folderPath, fileName);

  const buffer = Buffer.from(payload, 'base64');
  await fs.promises.writeFile(filePath, buffer);

  return `/api/uploads/${targetFolder}/${fileName}`;
}

module.exports = {
  saveBase64Image
};
