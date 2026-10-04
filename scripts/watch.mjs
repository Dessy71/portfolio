#!/usr/bin/env node
/**
 * Watch mode — rebuilds site/index.html whenever anything in src/ changes.
 *
 *   npm run dev        (or: node scripts/watch.mjs)
 *
 * Keep it running while you work: change an image, a style, a line of text,
 * and the page is rebuilt in well under a second. Refresh the browser to see it.
 *
 * Zero dependencies. Uses mtime+size polling rather than fs.watch so it behaves
 * identically on Windows, macOS and Linux.
 */
import { spawn } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const INTERVAL = 700;

const c = { dim: '\x1b[2m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', reset: '\x1b[0m' };

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

/** cheap fingerprint of the whole source tree */
async function fingerprint() {
  const files = (await walk(SRC)).sort();
  const parts = await Promise.all(files.map(async (f) => {
    const st = await stat(f);
    return `${path.relative(SRC, f)}:${st.size}:${st.mtimeMs}`;
  }));
  return parts.join('|');
}

function build() {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const child = spawn(process.execPath, [path.join(root, 'build.mjs')], { stdio: 'inherit' });
    child.on('exit', (code) => {
      const ms = Date.now() - t0;
      if (code === 0) console.log(`${c.cyan}↻ rebuilt in ${ms}ms${c.reset} ${c.dim}— refresh your browser${c.reset}\n`);
      else console.log(`${c.yellow}✖ build failed (exit ${code})${c.reset}\n`);
      resolve();
    });
  });
}

console.log(`${c.green}▶ watching src/${c.reset} ${c.dim}— press Ctrl+C to stop${c.reset}\n`);
await build();

let last = await fingerprint();
let busy = false;

setInterval(async () => {
  if (busy) return;
  const now = await fingerprint();
  if (now === last) return;
  last = now;
  busy = true;
  console.log(`${c.dim}change detected →${c.reset}`);
  await build();
  busy = false;
}, INTERVAL);
