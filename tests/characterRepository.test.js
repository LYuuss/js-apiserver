const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const { findAll, findBySub, save, remove, fullUpdate, partialUpdate } = require(
    '../src/repositories/characterRepository'
);

const fileTestPath = path.join(
    __dirname, 'fixtures', 'characters.json'
);

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

const ACHILLE_ID = '550e8400-e29b-41d4-a716-446655440000';
const ZEUS_ID = '550e8400-e29b-41d4-a716-446655440001';

function makeAchille(overrides = {}) {
    return {
        sub: ACHILLE_ID,
        name: 'Achille',
        is_deity: false,
        strength: 60,
        beauty: 45,
        politics: 30,
        vitality: 55,
        ...overrides
    };
}

function makeZeus() {
    return {
        sub: ZEUS_ID,
        name: 'Zeus',
        is_deity: true,
        strength: 95,
        beauty: 80,
        politics: 90,
        vitality: 100
    };
}

test('findAll renvoie les personnages du fichier de test', async () => {
    const characters = await findAll(fileTestPath);

    assert.ok(Array.isArray(characters));
    assert.equal(characters.length, 2);
});

test('findBySub retrouve Achille', async () => {
    const achille = await findBySub("achille", fileTestPath);

    assert.notEqual(achille, null);
    assert.equal(achille.sub, "achille");
});

test('findBySub retourne null si absent', async (t) => {
    const absent = await findBySub("Lyes", fileTestPath);

    assert.equal(absent, null);
})

test('save ajoute Achille', async (t) => {
    const filePath = await createTestFile(t);

    const achille = {
        "sub": ACHILLE_ID,
        "name": "Achille",
        "is_deity": false
    };
    await save(achille, filePath);

    const characters = await findAll(filePath);

    assert.equal(characters.length, 1);
    assert.deepEqual(characters[0], achille);
});

test('save conserve les personnages existants', async (t) => {
    const filePath = await createTestFile(t);

    const achille = {
        "sub": ACHILLE_ID,
        "name": "Achille",
        "is_deity": false
    };
    const zeus = {
        "sub": ZEUS_ID,
        "name": "Zeus",
        "is_deity": true
    };
    await save(achille, filePath);
    await save(zeus, filePath);

    const characters = await findAll(filePath);

    assert.deepStrictEqual(characters, [achille, zeus]);
});

test('save refuse les doublons', async (t) => {
    const filePath = await createTestFile(t);

    const achille = {
        "sub": ACHILLE_ID,
        "name": "Achille",
        "is_deity": false
    };

    await save(achille, filePath);

    await assert.rejects(
        save(achille, filePath),
        /Already exists/
    );

    const characters = await findAll(filePath);
    assert.deepEqual(characters[0], achille);
});

test('save ajout simultané', async (t) => {
    const filePath = await createTestFile(t);

    const achille = {
        "sub": ACHILLE_ID,
        "name": "Achille",
        "is_deity": false
    };
    const zeus = {
        "sub": ZEUS_ID,
        "name": "Zeus",
        "is_deity": true
    };

    await Promise.all([
        save(achille, filePath),
        save(zeus, filePath)
    ]);

    const characters = await findAll(filePath);
    const subs = characters.map(c => c.sub);

    assert.equal(characters.length, 2);
    assert.ok(subs.includes(zeus.sub));
    assert.ok(subs.includes(achille.sub));

});

test('remove supprime un personnage existant', async (t) => {
    const filePath = await createTestFile(t);

    await save(makeAchille(), filePath);
    await save(makeZeus(), filePath);

    await remove(ACHILLE_ID, filePath);

    const characters = await findAll(filePath);

    assert.equal(characters.length, 1);
    assert.equal(characters[0].name, 'Zeus');

    const achille = await findBySub(ACHILLE_ID, filePath);
    assert.equal(achille, null);
});

test('remove refuse un personnage inexistant', async (t) => {
    const filePath = await createTestFile(t);

    await assert.rejects(
        remove('inexistant', filePath),
        /Character does not exist/
    );

    const characters = await findAll(filePath);
    assert.deepStrictEqual(characters, []);
});

test('fullUpdate remplace les propriétés du personnage', async (t) => {
    const filePath = await createTestFile(t);

    await save(makeAchille(), filePath);

    const replacement = makeAchille({
        name: 'Achille le héros',
        strength: 50,
        beauty: 35
    });

    const result = await fullUpdate(
        ACHILLE_ID,
        replacement,
        filePath
    );

    assert.deepStrictEqual(result, replacement);

    const persisted = await findBySub(ACHILLE_ID, filePath);
    assert.deepStrictEqual(persisted, replacement);
});

test('fullUpdate refuse un personnage inexistant', async (t) => {
    const filePath = await createTestFile(t);

    await assert.rejects(
        fullUpdate('inexistant', makeAchille(), filePath),
        /Character does not exist/
    );

    const characters = await findAll(filePath);
    assert.deepStrictEqual(characters, []);
});

test('partialUpdate modifie uniquement les propriétés fournies', async (t) => {
    const filePath = await createTestFile(t);

    await save(makeAchille(), filePath);

    const result = await partialUpdate(
        ACHILLE_ID,
        { strength: 40 },
        filePath
    );

    assert.equal(result.strength, 40);
    assert.equal(result.beauty, 45);
    assert.equal(result.politics, 30);
    assert.equal(result.vitality, 55);
    assert.equal(result.name, 'Achille');

    const persisted = await findBySub(ACHILLE_ID, filePath);

    assert.equal(persisted.strength, 40);
    assert.equal(persisted.beauty, 45);
    assert.equal(persisted.name, 'Achille');
});

test('partialUpdate refuse une modification invalide', async (t) => {
    const filePath = await createTestFile(t);

    const original = makeAchille();
    await save(original, filePath);

    await assert.rejects(
        partialUpdate(
            ACHILLE_ID,
            { strength: 90 },
            filePath
        ),
        {
            name: 'RangeError',
            message: 'strength must be between 0 and 60'
        }
    );

    const persisted = await findBySub(ACHILLE_ID, filePath);

    assert.deepStrictEqual(persisted, original);
});

test('partialUpdate refuse un personnage inexistant', async (t) => {
    const filePath = await createTestFile(t);

    await assert.rejects(
        partialUpdate(
            'inexistant',
            { strength: 40 },
            filePath
        ),
        /Character does not exist/
    );

    const characters = await findAll(filePath);
    assert.deepStrictEqual(characters, []);
});
