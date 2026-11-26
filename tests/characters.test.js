import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import express from 'express';
import { startTestServer } from '../test-utils/startTestServer';
import createCharactersRouter from '../src/routes/characters';
import { findAll, findBySub, save } from '../src/repositories/characterRepository';
import CharacterService from '../src/services/characterService';


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


function makeAchille(overrides = {}) {
    return {
        name: 'Achille',
        is_deity: false,
        strength: 60,
        beauty: 45,
        politics: 30,
        vitality: 55,
        ...overrides
    };
}

async function seedAchille(filePath) {
    const service = new CharacterService(filePath);
    return service.create(makeAchille());
}

async function createCharactersTestApp(t) {
    const filePath = await createTestFile(t);

    const testApp = express();
    testApp.use(express.json());
    testApp.use('/characters', createCharactersRouter(filePath));

    const urlRoot = await startTestServer(t, testApp);

    return { filePath, urlRoot };
}


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
        "is_deity": false
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
        name: "Achille",
        is_deity: false,
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
    assert.equal(saved.name, expected.name);

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
        name: "Achille",
        is_deity: false,
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

test('PUT /characters/inexistant retourne 404', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    const response = await fetch(`${urlRoot}/characters/inexistant`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(makeAchille())
    });

    assert.equal(response.status, 404);

    const characters = await findAll(filePath);
    assert.equal(characters.length, 0);
});

test('PUT /characters/achille remplace un personnage', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    const achille = await seedAchille(filePath);

    const updatedAchille = makeAchille({
        name: 'Achille le héros',
        strength: 50
    });

    const response = await fetch(
        `${urlRoot}/characters/${achille.sub}`, 
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedAchille)
        });

    assert.equal(response.status, 200);

    const result = await response.json();

    assert.equal(result.sub, achille.sub);
    assert.equal(result.name, 'Achille le héros');
    assert.equal(result.strength, 50);

    const persisted = await findBySub(achille.sub, filePath);
    assert.deepStrictEqual(persisted, result);
});

test('PATCH /characters/achille modifie uniquement les propriétés fournies', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    const achille = await seedAchille(filePath);

    const response = await fetch(
        `${urlRoot}/characters/${achille.sub}`, 
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                strength: 40
            })
        });

    assert.equal(response.status, 200);

    const updated = await response.json();

    assert.equal(updated.sub, achille.sub);
    assert.equal(updated.strength, 40);
    assert.equal(updated.name, 'Achille');
    assert.equal(updated.beauty, 45);
    assert.equal(updated.politics, 30);
    assert.equal(updated.vitality, 55);

    const persisted = await findBySub(achille.sub, filePath);

    assert.deepStrictEqual(persisted, updated);
});

test('PATCH /characters/achille refuse des statistiques invalides', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    const achille = await seedAchille(filePath);

    const response = await fetch(`${urlRoot}/characters/${achille.sub}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            strength: 90
        })
    });

    assert.equal(response.status, 400);

    const error = await response.json();

    assert.deepStrictEqual(error, {
        error: 'strength must be between 0 and 60'
    });

    const persisted = await findBySub(achille.sub, filePath);

    assert.equal(persisted.strength, 60);
});


test('DELETE /characters/achille supprime le personnage', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    await seedAchille(filePath);

    const characters = await findAll(filePath);
    const response = await fetch(`${urlRoot}/characters/${characters[0].sub}`, {
        method: 'DELETE'
    });

    assert.equal(response.status, 204);

    const body = await response.text();
    assert.equal(body, '');

    const deleted = await findAll(filePath);

    assert.deepStrictEqual(deleted, []);
});

test('DELETE /characters/inexistant retourne 404', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    const response = await fetch(`${urlRoot}/characters/inexistant`, {
        method: 'DELETE'
    });

    assert.equal(response.status, 404);

    const characters = await findAll(filePath);
    assert.deepStrictEqual(characters, []);
});
