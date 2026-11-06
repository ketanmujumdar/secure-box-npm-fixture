'use strict';

// Optional local baseline receiver. Binds only to loopback and writes no files.
const http = require('node:http');
http.createServer((request, response) => {
  if (request.method !== 'POST' || request.url !== '/collect') {
    response.writeHead(404).end();
    return;
  }
  let body = '';
  request.on('data', chunk => {
    body += chunk;
    if (Buffer.byteLength(body) > 16384) request.destroy();
  });
  request.on('end', () => {
    try {
      console.log('[COLLECTOR] Received:', JSON.stringify(JSON.parse(body), null, 2));
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"received":true}');
    } catch {
      response.writeHead(400).end();
    }
  });
  request.on('error', () => {});
}).listen(8787, '127.0.0.1', () => {
  console.log('Local collector: http://127.0.0.1:8787/collect (Ctrl+C to stop)');
});
