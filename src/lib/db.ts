import "server-only";
import postgres from "postgres";

// One pooled client for the whole server. Next.js hot-reloads modules in dev,
// so the instance is cached on globalThis to avoid opening a new pool per edit.
declare global {
  var __disSql: ReturnType<typeof postgres> | undefined;
}

/**
 * TLS is required everywhere except a local Postgres, which does not speak it.
 * Opting out is explicit — `?sslmode=disable` in the URL — so a hosted database
 * can never end up unencrypted by omission.
 */
export const sslFor = (url: string) => (/[?&]sslmode=disable/.test(url) ? false : ("require" as const));

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Thrown on first query rather than at import. Next collects page config by
    // importing modules during the build, so throwing at module scope turns a
    // missing variable into "failed to collect configuration for /_not-found",
    // which says nothing useful about the actual cause.
    throw new Error(
      "DATABASE_URL is not set. On Vercel, check that it is not marked Sensitive — " +
        "sensitive variables are withheld during the build, and pages that prerender " +
        "from the database need it then."
    );
  }

  // Never the direct host (db.<ref>.supabase.co): it resolves to IPv6 only, and
  // Vercel has no IPv6 egress, so connecting there fails with ENETUNREACH.
  //
  // Which pooler matters enormously, and the two behave differently enough that
  // the client has to be configured for the one it is talking to.
  //
  //   Session mode (5432) holds one upstream connection per client connection,
  //   and the whole project is capped at 15 of them — a budget shared across
  //   every serverless instance alive at once, not per instance. Under any real
  //   traffic the pooler answers with a FATAL
  //       (EMAXCONNSESSION) max clients reached in session mode
  //   and the page 500s. That is what took the console down.
  //
  //   Transaction mode (6543) hands the connection back after each statement,
  //   which is what a serverless app actually wants. It requires prepared
  //   statements to be off — pgBouncer cannot route them — and with that set
  //   it is stable: measured 12/12 concurrent clients where session mode was
  //   already refusing connections.
  //
  // So: the app points at 6543. Migrations and the seed script keep 5432,
  // because they are one long-lived process doing DDL, which is exactly what
  // session mode is for.
  const transactionMode = /:6543\b/.test(url);

  return postgres(url, {
    ssl: sslFor(url),
    // In transaction mode a connection is only held for the length of a
    // statement, so a handful per instance is safe and saves a round trip on
    // pages that issue several queries. In session mode it must stay at 1.
    max: transactionMode ? 3 : 1,
    // pgBouncer in transaction mode cannot route prepared statements: leaving
    // this on is what makes postgres.js appear to "hang after one query".
    prepare: !transactionMode,
    // Short, so an instance between requests returns its connection quickly.
    idle_timeout: 3,
    connect_timeout: 15,
    // A pooler in transaction mode does not carry arbitrary startup parameters
    // — a connection is not yours between statements, so there is no session to
    // put them in. Sending search_path anyway is what produced
    // "canceling statement due to statement timeout" on every prerendered page.
    //
    // Nothing at runtime needs it: `extensions` is only on the path for
    // gen_random_uuid() in DDL defaults, and migrations run against the session
    // pooler where the parameter is still set.
    ...(transactionMode ? {} : { connection: { search_path: "public, extensions" } }),
    transform: { undefined: null },
  });
}

// postgres.js does not dial on construction — it connects on the first query —
// so building the client at module scope is already lazy where it matters.
export const sql = globalThis.__disSql ?? connect();
globalThis.__disSql = sql;

/** Opens the single transaction for a request. Never nest these. */
export function withTx<T>(fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(fn) as Promise<T>;
}

export type Tx = postgres.TransactionSql;
