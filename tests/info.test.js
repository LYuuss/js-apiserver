const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

test('GET /info renvoie version et nom de l\'équipe', async (t) => {
    const server = app.listen(0, '127.0.0.1');
    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
    }));

    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });

    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/info`);

    assert.equal(response.status, 200);

    const contentType = response.headers.get('content-type');
    assert.equal("application/json; charset=utf-8", contentType);

    const data = await response.json();
    const {version, team} = data;

    assert.equal("js-apiserver-1.0.0", version);
    assert.equal("Les uniques LYuuss", team);
    
    
});
