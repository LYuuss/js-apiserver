const fs = require('node:fs/promises');
const path = require('node:path');
const Character = require('../models/Character');

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

function remove(sub, filePath = DEFAULT_FILE_PATH){
    
    const queue = queues.get(filePath)?? Promise.resolve();
    
    const operation = queue.then(async () => {
        const characters = await findAll(filePath);

        const index = characters.findIndex(c => c.sub === sub);
        if(index === -1){
            throw new Error("Character does not exist");
        }

        characters.splice(index, 1);

        await fs.writeFile(
            filePath,
            JSON.stringify(characters, null, 2),
            'utf8'
        );

    });

    const tail = operation.catch(() => {});

    queues.set(filePath, tail);
    
    tail.then(() => {
        if(queues.get(filePath) === tail){
            queues.delete(filePath);
        }
    });

    return operation;

};

function fullUpdate(sub, character, filePath = DEFAULT_FILE_PATH){
    const queue = queues.get(filePath)?? Promise.resolve();
    
    const operation = queue.then(async () => {
        const characters = await findAll(filePath);

        const index = characters.findIndex(c => c.sub === sub);
        if(index === -1){
            throw new Error("Character does not exist");
        }
        if (characters.some((c, i) =>
            i !== index && c.sub === character.sub
        )) {
            throw new Error('Already exists');
        }

        characters[index] = {...character, sub};
        
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
        if(queues.get(filePath) === tail){
            queues.delete(filePath);
        }
    });

    return operation;
};

function partialUpdate(sub, params, filePath = DEFAULT_FILE_PATH){
    const queue = queues.get(filePath)?? Promise.resolve();
    
    const operation = queue.then(async () => {
        const characters = await findAll(filePath);

        const index = characters.findIndex(c => c.sub === sub);

        if(index === -1){
            throw new Error("Character does not exist");
        }

        const updated = new Character({
            ...characters[index],
            ...params,
            sub
        });

        if (characters.some((c, i) =>
            i !== index && c.sub === updated.sub
        )) {
            throw new Error('Already exists');
        }

        characters[index] = updated;
        await fs.writeFile(
            filePath,
            JSON.stringify(characters, null, 2),
            'utf8'
        );
        
        return updated;
    });

    const tail = operation.catch(() => {});

    queues.set(filePath, tail);
    
    tail.then(() => {
        if(queues.get(filePath) === tail){
            queues.delete(filePath);
        }
    });

    return operation;
};

module.exports = { findAll, findBySub, save, remove, fullUpdate, partialUpdate };
