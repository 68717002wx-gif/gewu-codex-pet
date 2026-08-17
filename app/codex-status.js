const fs = require('fs');
const path = require('path');

const VERSION = 1;
const STATES = Object.freeze(['idle', 'thinking', 'running', 'success', 'error']);
const STATE_SET = new Set(STATES);

function normalizeStatus(input = {}, now = () => new Date()) {
  const state = String(input.state || '').trim().toLowerCase();
  if (!STATE_SET.has(state)) {
    throw new Error(`Invalid state "${input.state}". Expected: ${STATES.join(', ')}`);
  }
  const message = input.message == null ? '' : String(input.message).trim();
  const source = input.source == null ? 'cli' : String(input.source).trim() || 'cli';
  const taskId = input.taskId == null ? null : String(input.taskId).trim() || null;
  const progressValue = input.progress == null ? null : Number(input.progress);
  if (progressValue != null && (!Number.isFinite(progressValue) || progressValue < 0 || progressValue > 100)) {
    throw new Error('Progress must be a number between 0 and 100.');
  }
  return {
    version: VERSION,
    type: 'codex-status',
    state,
    message,
    source,
    taskId,
    progress: progressValue,
    updatedAt: now().toISOString(),
  };
}

function readStatus(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const normalized = normalizeStatus(parsed);
    normalized.updatedAt = parsed.updatedAt || normalized.updatedAt;
    return normalized;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function writeStatus(filePath, input) {
  const status = normalizeStatus(input);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, filePath);
  return status;
}

module.exports = { VERSION, STATES, normalizeStatus, readStatus, writeStatus };
