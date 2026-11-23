const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const express = require('express');
const { startTestServer } = require('../test-utils/startTestServer');
const createCharactersRouter = require('../src/routes/characters');

const { save } = require('../src/repositories/characterRepository');

async function createTestFile(t) {
    const directory = await fs.mkdtemp(
        path.join(os.tmpdir(), 'characters-')
    );

    t.after(async () => {
        await fs.rm(directory, {
            recursive: true,
            force: true
        });
    });

    const filePath = path.join(directory, 'characters.json');

    await fs.writeFile(filePath, '[]', 'utf8');

    return filePath;
};

test('Get /character/inexistant retourne 404 character introuvable', async (t) => {
    const filePath = await createTestFile(t);

    const testApp = express();

    testApp.use(
        '/characters',
        createCharactersRouter(filePath)
    );

    const urlRoot = await startTestServer(t, testApp);

    const response = await fetch(`${urlRoot}/characters/inexistant`);

    assert.equal(response.status, 404);

    const data = await response.json();

    assert.deepStrictEqual(data, {
        error: 'Character not found'
    });
});

test('GET /character/achille renvoie 200 et achille', async (t) => {
    const filePath = await createTestFile(t);

    const testApp = express();
    
    testApp.use(
        '/characters',
        createCharactersRouter(filePath)
    );

    const urlRoot = await startTestServer(t, testApp);

    const achille = {
        "sub": "achille",
        "name": "Achille",
        "nature": "humain"
    };

    await save(achille, filePath);

    const response = await fetch(`${urlRoot}/characters/achille`);

    const character = await response.json();

    assert.equal(response.status, 200);
    assert.deepStrictEqual(character, achille);
});