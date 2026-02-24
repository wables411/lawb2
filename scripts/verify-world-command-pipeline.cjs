const fs = require('fs');
const path = require('path');
const vm = require('vm');

function extractConstObject(source, constName) {
  const marker = `const ${constName} = {`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${constName}`);
  let i = start + marker.length - 1;
  let depth = 0;
  let end = -1;
  for (; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error(`Unclosed object for ${constName}`);
  return source.slice(start, end + 2);
}

function extractFunction(source, fnName) {
  const marker = `function ${fnName}(`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Missing function ${fnName}`);
  let i = source.indexOf('{', start);
  if (i < 0) throw new Error(`Missing opening brace for ${fnName}`);
  let depth = 0;
  let end = -1;
  for (; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error(`Unclosed function ${fnName}`);
  return source.slice(start, end + 1);
}

function buildRetakeParser(retakeSource) {
  const roomAliases = extractConstObject(retakeSource, 'ROOM_COMMAND_ALIASES');
  const actionAliases = extractConstObject(retakeSource, 'ACTION_COMMAND_ALIASES');
  const parseFn = extractFunction(retakeSource, 'parseWorldCommand');
  const script = `
${roomAliases}
${actionAliases}
${parseFn}
module.exports = { parseWorldCommand };
`;
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(script, sandbox, { timeout: 1000 });
  return sandbox.module.exports.parseWorldCommand;
}

function buildWorldNormalizer(worldSource) {
  const roomMap = extractConstObject(worldSource, 'ROOM_TO_ACTION');
  const actionAliases = extractConstObject(worldSource, 'ACTION_ALIASES');
  const normalizeFn = extractFunction(worldSource, 'normalizeCommand');
  const script = `
${roomMap}
${actionAliases}
${normalizeFn}
module.exports = { normalizeCommand };
`;
  const sandbox = { module: { exports: {} }, Date };
  vm.runInNewContext(script, sandbox, { timeout: 1000 });
  return sandbox.module.exports.normalizeCommand;
}

const root = process.cwd();
const retakePath = path.join(root, 'clawb', 'retake-streamer.js');
const worldResponderPath = path.join(root, 'clawb', 'world-responder.js');
const worldPath = path.join(root, 'src', 'components', 'ClawbWorld.tsx');

const retakeSource = fs.readFileSync(retakePath, 'utf8');
const worldSource = fs.readFileSync(worldResponderPath, 'utf8');
const worldTsx = fs.readFileSync(worldPath, 'utf8');

const parseWorldCommand = buildRetakeParser(retakeSource);
const normalizeCommand = buildWorldNormalizer(worldSource);

const commands = [
  '!dance',
  '!flip',
  '!walk',
  '!swim',
  '!die',
  '!hi',
  '!left',
  '!right',
  '!back',
  '!forward',
  '!swim right',
];

const parseResults = commands.map((command) => {
  const parsed = parseWorldCommand(command.toLowerCase());
  const normalized = parsed
    ? normalizeCommand({
        ...parsed,
        viewer: 'verify-bot',
        source: 'retake',
        timestamp: 1710000000000,
      })
    : null;
  return { command, parsed, normalized };
});

const modelEntries = [];
const modelMatch = worldTsx.match(/const CLAWB_MODEL_URLS: Record<ClawbModelKey, string> = \{([\s\S]*?)\n\};/);
if (modelMatch) {
  const rows = modelMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes(':'))
    .map((line) => line.replace(/,$/, ''));
  for (const row of rows) modelEntries.push(row);
}

const requiredActions = ['dance', 'flip', 'walk', 'swim', 'die', 'hi'];
const modelMap = {};
for (const row of modelEntries) {
  const m = row.match(/^([a-z_]+):\s*'([^']+)'$/);
  if (m) modelMap[m[1]] = m[2];
}
const requiredModelUniqueness = requiredActions.map((action) => ({
  action,
  model: modelMap[action] || null,
}));

const isUnique =
  requiredModelUniqueness.filter((x) => x.model).length ===
  new Set(requiredModelUniqueness.filter((x) => x.model).map((x) => x.model)).size;

const parseFromTextChecks = [
  '!left',
  '!right',
  '!back',
  '!forward',
  '!swim right',
  '!hi',
];
const parseFromTextPresence = parseFromTextChecks.map((pattern) => ({
  pattern,
  present: worldTsx.includes(pattern),
}));

const report = {
  parseResults,
  requiredModelUniqueness,
  requiredModelPathsUnique: isUnique,
  parseFromTextPresence,
};

console.log(JSON.stringify(report, null, 2));
