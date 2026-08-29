// Drives the real login form on production. The password is a Server Action,
// so the only honest way to know it works is to type it and see the console.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PW_PATH);

const BASE = "https://dreaminginslumsfoundation.vercel.app";
const PW = process.env.ADMIN_PW;

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
await page.fill('input[name="password"]', PW);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);

const url = page.url();
const body = await page.innerText("body");
const cookie = (await ctx.cookies()).find((c) => c.name === "dis_admin");

console.log("url after submit:", url);
console.log("session cookie set:", !!cookie);
console.log("shows error:", body.includes("not right"));

if (cookie && !url.includes("/login")) {
  console.log("LOGIN OK");
  // Prove the console actually renders behind the session.
  for (const path of ["/admin", "/admin/website/home", "/admin/media", "/admin/lists/team_member", "/admin/settings"]) {
    const r = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
    const t = await page.innerText("body");
    console.log(`  ${path.padEnd(28)} ${r.status()} ${t.slice(0, 40).replace(/\s+/g, " ")}`);
  }
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.screenshot({ path: "admin-dashboard.png", fullPage: false });
} else {
  console.log("LOGIN FAILED");
  console.log(body.slice(0, 300));
}

await browser.close();
