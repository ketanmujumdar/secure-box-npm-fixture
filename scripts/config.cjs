'use strict';

const fs = require('node:fs');
const path = require('node:path');
// Read only this dedicated fixture, never .env or the surrounding environment.
const source = fs.readFileSync(path.join(__dirname, '..', '.env.simulation'), 'utf8');
const allowed = [
  'SIMULATED_APP_NAME', 'SIMULATED_PORT', 'SIMULATED_API_TOKEN',
  'SIMULATED_DATABASE_URL', 'SIMULATED_SESSION_SECRET'
];
const config = {};
for (const line of source.split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match && allowed.includes(match[1])) config[match[1]] = match[2].trim();
}
for (const key of allowed) {
  if (!config[key]) throw new Error(`Missing fixture setting: ${key}`);
}
if (!/^\d+$/.test(config.SIMULATED_PORT) || Number(config.SIMULATED_PORT) < 1024 || Number(config.SIMULATED_PORT) > 65535) {
  throw new Error('SIMULATED_PORT must be an integer from 1024 to 65535');
}
if (!config.SIMULATED_API_TOKEN.startsWith('FAKE-') ||
    !config.SIMULATED_SESSION_SECRET.startsWith('FAKE-') ||
    config.SIMULATED_DATABASE_URL !== 'postgres://fake_user:fake_password@database.invalid/demo') {
  throw new Error('Use only fake fixture credentials in .env.simulation');
}
module.exports = Object.freeze(config);
