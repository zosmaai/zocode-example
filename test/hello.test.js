'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

/**
 * Helper: make an HTTP request and collect response parts.
 * @param {string} method - HTTP method
 * @param {string} path - URL path
 * @param {object} server - An http.Server instance
 * @returns {Promise<{statusCode: number, headers: object, body: string}>}
 */
function request(method, path, server) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

describe('GET /api/hello', () => {
  let server;

  before(() => {
    const app = require('../src/index');
    server = app.listen(0); // dynamic port
  });

  after(() => {
    server.close();
    delete require.cache[require.resolve('../src/index')];
  });

  it('should return HTTP 200 with hello world', async () => {
    const res = await request('GET', '/api/hello', server);

    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type'].includes('application/json'));

    const body = JSON.parse(res.body);
    assert.equal(body.hello, 'world');
  });
});

describe('GET /api/unknown (404 handling)', () => {
  let server;

  before(() => {
    const app = require('../src/index');
    server = app.listen(0);
  });

  after(() => {
    server.close();
    delete require.cache[require.resolve('../src/index')];
  });

  it('should return HTTP 404 with JSON error body', async () => {
    const res = await request('GET', '/api/unknown', server);

    assert.equal(res.statusCode, 404);
    assert.ok(res.headers['content-type'].includes('application/json'));

    const body = JSON.parse(res.body);
    assert.equal(body.error, 'Not Found');
  });
});
