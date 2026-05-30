# Specification: Build Hello World Express API

**Task ID:** LOCAL-001
**Status:** Draft
**Created:** 2026-05-30

## 1. Requirements

### 1.1 Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| FR-01 | The application MUST expose an HTTP API endpoint at `GET /api/hello` | P0 |
| FR-02 | The endpoint MUST return a JSON response with a `message` field | P0 |
| FR-03 | The response body MUST be `{ "message": "Hello from zocode!" }` | P0 |
| FR-04 | The endpoint MUST respond with HTTP status `200` on success | P0 |
| FR-05 | The response MUST include `Content-Type: application/json` header | P0 |
| FR-06 | Unknown routes MUST return HTTP status `404` | P1 |

### 1.2 Non-Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| NFR-01 | Use **Express.js** as the web framework | P0 |
| NFR-02 | The server MUST be testable — support programmatic startup/shutdown in tests | P0 |
| NFR-03 | Use **Node.js built-in `node:test`** (no external test framework) | P0 |
| NFR-04 | Application MUST start on a configurable port (via `PORT` env var, default `3000`) | P1 |
| NFR-05 | No TypeScript — use plain JavaScript (CommonJS modules) | P0 |

## 2. Acceptance Criteria

The task is considered complete when ALL of the following are satisfied:

1. [ ] A `GET /api/hello` request returns HTTP `200`
2. [ ] Response body equals `{ "message": "Hello from zocode!" }`
3. [ ] Response `Content-Type` header is `application/json`
4. [ ] A request to an unknown route (e.g. `GET /api/unknown`) returns HTTP `404`
5. [ ] All tests pass when running `npm test`
6. [ ] The server starts without errors using `node src/index.js`

## 3. Technical Approach

### 3.1 Stack

- **Runtime:** Node.js 22+
- **Framework:** Express.js 4.x
- **Test Framework:** Node.js built-in `node:test` + `node:assert/strict`
- **Module System:** CommonJS (`require` / `module.exports`)
- **Package Manager:** npm (via `package.json`)

### 3.2 Architecture Overview

The application is a single-file Express server that exports an `app` object for testing.

```
┌─────────────────────────────────────┐
│         src/index.js                │
│                                     │
│  const express = require('express') │
│  const app = express()              │
│                                     │
│  app.get('/api/hello', handler)     │
│                                     │
│  if (require.main === module) {     │
│    app.listen(PORT)                 │
│  }                                  │
│                                     │
│  module.exports = app               │
└─────────────────────────────────────┘
```

**Key design decisions:**

- **Conditional listen:** The server only starts listening when the file is run directly (`node src/index.js`). When `require()`-d by tests, the exported `app` allows the test to bind to a dynamic port (`listen(0)`).
- **No `app.listen` in test mode:** Tests start the server on port `0` (OS-assigned) to avoid port conflicts and enable parallel execution.
- **`require.cache` cleanup:** The test module clears `require.cache` for `src/index.js` in the `after` hook so repeated test runs get a fresh app instance.

### 3.3 API Design

#### `GET /api/hello`

**Request:**
```
GET /api/hello
Host: localhost:3000
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Hello from zocode!"
}
```

#### Unknown Route (example: `GET /api/unknown`)

**Response:**
```
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "message": "Not Found"
}
```

### 3.4 Test Strategy

- Use Node's built-in `node:test` — no `mocha`, `jest`, or `supertest` dependencies
- Use `node:assert/strict` for assertions
- Start server on `listen(0)` (dynamic port) to avoid port collisions
- Use Node's built-in `http` module to make test requests (no `fetch` or supertest)
- After each test, destroy the HTTP server and clear `require.cache` for the app module

**Test file structure:**

```javascript
const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

describe('GET /api/hello', () => {
  // ... tests
});
```

## 4. File Structure

```
/
├── package.json          # Project manifest, dependencies, scripts
├── src/
│   └── index.js          # Express server entry point
├── test/
│   └── hello.test.js     # Integration tests for /api/hello
├── docs/
│   └── spec-LOCAL-001.md # This specification document
└── .gitignore            # Already present
```

### 4.1 `package.json`

```json
{
  "name": "zocode-example",
  "version": "1.0.0",
  "description": "Hello World Express API for zocode",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^4.21.0"
  }
}
```

- `npm start` → runs the server
- `npm test` → runs all tests via `node --test` (discovers `test/**/*.test.js` automatically)

### 4.2 `src/index.js`

- Import Express
- Create app instance
- Define `GET /api/hello` route handler
- Add catch-all `404` middleware for unknown routes
- Export `app` for tests
- Conditional `app.listen()` when run directly

## 5. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.21.0 | Web framework |

Zero dev dependencies — test framework is Node.js built-in.

## 6. Security & Error Handling

- The `404` catch-all middleware ensures unknown routes don't leak internal state
- No authentication required (public endpoint)
- No input validation needed (no request body parameters)
- Server handles `SIGINT`/`SIGTERM` for graceful shutdown
