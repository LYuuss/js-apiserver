const { once } = require('node:events');

async function startTestServer(t, app) {
    const server = app.listen(0, '127.0.0.1');

    await once(server, 'listening');

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) reject(error);
            else resolve();
        });
    }));

    const { port } = server.address();

    return `http://127.0.0.1:${port}`;
}

module.exports = { startTestServer };
