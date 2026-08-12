/**
 * No-op stand-in for the `server-only` package.
 *
 * `server-only` throws on import outside a React Server Component, which is
 * exactly the guard we want in the app, but CLI scripts (seed, analyze,
 * cron backfills) are legitimately server-side and would trip it. Scripts run
 * with tsconfig.scripts.json, which maps `server-only` here instead of
 * weakening the guarantee in application code.
 */
export {};
