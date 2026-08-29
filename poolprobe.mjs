// Session mode holds one upstream connection per client, capped at 15 for the
// whole project. Transaction mode hands a connection back after every
// statement, which is what a serverless app needs. postgres.js must have
// prepared statements off to speak to it.
import postgres from "postgres";

const REF = "saptczmkgxwhhlrkldys";
const PW = encodeURIComponent("LYhm&+6dkWZsm*U");
const HOST = "aws-0-ap-northeast-2.pooler.supabase.com";

const url = `postgres://postgres.${REF}:${PW}@${HOST}:6543/postgres`;

const sql = postgres(url, {
  ssl: "require",
  max: 1,
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 3,
  connection: { search_path: "public, extensions" },
});

try {
  // Several round trips in a row is what actually broke in the reference
  // project, so do that rather than a single SELECT 1.
  for (let i = 0; i < 6; i += 1) {
    const [row] = await sql`select count(*)::int as n from page_blocks`;
    process.stdout.write(`${i + 1}:${row.n} `);
  }
  console.log("\ntransaction pooler OK");

  // And a burst of independent clients, the shape Vercel actually produces.
  const clients = Array.from({ length: 12 }, () =>
    postgres(url, { ssl: "require", max: 1, prepare: false, connect_timeout: 10, idle_timeout: 2 })
  );
  const results = await Promise.allSettled(
    clients.map((c) => c`select count(*)::int as n from media_assets`)
  );
  const ok = results.filter((r) => r.status === "fulfilled").length;
  console.log(`concurrent clients: ${ok}/12 succeeded`);
  for (const c of clients) await c.end();
  await sql.end();
  process.exit(ok === 12 ? 0 : 1);
} catch (err) {
  console.log("FAILED:", err.message);
  await sql.end();
  process.exit(1);
}
