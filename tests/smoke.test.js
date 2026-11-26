import { test } from 'node:test';
import assert from 'node:assert/strict';
import app from'../app.js';

test('GET / renvoie la page de demarrage Express', async (t) => {
  // Le port 0 laisse le systeme choisir un port libre.
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/`);

  assert.equal(response.status, 200);
  assert.match(await response.text(), /Express/);
});
