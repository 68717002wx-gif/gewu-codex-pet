const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { STATES, normalizeStatus, readStatus, writeStatus } = require('../app/codex-status');

assert.deepStrictEqual(STATES, ['idle', 'thinking', 'running', 'success', 'error']);
const now = () => new Date('2026-08-19T08:00:00.000Z');
assert.deepStrictEqual(normalizeStatus({ state: 'RUNNING', message: ' task ', progress: '45', taskId: 'a-1' }, now), {
  version: 1,
  type: 'codex-status',
  state: 'running',
  message: 'task',
  source: 'cli',
  taskId: 'a-1',
  progress: 45,
  updatedAt: '2026-08-19T08:00:00.000Z',
});
assert.throws(() => normalizeStatus({ state: 'unknown' }), /Invalid state/);
assert.throws(() => normalizeStatus({ state: 'running', progress: 101 }), /between 0 and 100/);

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gewu-status-'));
const filePath = path.join(directory, 'status.json');
const written = writeStatus(filePath, { state: 'success', message: 'done', source: 'test' });
const read = readStatus(filePath);
assert.strictEqual(read.state, 'success');
assert.strictEqual(read.message, 'done');
assert.strictEqual(read.source, 'test');
assert.strictEqual(read.version, written.version);
assert.strictEqual(read.updatedAt, written.updatedAt);
fs.rmSync(directory, { recursive: true, force: true });
