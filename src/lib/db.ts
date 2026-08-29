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

  // Point DATABASE_URL at Supabase's **session** pooler (port 5432).
  //
  // Not the direct host: it resolves to IPv6 only, and Vercel has no IPv6
  // egress, so connecting there fails with ENETUNREACH.
  //
  // Not the transaction pooler (6543) either, despite that being the usual
  // serverless advice — in the reference project it returned roughly one query
  // per client and hung every subsequent one, unchanged by `prepare: false` or
  // `fetch_types: false`.
  //
  // `max` is 1, and that number is load-bearing. Session mode holds one
  // upstream connection per client connection, and a Supabase project caps them
  // at around 15 — so the budget is shared across every serverless instance
  // alive at once, not per instance. A higher `max` exhausts it and the pooler
  // answers with a FATAL `max clients reached in session mode`, which 500s the
  // page. A request's queries serialise instead, which costs a round trip each,
  // but nearly every public page here is ISR'd and never reaches this at all.
  return postgres(url, {
    ssl: sslFor(url),
    max: 1,
    // Short, so an instance between requests hands its connection back to the
    // shared budget quickly. A busy instance keeps resetting the timer.
    idle_timeout: 3,
    connect_timeout: 15,
    connection: { search_path: "public, extensions" },
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
