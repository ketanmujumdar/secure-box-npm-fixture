'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./scripts/config.cjs');
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const page = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
  .replaceAll('{{APP_NAME}}', escapeHtml(config.SIMULATED_APP_NAME));

// This server-side import triggers one synthetic egress attempt at startup.
// Node caches the module; page visits do not trigger additional requests.
require('./scripts/probe.cjs');

const server = http.createServer((request, response) => {
  if (request.url !== '/') {
    response.writeHead(404).end('Not found');
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(page);
});
server.on('error', error => {
  console.error('[WEBSITE] Could not start:', error.message);
  process.exitCode = 1;
});
const host = process.argv.includes('--container') ? '0.0.0.0' : '127.0.0.1';
server.listen(Number(config.SIMULATED_PORT), host, () => {
  console.log(`[WEBSITE] Open http://127.0.0.1:${config.SIMULATED_PORT}`);
});
