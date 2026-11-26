import { test } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { startTestServer } from '../test-utils/startTestServer.js';

test('GET /info renvoie version et nom de l\'équipe', async (t) => {
    const urlRoot = await startTestServer(t, app);

    const response = await fetch(`${urlRoot}/info`);

    assert.equal(response.status, 200);

    const contentType = response.headers.get('content-type');
    assert.equal("application/json; charset=utf-8", contentType);

    const data = await response.json();
    const {version, team} = data;

    assert.equal("js-apiserver-1.0.0", version);
    assert.equal("Les uniques LYuuss", team);
    
    
});
