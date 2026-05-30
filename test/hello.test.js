const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../src/index');

let server, baseUrl;

before(async () => {
  const result = await startServer(0);
  server = result.server;
  baseUrl = `http://localhost:${result.port}`;
});

after(() => {
  server.close();
});

describe('GET /api/hello', () => {
  it('should return status 200', async () => {
    const res = await fetch(`${baseUrl}/api/hello`);
    assert.strictEqual(res.status, 200);
  });

  it('should return application/json content-type', async () => {
    const res = await fetch(`${baseUrl}/api/hello`);
    assert.ok(res.headers.get('content-type').includes('application/json'));
  });

  it('should return {hello: "world"}', async () => {
    const res = await fetch(`${baseUrl}/api/hello`);
    const body = await res.json();
    assert.deepStrictEqual(body, { hello: 'world' });
  });
});

describe('Unknown routes', () => {
  it('should return 404 with {error: "Not found"}', async () => {
    const res = await fetch(`${baseUrl}/api/unknown`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.deepStrictEqual(body, { error: 'Not found' });
  });
});
