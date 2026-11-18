import http from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { act, advance, createState, validState, migrateState, PERSONALITIES } from './game.js';

const root = path.resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const dataDir = process.env.NURTURE_DATA_DIR || fileURLToPath(new URL('../data/', import.meta.url));
const savePath = path.join(dataDir, 'save.json');
const port = Number(process.env.PORT || 4173);
await mkdir(dataDir, { recursive: true });
let state, raw, upgraded = false;
try { raw = await readFile(savePath, 'utf8'); }
catch (e) { if (e.code !== 'ENOENT') throw e; }
if (raw !== undefined) {
  try {
    state = migrateState(JSON.parse(raw));
    if (!validState(state)) throw new Error('Unsupported or damaged save file');
    upgraded = JSON.parse(raw)?.version === 1;
  } catch {
    await rename(savePath, `${savePath}.invalid-${Date.now()}`);
    console.warn('Unreadable save preserved as a backup; starting a new habitat.');
    state = createState();
  }
  if (upgraded) {
    try { await writeFile(`${savePath}.v1-backup`, raw, { flag: 'wx' }); }
    catch (e) { if (e.code !== 'EEXIST') throw e; }
  }
} else state = createState();
async function persist(next) {
  await writeFile(`${savePath}.tmp`, JSON.stringify(next, null, 2));
  await rename(`${savePath}.tmp`, savePath);
  state = next;
}
await persist(advance(state));
let queue = Promise.resolve();
function serial(fn) { const result = queue.then(fn); queue = result.catch(() => {}); return result; }
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mp4': 'video/mp4', '.gif': 'image/gif', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
function json(res, code, payload) { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(payload)); }
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'");
  try {
    const allowedHosts = [`127.0.0.1:${port}`, `localhost:${port}`];
    if (!allowedHosts.includes(req.headers.host)) return json(res, 403, { error: 'Local requests only.' });
    if (req.headers.origin && !allowedHosts.some(h => req.headers.origin === `http://${h}`)) return json(res, 403, { error: 'Origin not allowed.' });
    const pathname = new URL(req.url, `http://127.0.0.1:${port}`).pathname;
    if (pathname === '/api/state' && req.method === 'GET') {
      const payload = await serial(async () => { const next = advance(state, Date.now(), { ambient: true }); await persist(next); return { state: next, personalities: PERSONALITIES }; });
      return json(res, 200, payload);
    }
    if (pathname === '/api/action' && req.method === 'POST') {
      if (!(req.headers['content-type'] || '').startsWith('application/json')) return json(res, 415, { error: 'JSON required.' });
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 4096) return json(res, 413, { error: 'Request too large.' }); }
      let action;
      try { action = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid JSON.' }); }
      const payload = await serial(async () => {
        let next;
        try { next = act(state, action); } catch (e) { e.status = 400; throw e; }
        await persist(next); return { state: next, personalities: PERSONALITIES };
      });
      return json(res, 200, payload);
    }
    if (pathname.startsWith('/api/')) return json(res, 404, { error: 'Unknown endpoint.' });
    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' });
    const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const file = path.resolve(root, `.${relative}`);
    if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) return json(res, 403, { error: 'Forbidden.' });
    let content;
    try { content = await readFile(file); } catch { return json(res, 404, { error: 'Not found.' }); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (e) { console.error(e.message); json(res, e.status || 500, { error: e.status ? e.message : 'Could not save. Please check available disk space and retry.' }); }
});
server.listen(port, '127.0.0.1', () => console.log(`Nurture Game is ready at http://127.0.0.1:${port}`));
server.on('error', e => { console.error(e.message); process.exitCode = 1; });
