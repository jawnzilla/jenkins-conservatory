// Runs every check in test/ against the built bundle and reports once. Kept as a
// plain runner rather than a framework: the checks drive a real browser and a
// real build, so there is nothing for a test runner's module graph to add.
import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const files = (await readdir(here)).filter((name) => name.endsWith('.test.mjs')).sort();

const results = [];
for (const file of files) {
  process.stdout.write(`\n──── ${file} ────\n`);
  const code = await new Promise((resolve) => {
    spawn(process.execPath, [join(here, file)], { stdio: 'inherit' }).on('close', resolve);
  });
  results.push({ file, passed: code === 0 });
}

process.stdout.write('\n──── summary ────\n');
for (const { file, passed } of results) console.log(`${passed ? 'pass' : 'FAIL'}  ${file}`);
const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error(`\n${failed.length} of ${results.length} checks failed`);
  process.exitCode = 1;
} else {
  console.log(`\nall ${results.length} checks passed`);
}
