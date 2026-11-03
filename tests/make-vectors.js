// Regenerate vectors.json from the JS engine: node tests/make-vectors.js
const fs = require('node:fs');
const path = require('node:path');
const E = require('../assets/engine.js');
const { scenarios, run } = require('./scenarios.js');
const catalog = require('./catalog.json');

const out = scenarios.map((sc) => run(E, sc, catalog));
fs.writeFileSync(path.join(__dirname, 'vectors.json'), JSON.stringify(out, null, 1) + '\n');
fs.writeFileSync(path.join(__dirname, 'scenarios.json'), JSON.stringify(scenarios, null, 1) + '\n');
console.log('wrote', out.length, 'scenarios');
