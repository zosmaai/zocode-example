# Implementation Plan: Build Hello Express API v2

**Task ID:** LOCAL-001
**Phase:** Plan
**Spec Version:** 2.0
**Created:** 2026-05-30

## Overview

Create a minimal Express.js API with a single `GET /api/hello` endpoint that returns `{ "hello": "world" }`. Includes a catch-all 404 handler that returns JSON. Plain JavaScript, CommonJS modules, Node.js built-in test framework.

## v2 Changes from v1

| Aspect | v1 (current) | v2 (target) |
|--------|--------------|-------------|
| `GET /api/hello` response | `{ "message": "Hello from zocode!" }` | `{ "hello": "world" }` |
| 404 response format | `{ "message": "Not Found" }` | `{ "error": "Not Found" }` with explicit `Content-Type: application/json` |

## Step-by-Step Implementation Order

### Step 1: Update `src/index.js` — Response Body + 404 Format

**File:** `src/index.js`

Two changes:

1. **Route handler (`GET /api/hello`):** Change the JSON response from `{ message: 'Hello from zocode!' }` to `{ hello: 'world' }`.

2. **Catch-all 404 middleware:** Change response body shape from `{ message: 'Not Found' }` to `{ error: 'Not Found' }`. Express's `.status(404).json(...)` already sets `Content-Type: application/json`, so no additional header configuration is needed.

**Changes (targeted):**

```diff
- res.json({ message: 'Hello from zocode!' });
+ res.json({ hello: 'world' });

- res.status(404).json({ message: 'Not Found' });
+ res.status(404).json({ error: 'Not Found' });
```

**Complexity:** Trivial (2-line change)
**Dependencies:** None

---

### Step 2: Update `test/hello.test.js` — Assert New Response Body

**File:** `test/hello.test.js`

Two changes:

1. **`GET /api/hello` suite:** Change the body assertion from `body.message === 'Hello from zocode!'` to `body.hello === 'world'`.

2. **`GET /api/unknown` suite:** Add a body assertion to verify the 404 response is valid JSON with `error: 'Not Found'`.

**Changes (targeted):**

```diff
- assert.equal(body.message, 'Hello from zocode!');
+ assert.equal(body.hello, 'world');
```

And in the 404 test suite, add:

```javascript
  it('should return 404 with JSON error body', async () => {
    const res = await request('GET', '/api/unknown', server);

    assert.equal(res.statusCode, 404);
    assert.ok(res.headers['content-type'].includes('application/json'));

    const body = JSON.parse(res.body);
    assert.equal(body.error, 'Not Found');
  });
```

**Complexity:** Low (update assertion + add body check in 404 test)
**Dependencies:** Step 1 (test must match the app's behavior)

---

### Step 3: Run Tests and Verify

**Command:** `npm test`

Runs `node --test`, which auto-discovers `test/**/*.test.js`.

**Verification criteria:**
- All tests pass (green)
- `GET /api/hello` returns `{ "hello": "world" }` with HTTP 200
- `GET /api/unknown` returns JSON with HTTP 404
- Server starts without errors via `node src/index.js`

**Complexity:** Trivial
**Dependencies:** Steps 1, 2

---

## Dependency Graph

```
Step 1 (src/index.js)
    │
    └── Step 2 (test/hello.test.js)
            │
            └── Step 3 (npm test)
```

Steps 1 and 2 must be sequential (test must match app behavior). Step 3 is the final verification.

## Files to Modify

| File | Step | Change |
|------|------|--------|
| `src/index.js` | 1 | Response body → `{ hello: 'world' }`, 404 → `{ error: 'Not Found' }` |
| `test/hello.test.js` | 2 | Assertion for new response body + 404 body check |

No new files needed — the project structure is already established.

## Test Strategy

- **Type:** Integration (end-to-end via HTTP)
- **Framework:** Node.js built-in `node:test` + `node:assert/strict`
- **HTTP client:** Node.js built-in `http` module
- **Port strategy:** Dynamic port (`listen(0)`) to avoid conflicts
- **Isolation:** Each test starts its own server instance; teardown destroys server and clears module cache
- **Coverage:**
  - Happy path: `GET /api/hello` → 200 + `{ hello: "world" }` + `Content-Type: application/json`
  - Edge case: unknown route → 404 + JSON body with `{ error: "Not Found" }` + `Content-Type: application/json`

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `require.cache` stale after edit | Low | Clear cache in test `after` hook (already implemented) |
| Response body change breaks downstream consumers | N/A | No consumers — this is a standalone example API |
| Express `.json()` doesn't set Content-Type | Very low | Express `.json()` always sets `Content-Type: application/json` — confirmed by Express 4.x docs |
