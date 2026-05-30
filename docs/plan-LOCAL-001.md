# Implementation Plan: Build Hello World Express API

**Task ID:** LOCAL-001
**Phase:** Plan
**Created:** 2026-05-30

## Overview

Create a minimal Express.js API with a single `GET /api/hello` endpoint that returns `{ "message": "Hello from zocode!" }`. Plain JavaScript, CommonJS modules, Node.js built-in test framework.

## Step-by-Step Implementation Order

### Step 1: Create `package.json`

**File:** `package.json`

Create the project manifest with Express as the only dependency.

**Changes:**
- `name`: `zocode-example`
- `version`: `1.0.0`
- `description`: `Hello World Express API for zocode`
- `main`: `src/index.js`
- `scripts.start`: `node src/index.js`
- `scripts.test`: `node --test`
- `dependencies.express`: `^4.21.0`

**Complexity:** Trivial
**Dependencies:** None (this is the foundation)

---

### Step 2: Create `src/index.js`

**File:** `src/index.js`

Implement the Express server:

1. Import `express`
2. Create `app` instance
3. Register `GET /api/hello` handler → returns `{ message: "Hello from zocode!" }` with `Content-Type: application/json`
4. Register catch-all middleware for unknown routes → returns `404` with `{ message: "Not Found" }`
5. Export `app` for test consumption
6. Conditional `app.listen()` — only when run directly (`require.main === module`), using `PORT` env var (default `3000`)
7. Graceful shutdown on `SIGINT`/`SIGTERM`

**Complexity:** Low
**Dependencies:** Step 1 (package.json must exist before `npm install`)

---

### Step 3: Create `test/hello.test.js`

**File:** `test/hello.test.js`

Integration tests using Node.js built-in `node:test`:

1. **Suite: `GET /api/hello`**
   - Starts server on dynamic port (`listen(0)`)
   - Builds raw HTTP request using `http` module
   - Asserts: status `200`, `Content-Type` includes `application/json`, body message matches
2. **Suite: `GET /api/unknown` (404 handling)**
   - Same server setup
   - Asserts: status `404`, `Content-Type` includes `application/json`
3. **Graceful teardown:**
   - `after` hook: destroy HTTP server, clear `require.cache` for the app module

**Helpers:**
- Test helper to make an HTTP request and collect response (status, headers, body)
- Parse JSON body for assertions

**Complexity:** Low
**Dependencies:** Step 2 (depends on the app module structure)

---

### Step 4: Install Dependencies

**Command:** `npm install`

Installs Express and its transitive dependencies.

**Complexity:** Trivial
**Dependencies:** Step 1 (package.json must exist)

---

### Step 5: Run Tests and Verify

**Command:** `npm test`

Runs `node --test`, which auto-discovers `test/**/*.test.js`.

**Verification criteria:**
- All tests pass (green)
- Server starts without errors via `node src/index.js`
- Manual curl check (optional): `curl http://localhost:3000/api/hello` returns expected JSON

**Complexity:** Trivial
**Dependencies:** Steps 2, 3, 4 (all must be complete)

---

## Dependency Graph

```
  Step 1 (package.json)
      │
      ├── Step 4 (npm install)
      │
      └── Step 2 (src/index.js)
              │
              └── Step 3 (test/hello.test.js)
                      │
                      └── Step 5 (npm test)
```

**Parallelizable:** Steps 2 and 4 can be done in parallel after Step 1.

## Files to Create

| File | Step | Purpose |
|------|------|---------|
| `package.json` | 1 | Project manifest, scripts, dependencies |
| `src/index.js` | 2 | Express app, route handlers, server entry point |
| `test/hello.test.js` | 3 | Integration tests |

## Test Strategy

- **Type:** Integration (end-to-end via HTTP)
- **Framework:** Node.js built-in `node:test` + `node:assert/strict`
- **HTTP client:** Node.js built-in `http` module (no `supertest`)
- **Port strategy:** Dynamic port (`listen(0)`) to avoid conflicts
- **Isolation:** Each test starts its own server instance; teardown destroys server and clears module cache
- **Coverage:**
  - Happy path: `GET /api/hello` → 200 + correct body + JSON content type
  - Edge case: unknown route → 404 + JSON content type
  - (Verification-only) Server boots without crash on `node src/index.js`

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Port conflict in tests | Low | Use `listen(0)` for dynamic OS-assigned port |
| Module cache pollution | Low | Clear `require.cache` in `after` hook |
| Express version breaking changes | Very low | Pin to `^4.21.0`, stable major version |
