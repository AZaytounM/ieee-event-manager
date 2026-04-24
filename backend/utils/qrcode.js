const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const QR_DIR = path.join(__dirname, '..', 'qrcodes');

async function generateQRCode(token, participantId) {
  if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

  const checkInUrl = `${process.env.APP_URL || 'http://localhost:3001'}/api/checkin/${token}`;
  const filename = `${participantId}.png`;
  const filepath = path.join(QR_DIR, filename);

  await QRCode.toFile(filepath, checkInUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#00629B', light: '#FFFFFF' }
  });

  return { filepath, filename, url: checkInUrl };
}

async function generateQRCodeBase64(token) {
  const checkInUrl = `${process.env.APP_URL || 'http://localhost:3001'}/api/checkin/${token}`;
  return await QRCode.toDataURL(checkInUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2,
    color: { dark: '#00629B', light: '#FFFFFF' }
  });
}

module.exports = { generateQRCode, generateQRCodeBase64 };
