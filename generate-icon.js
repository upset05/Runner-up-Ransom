// generate-icon.js
// Run with: node generate-icon.js
// Generates icon.png and adaptive-icon.png for the app

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size, bg = '#0C0C0C') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 1024;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Outer rounded rect accent
  const pad = 80 * s;
  ctx.fillStyle = '#1A1A1A';
  roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, 80 * s);
  ctx.fill();

  // Lock body
  const cx = size / 2;
  const cy = size / 2 + 40 * s;
  const bw = 320 * s;
  const bh = 260 * s;
  const br = 40 * s;

  ctx.fillStyle = '#CAFF00';
  roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, br);
  ctx.fill();

  // Lock shackle
  ctx.strokeStyle = '#CAFF00';
  ctx.lineWidth = 60 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy - bh / 2 - 30 * s, 110 * s, Math.PI, 0, false);
  ctx.stroke();

  // Keyhole
  ctx.fillStyle = '#0C0C0C';
  ctx.beginPath();
  ctx.arc(cx, cy + 10 * s, 40 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 20 * s, cy + 10 * s, 40 * s, 60 * s);

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

// Main icon (1024x1024)
const icon = drawIcon(1024);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), icon.toBuffer('image/png'));
console.log('✓ icon.png');

// Adaptive icon foreground (1024x1024, transparent bg)
const adaptive = drawIcon(1024, '#00000000');
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptive.toBuffer('image/png'));
console.log('✓ adaptive-icon.png');

// Splash icon (200x200 centered on dark)
const splash = drawIcon(512);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), splash.toBuffer('image/png'));
console.log('✓ splash-icon.png');

console.log('All icons generated!');
