import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brandPath = resolve(root, 'src/app/config/brand.json');
const brand = JSON.parse(readFileSync(brandPath, 'utf8'));

const siteUrl = `https://${brand.domain}`;
const image = `${siteUrl}${brand.logo}`;

const index = readFileSync(resolve(root, 'index.html'), 'utf8');

const replacements = [
  [/<title>[\s\S]*?<\/title>/, `<title>${brand.name}</title>`],
  [/(<meta name="description" content=")[^"]*(" \/>)/, `$1${brand.description}$2`],
  [/(<meta name="theme-color" content=")[^"]*(" \/>)/, `$1${brand.colors.primary}$2`],
  [/(<link rel="canonical" href=")[^"]*(" \/>)/, `$1${siteUrl}$2`],
  [/(<meta property="og:title" content=")[^"]*(" \/>)/, `$1${brand.name}$2`],
  [/(<meta property="og:description" content=")[^"]*(" \/>)/, `$1${brand.description}$2`],
  [/(<meta property="og:url" content=")[^"]*(" \/>)/, `$1${siteUrl}$2`],
  [/(<meta property="og:image" content=")[^"]*(" \/>)/, `$1${image}$2`],
  [/(<meta property="og:site_name" content=")[^"]*(" \/>)/, `$1${brand.name}$2`],
  [/(<meta name="twitter:title" content=")[^"]*(" \/>)/, `$1${brand.name}$2`],
  [/(<meta name="twitter:description" content=")[^"]*(" \/>)/, `$1${brand.description}$2`],
  [/(<meta name="twitter:image" content=")[^"]*(" \/>)/, `$1${image}$2`],
];

let updated = index;
for (const [pattern, value] of replacements) {
  updated = updated.replace(pattern, value);
}

writeFileSync(resolve(root, 'index.html'), updated);

const manifestPath = resolve(root, 'public/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.name = brand.name;
manifest.short_name = brand.initials;
manifest.description = brand.description;
manifest.theme_color = brand.colors.primary;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`[brand] ${brand.name} → ${brand.domain}`);
console.log('[brand] index.html + public/manifest.json تم تحديثهما.');
console.log('[brand] التالي: بدّل public/logo.png ثم انشر الموقع.');
