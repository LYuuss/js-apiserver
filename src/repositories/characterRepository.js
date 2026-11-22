const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_FILE_PATH = path.join(
    __dirname, '..', '..', 'data', 'characters.json'
);

async function findAll(filePath = DEFAULT_FILE_PATH) {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
}

async function findBySub(sub, filePath = DEFAULT_FILE_PATH) {
    const characters = await findAll(filePath);
    return characters.find(c => c.sub === sub) ?? null;
}

module.exports = { findAll, findBySub };
