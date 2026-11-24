const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const express = require('express');
const { startTestServer } = require('../test-utils/startTestServer');
const createCharactersRouter = require('../src/routes/characters');
const { findAll, findBySub, save } = require('../src/repositories/characterRepository');

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

test('Get /characters/inexistant retourne 404 character introuvable', async (t) => {
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

test('GET /characters/achille renvoie 200 et achille', async (t) => {
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

test('POST /characters enregistre achille et le renvoie', async (t) => {
    const filePath = await createTestFile(t);

    const testApp = express();
    testApp.use(express.json());
    testApp.use('/characters',
        createCharactersRouter(filePath)
    );

    const urlRoot = await startTestServer(t, testApp);

    const achille = {
        sub: "achille",
        name: "Achille",
        nature: "humain",
        strength: 60,
        beauty: 45,
        politics: 30,
        vitality: 55
    };

    const response = await fetch(
        `${urlRoot}/characters`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(achille)
        }
    );

    const saved = await response.json();
    const expected = {
            ...achille,
            parent_subs: [],
            sibling_subs: [],
            love_subs: [],
            hate_subs: [],
            tutelary_deity_subs: []
        };

    assert.equal(response.status, 201);
    assert.deepEqual(saved, expected);

    const persisted = await findBySub("achille", filePath);

    assert.notEqual(persisted, null);
    assert.equal(persisted.sub, "achille");

});

test('POST /characters ajoute doublon, renvoie une erreur 409', async (t) => {
    const filePath = await createTestFile(t);

    const testApp = express();
    testApp.use(express.json());
    testApp.use('/characters',
        createCharactersRouter(filePath)
    );

    const urlRoot = await startTestServer(t, testApp);

    const achille = {
        sub: "achille",
        name: "Achille",
        nature: "humain",
        strength: 60,
        beauty: 45,
        politics: 30,
        vitality: 55
    };

    await save(achille, filePath);

    const response = await fetch(
        `${urlRoot}/characters`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(achille)
        }
    );
    const error = await response.json();

    assert.equal(response.status, 409);
    assert.deepEqual(error, {
        error:"Character already exists"
    });

    const characters = await findAll(filePath);

    assert.equal(characters.length, 1);
    assert.equal(characters[0].sub, "achille");
});

test('POST /characters refuse un personnage invalide avec 400', async (t) => {
    const filePath = await createTestFile(t);

    const testApp = express();
    testApp.use(express.json());
    testApp.use('/characters',
        createCharactersRouter(filePath)
    );

    const urlRoot = await startTestServer(t, testApp);

    const achille = {
        sub: "achille",
        name: "Achille",
        nature: "humain",
        strength: 61,
        beauty: 45,
        politics: 30,
        vitality: 55
    };

    const response = await fetch(
        `${urlRoot}/characters`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(achille)
        }
    );
    
    const error = await response.json();

    assert.equal(response.status, 400);
    assert.deepStrictEqual(error, {
        error: 'strength must be between 0 and 60'
    });

    const characters = await findAll(filePath);

    assert.equal(characters.length, 0);
});