# Specification: Hello World Express API

**Task ID:** LOCAL-001
**Branch:** feat/hello-express

---

## 1. Overview

Build a minimal Express.js API server that exposes a single endpoint and includes a basic test suite using Node.js built-in testing modules. The server must support graceful shutdown on `SIGTERM` / `SIGINT`.

---

## 2. Functional Requirements

| ID  | Description                                        | Priority |
|-----|----------------------------------------------------|----------|
| F1  | `GET /api/hello` returns `{hello: "world"}`       | Must     |
| F2  | Server starts on configurable port (default 3000)  | Must     |
| F3  | Unknown routes return `404` with `{error: "Not found"}` | Must |
| F4  | Graceful shutdown on `SIGTERM` / `SIGINT`          | Must     |
| F5  | Export the `app` for test usage                    | Must     |

---

## 3. Non-Functional Requirements

| ID  | Description                                        | Priority |
|-----|----------------------------------------------------|----------|
| N1  | Use Express.js 5.x                                 | Must     |
| N2  | Use `node:test` and `node:assert` for testing (zero external test deps) | Must |
| N3  | Tests must use dynamic/random port via `listen(0)` | Must     |
| N4  | `npm start` runs the server; `npm test` runs tests | Must     |
| N5  | import/require style: CommonJS (`require`)          | Should   |

---

## 4. Acceptance Criteria

1. `GET /api/hello` responds with HTTP 200 and body `{hello: 'world'}`.
2. `GET /nonexistent` responds with HTTP 404 and body `{error: 'Not found'}`.
3. Server starts on port 3000 when run via `npm start`.
4. `npm test` passes with zero failures.
5. Tests run against a dynamically-assigned port (no port conflicts).
6. Sending `SIGTERM` to the server process causes a clean shutdown (server closes, process exits).

---

## 5. Technical Approach

### Architecture
- **Single-module server** — a single `src/index.js` exports the Express `app` and conditionally starts the server when run directly.
- **startServer() pattern** — export an async `startServer(port?)` function that returns `{server, port}`. Tests call this with no argument (random port).
- **Graceful shutdown** — attach `process.on('SIGTERM'|'SIGINT')` handlers that call `server.close()` then exit.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Test framework | `node:test` + `node:assert` | Zero external deps, built into Node.js 20+ |
| HTTP client in tests | `fetch` (built-in Node 18+) | No extra dependency needed |
| Module system | CommonJS | Aligns with existing package.json (no `"type": "module"`) |
| Port configuration | `process.env.PORT` fallback to 3000 | Standard twelve-factor pattern |

### Graceful Shutdown Flow

```
SIGTERM/SIGINT
    ↓
process.on('SIGTERM')
    ↓
server.close(() => process.exit(0))
```

---

## 6. File / Module Structure

```
.
├── docs/
│   └── spec-LOCAL-001.md          # This specification
├── src/
│   └── index.js                   # Express app, startServer(), graceful shutdown
├── test/
│   └── hello.test.js              # Tests for GET /api/hello and 404
├── package.json                   # Dependencies and scripts (already exists)
└── README.md                      # (optional) Project overview
```

### Module Responsibilities

#### `src/index.js`
- Create Express app
- Define `GET /api/hello` route → `res.json({hello: 'world'})`
- Define catch-all 404 handler
- Export `app` and `startServer(port?)`
- If run directly, call `startServer()` and log startup message
- Handle `SIGTERM` / `SIGINT` for graceful shutdown

#### `test/hello.test.js`
- Import `app` and `startServer` from `../src/index.js`
- Start server on random port before tests
- Test `GET /api/hello` returns 200 + `{hello: 'world'}`
- Test unknown route returns 404 + `{error: 'Not found'}`
- Close server after all tests

---

## 7. Testing Strategy

| Test | Method | Route | Expected Status | Expected Body |
|------|--------|-------|-----------------|---------------|
| Hello endpoint | GET | `/api/hello` | 200 | `{hello: 'world'}` |
| Unknown route | GET | `/api/unknown` | 404 | `{error: 'Not found'}` |

Tests will use:
- `node:test` (`describe`, `it`, `before`, `after`)
- `node:assert` (`assert.strictEqual`, `assert.deepEqual`)
- Native `fetch()` for HTTP requests
- Dynamic port via `startServer()` with no arguments

---

## 8. Open Questions / Future Considerations

- Add health check endpoint (`GET /api/health`) if needed.
- Add request logging middleware (morgan) for production.
- Containerise with Docker for deployment.
- Add environment-based configuration later.
