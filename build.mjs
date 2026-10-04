#!/usr/bin/env node
/**
 * Zero-dependency build.
 *
 *   src/template.html + src/styles.css + src/main.js + src/assets/**
 *          ↓
 *   site/index.html      ← ONE self-contained file (fonts, images and the CV
 *                          embedded as data URIs). Nothing else is emitted.
 *
 * Usage:  node build.mjs      (or: npm run build)
 */
import { readFile, writeFile, mkdir, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not url.pathname) — works with spaces, #, & and Windows drive
// letters in the project path
const root = path.dirname(fileURLToPath(import.meta.url));
const SRC  = path.join(root, 'src');
const SITE = path.join(root, 'site');

const MIME = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.avif': 'image/avif',
};
const mime = (f) => MIME[path.extname(f).toLowerCase()] || 'application/octet-stream';
const dataURI = (buf, file) => `data:${mime(file)};base64,${buf.toString('base64')}`;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

/* ------------------------------------------------------------- 1. clean out */
await rm(SITE, { recursive: true, force: true });
await mkdir(SITE, { recursive: true });

/* ------------------------------------------------------------- 2. read src */
let html   = await readFile(path.join(SRC, 'template.html'), 'utf8');
let styles = await readFile(path.join(SRC, 'styles.css'), 'utf8');
const fonts = await readFile(path.join(SRC, 'assets', 'fonts.css'), 'utf8');
const js    = await readFile(path.join(SRC, 'main.js'), 'utf8');

/* --------------------------------------------- 3. inline the self-hosted fonts */
const fontCSS = await Promise.all(
  fonts.split('\n').filter(Boolean).map(async (line) => {
    const m = line.match(/url\('\.\/fonts\/([^']+)'\)/);
    if (!m) return line;
    const buf = await readFile(path.join(SRC, 'assets', 'fonts', m[1]));
    // function replacer keeps $$ / $& literal inside the data URI
    return line.replace(m[0], () => `url('${dataURI(buf, m[1])}')`);
  })
);
styles = styles.replace("@import './assets/fonts.css';", fontCSS.join('\n'));

/* ------------------------------------------- 4. inline images + the CV (once) */
const assets = await Promise.all((await walk(path.join(SRC, 'assets'))).map(async (file) => {
  const buf = await readFile(file);
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  return { rel, uri: dataURI(buf, file), size: (await stat(file)).size };
}));

for (const { rel, uri } of assets) {
  html = html.split(`src="${rel}"`).join(`src="${uri}"`);   // split/join = no $ pitfalls
}

const cv = assets.find(a => a.rel.endsWith('.pdf'));
if (cv) {
  html = html
    .split('href="assets/DESMOND-Antwi-CV.pdf"').join('href="#" data-cv-link')
    .replace('</head>', () => `<script>window.DESSY_CV=${JSON.stringify(cv.uri)}</script>\n</head>`);
}

/* ------------------------------------------------------------- 5. write page */
// NOTE: always use function replacers — the inlined CSS/JS legitimately contains
// $$ and $& sequences which String.replace would otherwise expand.
html = html
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${styles}\n</style>`)
  .replace('<script src="main.js" defer></script>', () => `<script>\n${js}\n</script>`);

const out = path.join(SITE, 'index.html');
const built = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
await writeFile(out, `<!--
  GENERATED FILE — do not edit this one.
  Built from src/ by build.mjs on ${built}.

  Edit src/template.html, src/styles.css, src/main.js or src/assets/**,
  then run:  npm run build      (or: npm run dev  to rebuild on every save)
-->
${html}`);

/* ---------------------------------------------------------------- 6. report */
const size = (await stat(out)).size;
const kb = (b) => `${(b / 1024).toFixed(0)} KB`;

// measure the bytes each payload actually contributes to the file (base64 included)
const inlinedBytes = (pred) => assets.filter(pred).reduce((a, x) => a + x.uri.length, 0);
const imgB  = inlinedBytes(a => a.rel.includes('/img/'));
const fontB = inlinedBytes(a => a.rel.endsWith('.woff2'));
const cvB   = cv ? cv.uri.length : 0;
const markupB = size - imgB - fontB - cvB;

console.log('✔ build complete — one self-contained file\n');
console.log(`  site/index.html   ${kb(size)}`);
console.log(`  ├─ markup + css + js   ${kb(markupB)}`);
console.log(`  ├─ images              ${kb(imgB)}  (${assets.filter(a => a.rel.includes('/img/')).length} webp, inlined)`);
console.log(`  ├─ fonts               ${kb(fontB)}  (${assets.filter(a => a.rel.endsWith('.woff2')).length} subset woff2, inlined)`);
console.log(`  └─ résumé PDF          ${kb(cvB)}  (${cv ? 'inlined — download works with no server' : 'MISSING'})`);
console.log('\n  nothing else was emitted — deploy the site/ folder as-is.');
