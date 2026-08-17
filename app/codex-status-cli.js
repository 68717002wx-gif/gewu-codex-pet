#!/usr/bin/env node
const path = require('path');
const { STATES, writeStatus } = require('./codex-status');

function parseArgs(args) {
  const options = {};
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (!['message', 'source', 'task-id', 'progress', 'file'].includes(key)) {
      throw new Error(`Unknown option: ${arg}`);
    }
    options[key] = args[index + 1];
    index += 1;
  }
  return { state: positional[0], options };
}

function usage() {
  return [
    'Usage: npm run status -- <state> [options]',
    `States: ${STATES.join(', ')}`,
    'Options: --message <text> --source <name> --task-id <id> --progress <0-100> --file <path>',
  ].join('\n');
}

try {
  const { state, options } = parseArgs(process.argv.slice(2));
  if (!state || state === 'help' || state === '--help') {
    console.log(usage());
    process.exit(state ? 0 : 1);
  }
  const filePath = path.resolve(options.file || process.env.GEWU_PET_STATUS_FILE || path.join(__dirname, 'runtime', 'codex-status.json'));
  const status = writeStatus(filePath, {
    state,
    message: options.message,
    source: options.source,
    taskId: options['task-id'],
    progress: options.progress,
  });
  console.log(JSON.stringify({ file: filePath, status }, null, 2));
} catch (error) {
  console.error(error.message);
  console.error(usage());
  process.exit(1);
}
