const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');

const { findAll, findBySub, save } = require(
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
        "sub": "achille",
        "name": "Achille",
        "nature": "humain"
    };
    await save(achille, filePath);

    const characters = await findAll(filePath);

    assert.equal(characters.length, 1);
    assert.deepEqual(characters[0], achille);
});

test('save conserve les personnages existants', async (t) => {
    const filePath = await createTestFile(t);

    const achille = {
        "sub": "achille",
        "name": "Achille",
        "nature": "humain"
    };
    const zeus = {
        "sub": "zeus",
        "name": "Zeus",
        "nature": "deite"
    };
    await save(achille, filePath);
    await save(zeus, filePath);

    const characters = await findAll(filePath);

    assert.deepStrictEqual(characters, [achille, zeus]);
});

test('save refuse les doublons', async (t) => {
    const filePath = await createTestFile(t);

    const achille = {
        "sub": "achille",
        "name": "Achille",
        "nature": "humain"
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
        "sub": "achille",
        "name": "Achille",
        "nature": "humain"
    };
    const zeus = {
        "sub": "zeus",
        "name": "Zeus",
        "nature": "deite"
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