#!/usr/bin/env node
/**
 * Tiny zero-dependency static server for local preview.
 *
 *   node scripts/serve.mjs [port]      (or: npm run preview)
 *   → http://localhost:5173
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const port = Number(process.argv[2] || process.env.PORT || 5173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(root, url === '/' ? 'index.html' : url);
    if (path.relative(root, file).startsWith('..')) throw new Error('outside root');

    const info = await stat(file).catch(() => null);
    if (info?.isDirectory()) file = path.join(file, 'index.html');

    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
    }).end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('404 — not built yet? run: npm run build');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`▶ preview running →  http://localhost:${port}`);
  console.log(`  serving ${path.relative(process.cwd(), root) || 'site'}/index.html  (Ctrl+C to stop)`);
});
