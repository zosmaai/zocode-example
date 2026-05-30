# Implementation Plan: Hello World Express API

**Task ID:** LOCAL-001
**Branch:** feat/hello-express
**Phase:** Plan

---

## 1. Overview

Build a minimal Express.js API server exposing `GET /api/hello` → `{hello: "world"}` with tests using Node.js built-in modules. The server supports graceful shutdown and configurable port.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module system | CommonJS (`require`) | Matches existing package.json |
| Server pattern | `startServer(port?)` → `Promise<{server, port}>` | Enables random-port testing via `startServer({port: 0})` |
| HTTP client in tests | Native `fetch()` (Node 18+) | Zero extra deps |
| Test framework | `node:test` + `node:assert/strict` | Built into Node.js 20+ |
| Direct-run guard | `require.main === module` | Prevents server start on `require()` during tests |

---

## 2. Step-by-Step Implementation

### Step 1 — Create `src/index.js`

**File:** `src/index.js` (new)

**Dependencies:** None (Express 5.x already installed)

**Responsibilities:**
- Create Express app instance
- `require.main === module` guard for conditional listen
- Export `app` for test consumption
- Export `startServer(port?)` returning `Promise<{server, port}>`
- Define `GET /api/hello` route → `res.json({hello: 'world'})`
- Define catch-all 404 middleware → `res.status(404).json({error: 'Not found'})`
- Graceful shutdown: `process.on('SIGTERM'|'SIGINT')` → `server.close()` → `process.exit(0)`
- When run directly: read `PORT` env var (default `3000`), call `startServer()`, log startup

**Implementation details:**

```js
const express = require('express');
const app = express();

app.get('/api/hello', (req, res) => {
  res.json({ hello: 'world' });
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const addr = server.address();
      resolve({ server, port: addr.port });
    });
    server.on('error', reject);
  });
}

// Graceful shutdown
function setupGracefulShutdown(server) {
  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  startServer(PORT).then(({ port }) => {
    console.log(`Server running on port ${port}`);
    setupGracefulShutdown(server);
  });
}

module.exports = { app, startServer };
```

### Step 2 — Create `test/hello.test.js`

**File:** `test/hello.test.js` (new)

**Dependencies:** Step 1 (imports `startServer`)

**Test strategy:**
- Use `node:test` (`describe`, `it`, `before`, `after`)
- Use `node:assert/strict`
- Start server on random port (`port: 0`) before all tests
- Tear down server after all tests
- Use native `fetch()` to make HTTP requests

**Test cases:**

| # | Test | Method | Route | Expected Status | Expected Body |
|---|------|--------|-------|-----------------|---------------|
| 1 | Hello endpoint returns 200 | GET | `/api/hello` | 200 | `{hello: 'world'}` |
| 2 | Content-Type is JSON | GET | `/api/hello` | 200 | `content-type` includes `application/json` |
| 3 | Unknown route returns 404 | GET | `/api/unknown` | 404 | `{error: 'Not found'}` |

**Implementation details:**

```js
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

  it('should return application/json', async () => {
    const res = await fetch(`${baseUrl}/api/hello`);
    assert.strictEqual(res.headers.get('content-type'), 'application/json');
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
```

### Step 3 — Verify `package.json` scripts

**File:** `package.json` (already exists)

**Dependencies:** Steps 1-2

**Verify existing scripts are correct:**

```json
{
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test test/*.test.js"
  },
  "dependencies": {
    "express": "^5.2.1"
  }
}
```

No changes needed — already set up correctly.

### Step 4 — Run tests and verify

**Depends on:** Steps 1-3

**Commands:**
```bash
npm test              # Run test suite
npm start             # Quick smoke test with curl
```

**Smoke test:**
```bash
# Terminal 1
npm start &
sleep 1
# Terminal 2
curl -s http://localhost:3000/api/hello
# → {"hello":"world"}
curl -s http://localhost:3000/api/nonexistent
# → {"error":"Not found"}
# Kill
kill %1
```

### Step 5 — Commit and push

**Depends on:** Step 4 (all tests passing)

```bash
git add -A
git commit -m "feat: add hello-world Express API with tests"
git push origin feat/hello-express
```

---

## 3. Dependency Graph

```
Step 1 (src/index.js)
    └──> Step 2 (test/hello.test.js)
            └──> Step 3 (verify package.json - no-op)
                    └──> Step 4 (npm test + smoke test)
                            └──> Step 5 (commit & push)
```

All steps are strictly sequential — no parallel execution.

---

## 4. Test Strategy

| Layer | Framework | Scope | What it validates |
|-------|-----------|-------|-------------------|
| Unit/Integration | `node:test` + `node:assert/strict` | `src/index.js` | Route responses, status codes, JSON body, 404 handling |

**Test methodology:**
- **No mocking needed** — tests start a real HTTP server on a random port and use native `fetch()` for round-trip requests
- **Isolation** — each test file starts its own server instance; `after()` hook guarantees clean teardown
- **Port conflicts impossible** — `listen(0)` delegates port selection to the OS

**What is NOT tested** (acceptable for MVP):
- Graceful shutdown (requires external `SIGTERM` — testing this systematically needs a separate infra)
- Server startup failure (e.g., port in use — edge case for MVP)

---

## 5. Files Summary

| File | Action | Summary |
|------|--------|---------|
| `src/index.js` | **Create** | Express app, routes, 404 handler, `startServer()`, graceful shutdown |
| `test/hello.test.js` | **Create** | 4 tests covering 200, JSON content-type, body shape, and 404 |
| `package.json` | **Verify** (no changes) | Already has `express` dep, `start` + `test` scripts |
| `docs/plan-LOCAL-001.md` | **Create** | This plan |
