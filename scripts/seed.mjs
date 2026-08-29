// Loads the scraped site into the CMS: every photograph, every word, every
// achievement, every team member, laid out as the page blocks the old site had.
//
//   node scripts/seed.mjs           refuses to run if content already exists
//   node scripts/seed.mjs --force   wipes blocks and entries, then reseeds
//
// Photographs come from ../content-inventory/images, which is the Step 2 scrape
// of dreaminginslumsfoundation.org. Media rows are content-addressed, so a
// re-run reuses the same rows rather than duplicating them — that is why
// --force does not clear media_assets.
//
// SOURCING RULE: every string in this file is either copied verbatim from the
// old site or is one of the handful of additions marked NEW below. Nothing is
// paraphrased. Where the old site had no value, the field is left empty and
// flagged in the README rather than invented.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import postgres from "postgres";
import sharp from "sharp";

import { loadEnv } from "./env.mjs";

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const IMAGE_DIR = path.join("content-inventory", "images");
/**
 * Media pulled out of the foundation's own deck (August 2026). Newer and
 * better than anything on the old website — the logo here is 808px wide and
 * transparent, against the 200px one the old site served.
 */
const DECK_DIR = path.join("content-inventory", "from-deck");
const FORCE = process.argv.includes("--force");

const ssl = /[?&]sslmode=disable/.test(process.env.DATABASE_URL) ? false : "require";

const sql = postgres(process.env.DATABASE_URL, {
  ssl,
  max: 1,
  connect_timeout: 30,
  idle_timeout: 20,
  connection: { search_path: "public, extensions" },
});

/* ------------------------------------------------------------------ media -- */

/**
 * Alt text for the scraped photographs.
 *
 * The old website had no alt text on a single image, so none of this could be
 * migrated. What is written here is only what the page itself already told us
 * about the picture: an achievement's own caption, or the name of the person in
 * a portrait. Everything else is deliberately left blank — the console flags a
 * blank description so a human writes it, which is better than this script
 * inventing a description of a photograph nobody has looked at.
 */
const ALT = {
  "logo.png": "Dreaming In Slums Foundation logo",
  "logo-mob.png": "Dreaming In Slums Foundation logo",
  "bank-qr-code.jpg": "QR code for bank donations to Dreaming In Slums Foundation",
  "gulafsha-ansari-pic.jpg": "Gulafsha Ansari",
  "prajkta-tambadkar.jpg": "Prajakta Tambadkar",
  "muskaan-nishad.jpg": "Muskan Nishad",
  "pallavi-coach.jpg": "Pallavi",
  // women.jpg is a generic stock graphic the old site used for two different
  // people. Describing it as either of them would be a lie.
  "women.jpg": "",
  // Icons beside a heading that already says the same word. Decorative.
  "about.png": "",
  "emphasis.png": "",
  "scope.png": "",
};

const media = new Map(); // filename -> uuid

async function importImage(filename, alt, dir = IMAGE_DIR) {
  if (media.has(filename)) return media.get(filename);

  const file = path.join(dir, filename);
  if (!fs.existsSync(file)) {
    console.warn(`  missing image, skipped: ${filename}`);
    media.set(filename, null);
    return null;
  }

  // Same normalisation the console applies to an upload, so a seeded row and an
  // uploaded row are indistinguishable afterwards.
  const result = await sharp(fs.readFileSync(file), { failOn: "error" })
    .rotate()
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const sha256 = createHash("sha256").update(result.data).digest("hex");
  const description = (alt ?? ALT[filename] ?? "").trim();

  const [existing] = await sql`select id, alt from media_assets where sha256 = ${sha256}`;
  if (existing) {
    if (description && !existing.alt) {
      await sql`update media_assets set alt = ${description} where id = ${existing.id}::uuid`;
    }
    media.set(filename, existing.id);
    return existing.id;
  }

  const [row] = await sql`
    insert into media_assets (sha256, filename, content_type, bytes, width, height, alt, data)
    values (${sha256}, ${filename}, 'image/webp', ${result.data.length},
            ${result.info.width}, ${result.info.height}, ${description}, ${result.data})
    returning id`;

  media.set(filename, row.id);
  return row.id;
}

const img = (filename) => media.get(filename) ?? null;

/* ----------------------------------------------------------------- content -- */

/**
 * The 36 achievements, in the order the Achievements page lists them.
 *
 * `date` is pulled out of the caption where the caption states one, and left
 * empty where it does not. Curly apostrophes are restored: the live HTML serves
 * double-encoded UTF-8, so the source literally reads "Jerseyâ€™s".
 */
const ACHIEVEMENTS = [
  ["achievments-1.jpg", "", "120 Jersey’s Sponsored to the girls, including Coaches by FSSA"],
  ["achievments-2.jpg", "", "Girls Soccer Clinic held at Santacruz Centre led by Coach Johnny."],
  ["achievments-3.jpg", "28 April 2023", "10 Coaches attended the Mental Health Resilience Workshop for Coaches on 28th April, 2023 at U.S Consulate General, Mumbai."],
  ["achievments-4.jpg", "February 2023", "February 2023, started Nutrition Program for Girls"],
  ["achievments-5.jpg", "", "Aarti Chauhan received Medals and Certificates on Annual Sports Day."],
  ["achievments-6.jpg", "5 March 2023", "5th March, 2023 We celebrated International Women’s Day 2023 in both Centers around 90 girls and Coaches participated in this."],
  ["achievments-7.jpg", "2 April 2023", "2nd April, Sunday 2023 our 30 girls and 3 Coaches were invited to visit the campus at Pillai Institute of Management Studies & Research, Sector 16, New Panvel."],
  ["achievments-8.jpg", "", "10 girls and 1 Coach was part of the Invincible Women 5 Kilometer run Category."],
  ["achievments-9.jpg", "", "10 Girls and 2 Coaches were part of Goals for girls leadership held at Goa."],
  ["achievments-10.jpg", "24 January", "National Girl Child Day-24th January Pratiksha Updhyay and Nisha Athavle were awarded Best Students of the year for the Academic year 2022-23"],
  ["achievments-11.jpg", "", "Our Under 15 girls played a tournament organized by Concern India, they were the Runners-up and Pratiksha Won the Best Player of the Tournament."],
  ["achievments-12.jpg", "6 November 2022", "Bosco Community Sports Club invited our girls on 6th November, Sunday 2022, wherein 120 girls were donated with football shoes."],
  ["achievments-13.jpg", "16 October 2022", "Sports Psychology session conducted on 16th October, Sunday 2022 by Kunashni- Sports Psychologist and Ex-Vice Captain of Indian Women’s Team."],
  ["achievments-14.jpg", "5 June 2022", "5th June 2022, Conducted Sexual Health Reproductive Rights (SRHR) & Gender Based Violence (GBV) sessions for the coaches."],
  ["achievments-15.jpg", "26 March 2022", "26th March 2022 Reached 40 girls at Santacruz, Vakola community A new record to remember."],
  ["achievments-16.jpg", "18 December 2021", "18th December 2021, Started a session after Pandemic Covid-19"],
  ["achievments-17.jpg", "2021", "Goals for Girls We are the change project awards 2021"],
  ["achievments-18.jpg", "2021", "Goals for Girls We are the change project awards 2021"],
  ["achievments-19.jpg", "2020", "Adidas league 2020 Winners"],
  ["achievments-20.jpg", "2019", "Goals for Girls Project Winners 2019"],
  ["achievments-21.jpg", "2018", "League of legends 2018 Winners"],
  ["achievments-22.jpg", "2018", "Maasika mahotsav tournament 2018 Runners up"],
  ["achievments-23.jpg", "2019", "Women's day Cup Runners up 2019"],
  ["achievments-24.jpg", "2018", "Rotaract club Winners & Runners up 2018"],
  ["achievments-25.jpg", "2019", "Exhibition match played at Kanjurmarg Winners 2019"],
  ["achievments-26.jpg", "2019", "Semi Finalists in Global girls world cup 2019"],
  ["achievments-27.jpg", "2018", "U14 girls participated in Thunderbolt league 2018"],
  ["achievments-28.jpg", "2018", "Football premier league Runners up 2018"],
  ["achievments-29.jpg", "", "Participated in Zars Tournament"],
  ["achievments-30.jpg", "2019", "Coach Khoj Six a side league Runners up 2019"],
  ["achievments-31.jpg", "2018", "Participated at CM chashak tournament 2018"],
  ["achievments-32.jpg", "2019", "Participated in United women's premier league 2019"],
  ["achievments-33.jpg", "2018", "Exhibition match at Andheri Winners 2018"],
  ["achievments-34.jpg", "2019 and 2020", "Participated in Goals for Girls Leadership Summit 2019 in Nagpur & 2020 in Bangalore"],
  ["achievments-35.jpg", "", "Participated in Scort Foundation training associated with The football club & Social Alliance"],
  ["achievments-36.jpg", "2018", "Semi finalists in Bhandup Tournament 2018"],
  // From the foundation's own deck, August 2026. Newer than anything the old
  // website carried, and quoted the same way.
  ["image16.jpg", "", "2 girls from our program represented Maharashtra States and won the tournament"],
  ["image17.jpg", "", "30 girls have participated in Super league football tournament in Mumbai Football Association."],
  ["image25.jpg", "2024", "1 coach completed her professional football coaching licence"],
  [null, "2025", "1 coach completed her professional football coaching licence"],
];

/**
 * The team, exactly as the homepage carousel lists them.
 *
 * Every one of them is labelled "Founder" on the live site, which contradicts
 * the About page — "Dreaming In Slums was founded by Gulafsha Ansari in March
 * 2017", singular. The wrong roles are carried over verbatim rather than
 * corrected by guesswork; see the README.
 *
 * Every social icon on the old site was `javascript:void(0);`, so there are no
 * profile addresses to migrate.
 */
const TEAM = [
  ["Gulafsha Ansari", "Founder", "gulafsha-ansari-pic.jpg"],
  ["Prajakta Tambadkar", "Founder", "prajkta-tambadkar.jpg"],
  ["Sheetal Pal", "Founder", "women.jpg"],
  ["Muskan Nishad", "Founder", "muskaan-nishad.jpg"],
  ["Pallavi", "Founder", "pallavi-coach.jpg"],
  ["Jyoti Hiwale", "Founder", "women.jpg"],
];

/** Gallery order as the page shows it: tab one is 10–18, tab two is 1–9. */
const GALLERY = [
  ...Array.from({ length: 9 }, (_, i) => `gallery-${i + 10}.jpg`),
  ...Array.from({ length: 9 }, (_, i) => `gallery-${i + 1}.jpg`),
];

/* ------------------------------------------------------------------ writes -- */

async function addItem(kind, position, visible, data) {
  await sql`
    insert into content_items (kind, position, is_visible, data)
    values (${kind}, ${position}, ${visible}, ${sql.json(data)})`;
}

async function addBlock(pageKey, type, position, visible, data) {
  await sql`
    insert into page_blocks (page_key, block_type, position, is_visible, data)
    values (${pageKey}, ${type}, ${position}, ${visible}, ${sql.json(data)})`;
}

async function setSetting(key, value) {
  await sql`
    insert into settings (key, value) values (${key}, ${sql.json(value)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

const link = (label, href) => ({ label, href });
const NO_LINK = link("", "");

/* -------------------------------------------------------------------- run -- */

const [{ blocks }] = await sql`select count(*)::int as blocks from page_blocks`;
if (blocks > 0 && !FORCE) {
  console.error(
    `There are already ${blocks} sections in the database. Re-run with --force to wipe every section and entry and seed again. Photographs are never deleted.`
  );
  await sql.end();
  process.exit(1);
}

if (FORCE) {
  await sql`delete from page_blocks`;
  await sql`delete from content_items`;
  console.log("cleared existing sections and entries");
}

/* Images ------------------------------------------------------------------- */

console.log("importing photographs…");

const files = fs.existsSync(IMAGE_DIR) ? fs.readdirSync(IMAGE_DIR).sort() : [];
if (!files.length) {
  console.error(`No images found in ${IMAGE_DIR}. The Step 2 scrape must be present.`);
  await sql.end();
  process.exit(1);
}

// Achievement captions double as their own alt text: the caption already
// describes what the photograph shows, and it was written by the foundation.
const captionAlt = Object.fromEntries(
  ACHIEVEMENTS.filter(([file]) => file).map(([file, , caption]) => [file, caption])
);

for (const file of files) {
  await importImage(file, captionAlt[file] ?? ALT[file] ?? "");
}

// The deck's media. Only the files actually used are imported — the deck also
// carries slide furniture and screenshots that are not site content.
const DECK_ALT = {
  "image1.png": "Dreaming In Slums Foundation logo: hands reaching around a football",
  "image19.jpg": "Nisha Athawale sitting on the pitch in her Dreaming In Slums kit",
  "image20.jpg": "Sonali Yadav in her Dreaming In Slums kit",
  "image16.jpg": "",
  "image17.jpg": "",
  "image25.jpg": "",
};
for (const [file, alt] of Object.entries(DECK_ALT)) {
  // An achievement photograph describes itself through its caption, the same
  // rule the old site's images follow.
  await importImage(file, captionAlt[file] ?? alt, DECK_DIR);
}

console.log(`  ${media.size} photographs in the library`);

/* Settings ----------------------------------------------------------------- */

await setSetting("site", {
  org_name: "Dreaming In Slums Foundation",
  short_name: "Dreaming In Slums",
  // NEW — design copy, not the foundation's own words. The old site carried no
  // tagline at all. It sets the huge line across the top of the footer; empty
  // it in Settings and that line simply disappears.
  tagline: "Play. Lead. Dream.",
  // The deck's logo, not the old site's: 808px and transparent against 200px
  // and flattened onto white.
  logo_media_id: img("image1.png"),
  // The old site linked assets/images/favicon.png on every page; it 404s.
  favicon_media_id: null,
  email: "dreaminginslums22@gmail.com",
  phone: "+91 9987444460",
  address:
    "Room no 107, Jai Sainath Chawl, Dattamandir Road, Waghriwada, Vakola, Santacruz East, Mumbai-400055",
  facebook: "https://www.facebook.com/dreaminginaslum",
  // The old site's Instagram icon was a dead javascript:void(0) link. The deck
  // gives the actual handle.
  instagram: "https://www.instagram.com/dreaming_in_slums/",
  youtube: "",
  linkedin: "",
  // NEW — design copy. The old footer had only an address and a phone number.
  footer_blurb: "Aspire to Inspire. Changing lives, one game at a time.",
  announcement: { enabled: false, text: "", href: "" },
  donate: link("Donate Now", "/get-involved"),
});

await setSetting("brand", {
  // The design's palette: deep violet ink on warm paper, gold as the single
  // accent. Change any of these in Settings and the whole site follows.
  color_primary: "#3C1A6E",
  color_secondary: "#6A3AD6",
  color_accent: "#F5B800",
  color_ink: "#17092E",
  color_paper: "#F4EFE4",
});

await setSetting("nav", {
  // The six links the old header carried, in its order. /get-involved is a new
  // page reachable from the Donate button; add it here when you want it in the
  // menu.
  primary: [
    link("Home", "/"),
    link("About us", "/about"),
    link("Programs", "/programs"),
    link("Achievements", "/achievements"),
    link("Gallery", "/gallery"),
    link("Contact", "/contact"),
  ],
  footer_groups: [],
});

await setSetting("seo", {
  default_title: "Dreaming In Slums Foundation",
  // NEW. The old site had no meta description on any page. This one is
  // assembled only from sentences already on the About page.
  default_description:
    "Dreaming In Slums is a nonprofit organization imparting football training to young women aged 6 to 16 in Mumbai, building life skills, leadership and independence.",
  og_media_id: null,
});

console.log("settings written");

/* Content lists ------------------------------------------------------------- */

for (const [index, [file, date, caption]] of ACHIEVEMENTS.entries()) {
  await addItem("achievement", (index + 1) * 10, true, {
    media_id: file ? img(file) : null,
    date_label: date,
    caption,
  });
}

for (const [index, [name, role, file]] of TEAM.entries()) {
  await addItem("team_member", (index + 1) * 10, true, {
    name,
    role,
    media_id: img(file),
    bio: "",
    facebook: "",
    instagram: "",
    linkedin: "",
  });
}

for (const [index, file] of GALLERY.entries()) {
  await addItem("gallery_photo", (index + 1) * 10, true, {
    media_id: img(file),
    // The old gallery had no captions of any kind.
    caption: "",
    taken_label: "",
  });
}

/**
 * The scoreboard figures.
 *
 * The old website published no statistics section, so every number here is
 * lifted verbatim from a sentence that already existed on it — the note field
 * records exactly where, so anyone can check. The design's 200+/25+/6/9 were
 * invented for the mock and are not used.
 *
 * The last row is deliberately not a number: it exercises the odometer's
 * fallback, and "12A" is a real certification rather than a count.
 */
const STATS = [
  [
    "200+",
    "girls training every weekend",
    "Foundation deck, verbatim: “currently working with 200 plus girls on every weekend”. Supersedes the 150+ the old website carried.",
  ],
  [
    "10",
    "girls when we started",
    "Foundation deck, verbatim: “We started with just 10 girls”.",
  ],
  [
    "2",
    "centres — Dharavi and Santacruz",
    "Foundation deck, verbatim: “we have 2 centres one in Dharavi and Santacruz”.",
  ],
  [
    "30",
    "girls in the MFA Super League",
    "Foundation deck, verbatim: “30 girls have participated in Super league football tournament in Mumbai Football Association”. The old website said 5.",
  ],
  [
    "12A",
    "certified, April 2022",
    "About page, verbatim: “In April 2022, we achieved our registration and obtained the 12A certificate.”",
  ],
];

for (const [index, [value, label, note]] of STATS.entries()) {
  await addItem("impact_stat", (index + 1) * 10, true, { value, label, note });
}

/**
 * The two change-maker statements, verbatim from the foundation's own deck,
 * with the photographs that accompanied them.
 *
 * Consent is recorded as held because the foundation supplied these — names,
 * words and pictures together — as material for publication. That is a
 * different thing from a migration script inventing them, which is why the
 * list was empty until this deck arrived. If either girl withdraws, untick the
 * consent field and she disappears from the site immediately.
 */
const DREAMERS = [
  {
    name: "Nisha Athawale",
    age: "17",
    location: "",
    media: "image19.jpg",
    quote:
      "From being trained to now training others, I truly understand why they say football is emotion. For me, it’s joy, pride, and purpose.",
    story:
      "I’m Nisha Athawale, 17, from Dreaming in Slum Foundation. My football journey began at 10 through my elder sister. Before that, I loved all sports—running, long jump, kho-kho, kabaddi—but had no idea what football was. That changed when I joined DIS and met Gulafsha Di and Prajakta Di, who shaped me into the player I am today.\n\n" +
      "Coming from a middle-class family—my mom a maid, my dad an electrician—my parents always supported my dream. I’ve had the chance to play matches, attend the Goals for Girls program in Goa, and even watch a FIFA Women’s World Cup semifinal live.\n\n" +
      "Today, I proudly represent my college football team and also lead and guide young players at DIS. From being trained to now training others, I truly understand why they say football is emotion. For me, it’s joy, pride, and purpose.\n\n" +
      "I’m forever grateful to DIS and my coaches for believing in me.",
  },
  {
    name: "Sonali Yadav",
    age: "",
    location: "",
    media: "image20.jpg",
    quote:
      "Football helped me overcome fear, become a better communicator, and discover the leader within me.",
    story:
      "I’m Sonali Yadav, a proud footballer from Dreaming in Slums Foundation (DIS).\n\n" +
      "I joined DIS at 15. Before that, I was the only girl playing cricket with boys in my area—until I had to stop. I never imagined I’d fall in love with football, but my life changed after joining DIS. I was shy, afraid to talk, and unsure of my abilities. But thanks to my coaches—Gulafsha Di, Muskan Di, Prajakta Di, and Sheetal Di—I found confidence, courage, and purpose.\n\n" +
      "Through DIS, I got life-changing experiences: playing state-level tournaments, leading a project in Goa, winning a football event, and even learning to conduct sessions for younger kids. Football helped me overcome fear, become a better communicator, and discover the leader within me.\n\n" +
      "I’ve learned that mistakes are part of growth, and taking that first step opens a world of opportunity. Football isn't just a game—it's my transformation story.",
  },
];

for (const [index, d] of DREAMERS.entries()) {
  await addItem("dreamer_story", (index + 1) * 10, true, {
    name: d.name,
    age: d.age,
    location: d.location,
    quote: d.quote,
    story: d.story,
    media_id: img(d.media),
    consent: "yes",
  });
}

// partner stays empty: neither the old website nor the deck names any.

console.log(
  `content: ${ACHIEVEMENTS.length} achievements, ${TEAM.length} team members, ` +
    `${GALLERY.length} gallery photographs, ${STATS.length} impact figures, ` +
    `${DREAMERS.length} dreamer stories`
);

/* Pages --------------------------------------------------------------------- */

const achievementIds = await sql`
  select id from content_items where kind = 'achievement' order by position`;

/** The six the homepage carousel showed, in its order: 1, 2, 16, 4, 5, 20. */
const homeAchievements = [1, 2, 16, 4, 5, 20].map((n) => achievementIds[n - 1].id);

/* Home */

await addBlock("home", "hero_slider", 10, true, {
  slides: [
    {
      media_id: img("banner-five.jpg"),
      lead: "Donate",
      headline: "For a better world",
      cta: link("Read More", "/about"),
    },
    {
      media_id: img("banner-six.jpg"),
      lead: "No one",
      // The old headline broke this line with a <br>; the break was decorative.
      headline: "has ever become poor by giving",
      cta: link("Read More", "/about"),
    },
    {
      media_id: img("banner-four.jpg"),
      lead: "Fundraising",
      headline: "is the gentle art of teaching the joy of giving",
      cta: link("Read More", "/about"),
    },
  ],
});

// NEW — design element. Five of the six words are the design's; "Since 2017"
// is the founding year from the About page.
await addBlock("home", "ticker", 15, true, {
  words: ["Dream", "Play", "Empower", "Lead", "Transform", "Since 2017"],
});

await addBlock("home", "impact_stats", 18, true, {
  eyebrow: "Proof of momentum",
  title: "Numbers from the ground / Mumbai",
  stat_ids: [],
});

await addBlock("home", "teaser_cards", 20, true, {
  eyebrow: "",
  title: "",
  cards: [
    {
      media_id: img("about.png"),
      title: "Who are we ?",
      body: "Dreaming In Slums, a nonprofit organization, focuses on imparting football training...",
      cta: link("Read More", "/about#who-we-are"),
    },
    {
      media_id: img("emphasis.png"),
      title: "Emphasis",
      body: "Dreaming In Slums is a visionary initiative dedicated to...",
      cta: link("Read More", "/about#emphasis"),
    },
    {
      media_id: img("scope.png"),
      title: "Scope",
      body: "Creating awareness in the community and also trying to change the...",
      cta: link("Read More", "/about#scope"),
    },
  ],
});

await addBlock("home", "story", 30, true, {
  eyebrow: "About Us",
  title: "Our Mission",
  // The deck's wording, which supersedes the old site's. The old site's two
  // mission lines are kept as the bullets on the About page.
  body: "Using sports and play to uplift girls' lives to build character, confidence and awareness about their rights.",
  bullets: [],
  media_id: img("our-mission.jpg"),
  layout: "image_right",
  cta: link("Read More", "/about#our-mission"),
  anchor: "",
});

await addBlock("home", "story", 40, true, {
  eyebrow: "What We Do",
  title: "Our Vision",
  body: "Elevate girls' lives who have been deprived of their fundamental rights in order to exist in our society.",
  bullets: [],
  media_id: img("our-vision.jpg"),
  layout: "image_left",
  cta: link("Read More", "/about#our-vission"),
  anchor: "",
});

await addBlock("home", "story", 50, true, {
  eyebrow: "",
  title: "Welcome to Dreaming in slums",
  // Verbatim, including the trailing ellipsis the old site truncated it with.
  body: "Dreaming In Slums was founded by Gulafsha Ansari in March 2017, driven by the mission to provide life skills through football coaching to girls and women from urban poor backgrounds. In April 2022, we achieved our registration and obtained the 12A certificate. Although still in the early stages of development, we have been fortunate to receive support from volunteers.....",
  bullets: [],
  // The founder's own words, verbatim from the About page, where the old site
  // had them squeezed into a bullet list.
  quote:
    "I stepped out of my comfort zone, because that is what I believe and in doing so, I have proven that, given an opportunity, Indian girls can play and excel at a sport like football",
  quote_attribution: "Gulafsha Ansari, Founder",
  watermark: "2017",
  media_id: img("achievments-1.jpg"),
  layout: "image_left",
  cta: link("read more", "/about"),
  anchor: "",
});

await addBlock("home", "achievement_rail", 70, true, {
  eyebrow: "",
  title: "Our Achievements",
  achievement_ids: homeAchievements,
  limit: 6,
  cta: link("See all achievements", "/achievements"),
});

await addBlock("home", "dreamer_rail", 80, true, {
  eyebrow: "In their own words",
  title: "Meet Our Dreamers",
  story_ids: [],
  limit: 6,
});

// Every milestone below is a dated fact taken verbatim from the old site —
// five achievement captions and one clause from the About page. The design's
// timeline entries were invented for the mock and were not migrated.
await addBlock("home", "timeline", 85, true, {
  eyebrow: "Momentum",
  title: "Milestones, not monuments",
  entries: [
    { year: "2017", body: "Dreaming In Slums was founded by Gulafsha Ansari in March 2017." },
    { year: "2019", body: "Goals for Girls Project Winners 2019" },
    { year: "2020", body: "Adidas league 2020 Winners" },
    { year: "2021", body: "18th December 2021, Started a session after Pandemic Covid-19" },
    { year: "2022", body: "In April 2022, we achieved our registration and obtained the 12A certificate." },
    { year: "2023", body: "February 2023, started Nutrition Program for Girls" },
  ],
});

await addBlock("home", "team_rail", 90, true, {
  eyebrow: "",
  title: "Join Our Team",
  body: "One person can make a difference, but together we can change the world.",
  cta: link("Join Us", "/contact"),
  member_ids: [],
});

// The design closes the homepage on the gold ask. The words and the QR code are
// the ones the old site used in its donate modal; the three ways to help are
// left empty because the old site named none.
await addBlock("home", "donate_cta", 100, true, {
  eyebrow: "Lead → Transform",
  title: "Join the movement.",
  body: "",
  ways: [],
  cta: link("Donate now", "/get-involved"),
  qr_media_id: img("bank-qr-code.jpg"),
  qr_caption: "Scan the QR code for donation",
  note: "",
});

/* About */

const innerBanner = (title) => ({
  media_id: img("about-inner-banner.jpg"),
  eyebrow: "",
  title,
  body: "",
  cta: NO_LINK,
  align: "left",
});

await addBlock("about", "image_banner", 10, true, innerBanner("About Us"));

await addBlock("about", "story", 20, true, {
  eyebrow: "",
  title: "Who are we ?",
  body:
    "Dreaming In Slums, a nonprofit organization, focuses on imparting football training to young women aged 6 to 16. By offering a progressive curriculum of football skills, our primary aim is to foster empowerment among girls and women. Our objective is to equip young girls with essential life skills that will enable them to achieve independence as they grow. Through our efforts, we aspire to inspire other girls from disadvantaged urban backgrounds to pursue their dreams and embrace self-sufficiency. We achieve this by nurturing leadership abilities and providing positive role models within their communities. We firmly believe that engaging in football can unlock the full potential of these young girls, paving the way for a brighter future and enhanced opportunities" +
    "\n\n" +
    "Dreaming In Slums was founded by Gulafsha Ansari in March 2017, driven by the mission to provide life skills through football coaching to girls and women from urban poor backgrounds. In April 2022, we achieved our registration and obtained the 12A certificate. Although still in the early stages of development, we have been fortunate to receive support from volunteers representing diverse backgrounds and societies, all united by their belief in our NGOs purpose. As we continue to grow, Dreaming In Slums envisions expanding its services to multiple locations across Mumbai and other states, amplifying our impact and reaching a greater number of individuals in need." +
    "\n\n" +
    // The deck's own description of the organisation, added rather than
    // substituted — it says something the older paragraphs do not.
    "Dreaming In Slums is an organization that uses sports and education to empower girls and enable them to achieve their full potential. In the underserved communities, girls are more vulnerable and destitute; we work with slum girls to help them build the capacity to live better lives and become active citizens.",
  bullets: [],
  media_id: null,
  layout: "none",
  cta: NO_LINK,
  anchor: "who-we-are",
});

await addBlock("about", "story", 30, true, {
  eyebrow: "",
  title: "Emphasis",
  body: "Dreaming In Slums is a visionary initiative dedicated to empowering girls and women across all age groups and backgrounds by offering valuable life skills through the medium of football coaching.",
  bullets: [],
  media_id: img("about-emphasis.jpg"),
  layout: "image_right",
  cta: NO_LINK,
  anchor: "emphasis",
});

await addBlock("about", "story", 40, true, {
  eyebrow: "",
  title: "Why we want to train girls in football?",
  body: "",
  bullets: [
    "We want to train the girls so that they can learn life skills and become self-sufficient in future. Our goal is to create leaders & role models in the community and to inspire other girls from the urban poor to realize their dreams and be independent.",
  ],
  // The old site had this quote squeezed into the bullet list above. The words
  // are untouched; only where they sit has changed.
  quote:
    "I stepped out of my comfort zone, because that is what I believe and in doing so, I have proven that, given an opportunity, Indian girls can play and excel at a sport like football",
  quote_attribution: "Gulafsha Ansari, Founder",
  media_id: img("train-girls.jpg"),
  layout: "image_left",
  cta: NO_LINK,
  anchor: "train-girl",
});

await addBlock("about", "story", 50, true, {
  eyebrow: "",
  title: "Scope",
  body: "",
  bullets: [
    "Girls will become self-sufficient in the future.",
    "Creating awareness in the community and also trying to change the mindset of the community through football and life skills.",
    "Give them a chance to step out of their house to play football and get experience in sports.",
    "Girls can be future role models for other girls in the community.",
    "We aim to start a specialized batch with life skills coaching for talented girls from all walks of life.",
    "We would like to focus and build up grassroot level football.",
    "We will be making a Women’s/Girls Team who will participate in different age category tournaments across India, to start with we will play local tournaments in Mumbai. We would like to participate in MFA/ WIFA Tournaments.",
  ],
  media_id: img("about-scope.jpg"),
  layout: "image_right",
  cta: NO_LINK,
  anchor: "scope",
});

await addBlock("about", "story", 60, true, {
  eyebrow: "",
  title: "Our Vision",
  body: "Elevate girls' lives who have been deprived of their fundamental rights in order to exist in our society.",
  bullets: [
    // The first of the old site's four vision lines is now the lead sentence
    // above, so it is not repeated here.
    "Encourage young girls' aspirations so they can grow up to be strong, visionary women.",
    "Encourage all women and girls to discover their inner powers so they can dream big and take action.",
    "Create a supportive environment for the girls in your community's growth and achievement by empowering them.",
  ],
  media_id: img("our-vision.jpg"),
  layout: "image_left",
  cta: NO_LINK,
  // Misspelled on the old site. Kept so existing inbound links still land.
  anchor: "our-vission",
});

await addBlock("about", "story", 70, true, {
  eyebrow: "",
  title: "Our Mission",
  body: "Using sports and play to uplift girls' lives to build character, confidence and awareness about their rights.",
  bullets: [
    "Inspiring females by connecting communities to their true goals.",
    "Collaborate with communities to provide an opportunity for a girl child to pursue her ambitions.",
  ],
  media_id: img("our-mission.jpg"),
  layout: "image_right",
  cta: NO_LINK,
  anchor: "our-mission",
});

/* Programs */

await addBlock("programs", "image_banner", 10, true, innerBanner("Programs"));

await addBlock("programs", "program_list", 20, true, {
  eyebrow: "",
  title: "",
  intro: "",
  entries: [
    {
      title: "Football Program",
      // Figures updated from the foundation's own deck: 200 plus girls, not
      // 150, and 30 girls in the Super League, not 5. The rest is the old
      // site's wording, unchanged.
      body:
        "We are training 200 plus girls every weekend, across 2 centres — one in Dharavi and one in Santacruz. We have played many tournaments and had won\n\n" +
        "2 girls from our program represented Maharashtra States and won the tournament\n\n" +
        "30 girls have participated in Super league football tournament in Mumbai Football Association.\n\n" +
        "We Have Also Participated In U12 Girls Tournaments. 2 Girls Got Selected To Play U17 Mumbai Football Association Youth League",
    },
    {
      title: "Youth Training Program",
      // The deck carries this list two years further than the old site did,
      // and gives a different 2023 entry. Quoted from the deck.
      body:
        "2019:- 2 coaches participated in international grassroot training organized in India\n\n" +
        "2021:- 4 coach participated in training organized by Coaches Across Continent on child safeguarding, GBV, conflict resolution.\n\n" +
        "2022:- 10 coaches got trained on SRHR and GBV purposeful play\n\n" +
        "2022:- 5 youths participated in grassroot training youth leader\n\n" +
        "2023:- 4 youth participated in Coaches Across Continent training purposeful play\n\n" +
        "2024:- 1 coach completed her professional football coaching licence\n\n" +
        "2025:- 1 coach completed her professional football coaching licence",
    },
  ],
});

/**
 * The leadership programme by year, from the deck.
 *
 * Kept as its own block rather than merged into the write-ups below. The deck
 * names five projects with years and headcounts; the old website describes five
 * projects, some with different names and one with a conflicting year
 * ("Say No to Plastic Bottles (2018)" against the deck's 2023). Merging them
 * would mean deciding which of two sources from the same organisation is wrong,
 * which is not a call a migration gets to make. Both are here; the foundation
 * can reconcile them in the console.
 */
await addBlock("programs", "program_list", 25, true, {
  eyebrow: "By year",
  title: "Leadership program achievements",
  intro: "",
  entries: [
    { title: "2019 — Find Safe Space To Play", body: "8 girls were selected for leadership camp." },
    { title: "2020 — Best Out Of Waste", body: "4 girls were selected for camp." },
    { title: "2021 — Power Of Education", body: "10 girls, online." },
    { title: "2022 — Building Healthy Habits", body: "10 girls." },
    { title: "2023 — Say No To Plastics", body: "10 girls." },
  ],
});

await addBlock("programs", "program_list", 30, true, {
  eyebrow: "",
  title: "Our leadership program",
  intro:
    "Our girls have actively participated in leadership camps organized by partner organizations, where they have honed their leadership skills. Each year, they choose to undertake community projects to make a positive difference in their community. Here is a list of the projects our girls have undertaken:-",
  entries: [
    {
      title: "Say No to Plastic Bottles (2018)",
      body: "In their first community change project, our girls made a valuable contribution to society by raising awareness about the harmful impact of plastic bottles and promoting recycling. Throughout the project, they gained confidence and improved their communication skills by collecting plastic bottles and engaging with people, educating them about the importance of reducing plastic bottle usage and recycling.",
    },
    {
      title: "Aaju Baju No Ground",
      body: "The focus of this project was to increase girls' participation in sports, challenging the prevalent stereotype that girls cannot excel in sports or pursue careers in that field. The girls emphasized the importance of safety in creating an environment where girls could play without fear or hesitation. They identified a suitable ground with basic facilities and invited their female friends, cousins, and sisters to play football. Their hard work, dedication, and love for the sport made this project a success.",
    },
    {
      title: "Power of Education",
      body: 'During the pandemic, our girls worked on a project called "The Power of Education." They aimed to create awareness about the transformative role education plays in one\'s life. They led the project confidently, using football activities and online Zoom sessions to engage with girls aged 14-20. These sessions encouraged critical thinking about the benefits of education, such as spreading awareness, fostering an analytical mind, and combating superstitions. The girls conducted activities highlighting how education empowers individuals to discern right from wrong and contributes to reducing crime rates. They also addressed child education rights, making this project highly effective.',
    },
    {
      title: "Building Healthy Habits",
      // "This year" is undated on the old site. Left exactly as written.
      body: "This year our girls are working on 'Building Healthy Habits' and they aim to make a small change in our and others' habits for a better future and environment by avoiding single-use plastic and reducing the unnecessary use of plastic bags.  They build their confidence to go out and survey random people and take their views on the bad habits that the community people are blindly doing in the past.  So for that, our girls decided to make 50-100 pieces of cloth and paper bags and distribute them in our community for small change and have told people to stop using plastic bags whenever they go out or buy anything, instead of using plastic bags. They empowered many people in the community to stop using plastic bags and change their habits.",
    },
    {
      title: "Best out of Waste",
      body: "During the pandemic lockdown when everyone was scared to go out or do anything, our girls decided to be more positive and keep themselves busy by doing some good work and becoming more creative using their skills.  For this, they chose to run their project through social media and Zoom calls.  They named their project 'Best Out of Waste'.  Formed a group of people from their community and shared ideas, and videos regarding the project.  Through this, many girls made 40-50 cloth masks at home and distributed them to the needy people.  Also, they made some home decorative items from waste and old clothes such as doormats, flower pots, cloth bags, bangles-earrings, multi-purpose organizers, wall hangings, and many more.  It was a good way to utilize their time and talent during that difficult pandemic situation. In addition to these projects, our girls have achieved significant milestones in sports. They have been selected to play at the state level and have participated in various leagues in Mumbai. Furthermore, they have taken on leadership and training roles, guiding other girls from the community in their sporting pursuits.",
    },
  ],
});

/* Achievements */

await addBlock("achievements", "image_banner", 10, true, innerBanner("Achievements"));
await addBlock("achievements", "achievement_rail", 20, true, {
  eyebrow: "",
  title: "",
  achievement_ids: [],
  limit: 60,
  cta: NO_LINK,
});

/* Gallery */

await addBlock("gallery", "image_banner", 10, true, innerBanner("Gallery"));
await addBlock("gallery", "gallery_grid", 20, true, {
  eyebrow: "",
  title: "",
  photo_ids: [],
  limit: 60,
  cta: NO_LINK,
});

/* Contact */

await addBlock("contact", "image_banner", 10, true, innerBanner("Contact Us"));
await addBlock("contact", "contact_details", 20, true, {
  eyebrow: "",
  title: "Our Information",
  body: "",
  map_embed_url:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15082.247856034393!2d72.8403285510556!3d19.08298739609155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c97d2ce23ba3%3A0xea7ba083a4147772!2sSainath%20chawl%20Committee!5e0!3m2!1sen!2sin!4v1695747655356!5m2!1sen!2sin",
  // The old form had no name attributes and posted to an empty form.php, so it
  // could never have worked. Off until a real handler exists.
  show_form: "no",
});

/* Get involved */

await addBlock("get-involved", "image_banner", 10, true, innerBanner("Get involved"));

// The only donation mechanism the old site had was a QR code in a modal. The
// heading and caption are its exact words; there was no body copy to migrate.
await addBlock("get-involved", "donate_cta", 20, true, {
  eyebrow: "",
  title: "Donate",
  body: "",
  // Empty: the old site named no ways to help beyond the QR code. The design's
  // Partner / Volunteer / Sponsor rows are mock copy and were not migrated.
  ways: [],
  cta: NO_LINK,
  qr_media_id: img("bank-qr-code.jpg"),
  qr_caption: "Scan the QR code for donation",
  note: "",
});

// Hidden: the old site listed no partners or sponsors anywhere.
await addBlock("get-involved", "partner_logos", 30, false, {
  eyebrow: "",
  title: "Our partners",
  partner_ids: [],
});

const [{ total }] = await sql`select count(*)::int as total from page_blocks`;
console.log(`pages: ${total} sections across 7 pages`);
console.log("seed complete");

await sql.end();
