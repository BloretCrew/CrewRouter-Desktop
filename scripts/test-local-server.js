'use strict';

const fs = require('node:fs');
const fsp = fs.promises;
const os = require('node:os');
const path = require('node:path');
const { LocalServerManager, findFreePort, resolveServerEntry } = require('../src/server-manager');

function fail(message) { throw new Error(message); }

(async () => {
  const packaged = process.argv.includes('--packaged');
  const root = process.env.CREWROUTER_SERVER_ROOT;
  const resourceRoot = process.env.CREWROUTER_RESOURCE_ROOT || path.join(__dirname, '..', 'staging', 'server');
  const serverEntry = packaged
    ? resolveServerEntry('packaged', { resourceRoot })
    : resolveServerEntry('development', { serverRoot: root, resourceRoot });
  const bundleRoot = path.dirname(serverEntry);
  for (const forbidden of ['.env', '.env.local']) {
    if (fs.existsSync(path.join(bundleRoot, forbidden))) fail(`Unsafe packaged file found: ${forbidden}`);
  }
  const userData = await fsp.mkdtemp(path.join(os.tmpdir(), 'crewrouter-local-test-'));
  const manager = new LocalServerManager({ mode: packaged ? 'packaged' : 'development', serverEntry, userData, startupTimeoutMs: 30000 });
  let status;
  try {
    status = await manager.start();
    if (!status.ready || !status.version || !status.edition || !status.setup || typeof status.setup.needsSetup !== 'boolean') fail('Local server did not provide complete health metadata');
    console.log(JSON.stringify({ ...status, resourceRoot: packaged ? resourceRoot : undefined }));
  } finally {
    await manager.stop();
    if (!status?.ready) {
      const logPath = path.join(userData, 'logs', 'server.log');
      if (fs.existsSync(logPath)) console.error(`Server log:\n${await fsp.readFile(logPath, 'utf8')}`);
    }
    await fsp.rm(userData, { recursive: true, force: true });
  }
})().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
