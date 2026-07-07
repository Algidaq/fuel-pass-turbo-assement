const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const packageTypes = [
    ['dist/esm', 'module'],
    ['dist/cjs', 'commonjs'],
];

for (const [directory, type] of packageTypes) {
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'package.json'), `${JSON.stringify({ type }, null, 4)}\n`);
}
