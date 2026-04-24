/**
 * Generates placeholder PNG assets for the Expo app.
 * Run once with: node generate-assets.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([t, data]);
  const crcOut = Buffer.alloc(4);
  crcOut.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, t, data, crcOut]);
}

/**
 * Creates a PNG with a colored background and simple white rounded-rect emblem.
 * Pure Node.js, no native dependencies.
 */
function makePNG(w, h, bg, fg) {
  const [br, bg2, bb] = bg;
  const [fr, fg2, fb] = fg;

  // RGBA raw data
  const raw = Buffer.alloc(h * (1 + w * 4));
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) * 0.28;

  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter byte
    for (let x = 0; x < w; x++) {
      const off = y * (1 + w * 4) + 1 + x * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Emblem: filled circle
      if (dist <= r) {
        raw[off]     = fr;
        raw[off + 1] = fg2;
        raw[off + 2] = fb;
        raw[off + 3] = 255;
      } else {
        raw[off]     = br;
        raw[off + 1] = bg2;
        raw[off + 2] = bb;
        raw[off + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

const assetsDir = path.join(__dirname, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

// Primary: #2F5BFF (47,91,255), white emblem
const blue = [47, 91, 255];
const white = [255, 255, 255];

console.log('Generating assets...');
fs.writeFileSync(path.join(assetsDir, 'icon.png'), makePNG(1024, 1024, blue, white));
console.log('  icon.png ✓');
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), makePNG(1024, 1024, blue, white));
console.log('  adaptive-icon.png ✓');
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), makePNG(48, 48, blue, white));
console.log('  favicon.png ✓');
fs.writeFileSync(path.join(assetsDir, 'splash.png'), makePNG(1242, 2436, blue, white));
console.log('  splash.png ✓');
console.log('Done! Re-run "expo start --clear" to pick up the new assets.');
