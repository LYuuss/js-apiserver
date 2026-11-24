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


function makeAchille(overrides = {}) {
    return {
        sub: 'achille',
        name: 'Achille',
        nature: 'humain',
        strength: 60,
        beauty: 45,
        politics: 30,
        vitality: 55,
        ...overrides
    };
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


test('POST /characters concurrent : une création 201 et un conflit 409', async (t) => {
    const filePath = await createTestFile(t);

    const testApp = express();
    testApp.use(express.json());
    testApp.use('/characters', createCharactersRouter(filePath));

    const urlRoot = await startTestServer(t, testApp);

    const achille = {
        sub: 'achille',
        name: 'Achille',
        nature: 'humain',
        strength: 60,
        beauty: 45,
        politics: 30,
        vitality: 55
    };

    const createAchille = () => fetch(`${urlRoot}/characters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(achille)
    });

    const [response1, response2] = await Promise.all([
        createAchille(),
        createAchille()
    ]);

    const statuses = [response1.status, response2.status];
    statuses.sort((a, b) => a - b);

    assert.deepStrictEqual(statuses, [201, 409]);

    const conflictResponse = response1.status === 409
        ? response1
        : response2;

    const error = await conflictResponse.json();

    assert.deepStrictEqual(error, {
        error: 'Character already exists'
    });

    const characters = await findAll(filePath);

    assert.equal(characters.length, 1);
    assert.equal(characters[0].sub, 'achille');
});


test('PUT /characters/achille remplace un personnage', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    await save(makeAchille(), filePath);

    const updatedAchille = makeAchille({
        name: 'Achille le héros',
        strength: 50
    });

    const response = await fetch(`${urlRoot}/characters/achille`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedAchille)
    });

    assert.equal(response.status, 200);

    const result = await response.json();

    assert.equal(result.name, 'Achille le héros');
    assert.equal(result.strength, 50);

    const persisted = await findBySub('achille', filePath);

    assert.deepStrictEqual(persisted, result);
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


test('PATCH /characters/achille modifie uniquement les propriétés fournies', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    await save(makeAchille(), filePath);

    const response = await fetch(`${urlRoot}/characters/achille`, {
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

    // La propriété ciblée est modifiée
    assert.equal(updated.strength, 40);

    // Les autres propriétés restent inchangées
    assert.equal(updated.name, 'Achille');
    assert.equal(updated.beauty, 45);
    assert.equal(updated.politics, 30);
    assert.equal(updated.vitality, 55);

    // Vérification de la persistance
    const persisted = await findBySub('achille', filePath);

    assert.deepStrictEqual(persisted, updated);
});

test('PATCH /characters/achille refuse des statistiques invalides', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    await save(makeAchille(), filePath);

    const response = await fetch(`${urlRoot}/characters/achille`, {
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

    const persisted = await findBySub('achille', filePath);

    assert.equal(persisted.strength, 60);
});


test('DELETE /characters/achille supprime le personnage', async (t) => {
    const { filePath, urlRoot } = await createCharactersTestApp(t);

    await save(makeAchille(), filePath);

    const response = await fetch(`${urlRoot}/characters/achille`, {
        method: 'DELETE'
    });

    assert.equal(response.status, 204);

    // Une réponse 204 ne doit pas contenir de corps
    const body = await response.text();
    assert.equal(body, '');

    // Vérifier que le personnage a disparu du fichier
    const characters = await findAll(filePath);

    assert.deepStrictEqual(characters, []);
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
