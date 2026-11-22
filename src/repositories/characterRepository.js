const fs = require('node:fs/promises');
const path = require('node:path');

const DEFAULT_FILE_PATH = path.join(
    __dirname, '..', '..', 'data', 'characters.json'
);

async function findAll(filePath = DEFAULT_FILE_PATH) {
    const characters = await fs.readFile(filePath, 'utf8');
    return JSON.parse(characters);
}

async function findBySub(sub, filePath = DEFAULT_FILE_PATH) {
    const characters = await findAll(filePath);
    return characters.find(c => c.sub === sub) ?? null;
}

async function save(character, filePath = DEFAULT_FILE_PATH) {
    const characters = await findAll(filePath);
    if(characters.some(c => c.sub === character.sub)){
        throw new Error('Already exists');
    }
    characters.push(character);
    await fs.writeFile(
        filePath,
        JSON.stringify(characters, null, 2),
        'utf8'
    );
    return character;
}

module.exports = { findAll, findBySub, save };
