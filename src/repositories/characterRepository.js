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

const queues = new Map();

function save(character, filePath = DEFAULT_FILE_PATH) {
    const queue = queues.get(filePath) ?? Promise.resolve();

    const operation = queue.then(async () => {
        const characters = await findAll(filePath);

        if (characters.some(c => c.sub === character.sub)) {
            throw new Error('Already exists');
        }

        characters.push(character);

        await fs.writeFile(
            filePath,
            JSON.stringify(characters, null, 2),
            'utf8'
        );

        return character;
    });

    const tail = operation.catch(() => {});

    queues.set(filePath, tail);

    tail.then(() => {
        if (queues.get(filePath) === tail) {
            queues.delete(filePath);
        }
    });

    return operation;
}

module.exports = { findAll, findBySub, save };
