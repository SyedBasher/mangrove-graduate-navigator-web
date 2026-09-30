import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const source = 'web/assets/mangrove-graduate-navigator-icon.svg';
const outputDir = 'web/assets';

await mkdir(outputDir, { recursive: true });

const icons = [
  ['favicon-64.png', 64],
  ['mangrove-graduate-navigator-icon-180.png', 180],
  ['mangrove-graduate-navigator-icon-192.png', 192],
  ['mangrove-graduate-navigator-icon-512.png', 512],
  ['mangrove-graduate-navigator-logo-1024.png', 1024],
];

for (const [name, size] of icons) {
  await sharp(source, { density: 300 })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(`${outputDir}/${name}`);
}
