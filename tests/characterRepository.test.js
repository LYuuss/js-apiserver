const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { findAll, findBySub } = require(
    '../src/repositories/characterRepository'
);

const fileTestPath = path.join(
    __dirname, 'fixtures', 'characters.json'
);

test('findAll renvoie les personnages du fichier de test', async () => {
    const characters = await findAll(fileTestPath);

    assert.ok(Array.isArray(characters));
    assert.equal(characters.length, 2);
});