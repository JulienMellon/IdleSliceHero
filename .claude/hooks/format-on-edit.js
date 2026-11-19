#!/usr/bin/env node
// PostToolUse hook: after Claude edits or writes a file, run Prettier on it if CI's `prettier --check` covers it
// (the globs of `format:check` in package.json). Keeps every session and subagent formatted without anyone remembering to.
// It never blocks the tool call: a missing Prettier, an unparsable file or a bad payload exits 0 quietly.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// The same files as `npm run format:check`: src/**/*.{ts,tsx}, scripts/**/*.ts, *.js, *.ts
const CHECKED = [/^src\/.+\.tsx?$/, /^scripts\/.+\.ts$/, /^[^/]+\.(js|ts)$/];

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const file = input.tool_input && input.tool_input.file_path;
    if (!file) return;
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const rel = path.relative(root, path.resolve(root, file)).split(path.sep).join('/');
    if (rel.startsWith('..') || !CHECKED.some((re) => re.test(rel))) return;
    const prettier = path.join(root, 'node_modules', '.bin', 'prettier');
    if (!fs.existsSync(prettier) || !fs.existsSync(path.join(root, rel))) return;
    execFileSync(prettier, ['--write', '--log-level', 'silent', rel], { cwd: root, stdio: 'ignore', timeout: 20000 });
  } catch {
    // Formatting is best effort here; CI's prettier --check is the gate.
  }
});
