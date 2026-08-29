import { defaultsFor, parseFields, s, id, type FieldSpec } from "./fields";

/**
 * Page blocks — the shape of everything the console can put on a page.
 *
 * One declaration per block type, used three ways:
 *   1. the console renders its editor from `fields`
 *   2. `parseBlockData` turns that form back into the payload
 *   3. the site renders the payload through the matching component
 *
 * Adding a section to the site is a new entry here, a `case` in
 * src/components/blocks/page-blocks.tsx, and one value added to the CHECK
 * constraint in migration 003. Nothing else.
 */

export type PageKey =
  | "home"
  | "about"
  | "programs"
  | "achievements"
  | "gallery"
  | "contact"
  | "get-involved";

export const PAGE_KEYS: { key: PageKey; label: string; path: string; note: string }[] = [
  { key: "home", label: "Homepage", path: "/", note: "The first thing anyone sees." },
  { key: "about", label: "About us", path: "/about", note: "Who we are, our mission, vision, emphasis and scope." },
  { key: "programs", label: "Programs", path: "/programs", note: "Football, coaching and the girls' leadership projects." },
  { key: "achievements", label: "Achievements", path: "/achievements", note: "Everything the girls and coaches have won and done." },
  { key: "gallery", label: "Gallery", path: "/gallery", note: "Photographs, with nothing else on the page." },
  { key: "contact", label: "Contact", path: "/contact", note: "How to reach the foundation." },
  { key: "get-involved", label: "Get involved", path: "/get-involved", note: "Donating, volunteering and partners." },
];

export function isPageKey(value: string): value is PageKey {
  return PAGE_KEYS.some((page) => page.key === value);
}

export type BlockType =
  | "hero_slider"
  | "ticker"
  | "story"
  | "teaser_cards"
  | "impact_stats"
  | "achievement_rail"
  | "gallery_grid"
  | "team_rail"
  | "dreamer_rail"
  | "timeline"
  | "program_list"
  | "rich_text"
  | "image_banner"
  | "donate_cta"
  | "partner_logos"
  | "contact_details";

export type Block = {
  id: string;
  page_key: PageKey;
  block_type: BlockType;
  position: number;
  is_visible: boolean;
  data: Record<string, unknown>;
};

type BlockSpec = {
  label: string;
  /** One line, written for someone who has never seen a CMS. */
  description: string;
  fields: FieldSpec[];
};

/* ------------------------------------------------------------ definitions -- */

const ALIGN = [
  { value: "left", label: "Left" },
  { value: "center", label: "Middle" },
  { value: "right", label: "Right" },
];

export const BLOCK_SPECS: Record<BlockType, BlockSpec> = {
  hero_slider: {
    label: "Banner slideshow",
    description:
      "The big rotating banner at the top of a page. Each slide is one photograph, one headline and one button.",
    fields: [
      {
        kind: "repeat",
        name: "slides",
        label: "Slides",
        addLabel: "Add a slide",
        hint: "They rotate in this order. One slide is fine — it simply stops rotating.",
        fields: [
          { kind: "media", name: "media_id", label: "Photograph" },
          { kind: "text", name: "lead", label: "First word or two (shown in the accent colour)", placeholder: "Donate" },
          { kind: "text", name: "headline", label: "The rest of the headline", placeholder: "For a better world" },
          { kind: "link", name: "cta", label: "Button" },
        ],
      },
    ],
  },

  ticker: {
    label: "Scrolling words",
    description:
      "A single line of words that scrolls slowly sideways, forever. Use it for the words the foundation lives by, not for a sentence.",
    fields: [
      {
        kind: "list",
        name: "words",
        label: "The words",
        hint: "One per line. They repeat, so keep the list short — five or six reads best.",
        placeholder: "Dream",
      },
    ],
  },

  story: {
    label: "Story block",
    description:
      "A heading, a paragraph or a list of points, and a photograph beside it. This is what Who We Are, Our Mission, Our Vision, Emphasis and Scope are made of.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label above the heading", placeholder: "About Us" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "textarea", name: "body", label: "Paragraphs", rows: 6, hint: "Press Enter twice to start a new paragraph." },
      { kind: "list", name: "bullets", label: "Bulleted points", hint: "Leave empty if this block is only paragraphs.", placeholder: "One point per line" },
      { kind: "media", name: "media_id", label: "Photograph" },
      {
        kind: "select",
        name: "layout",
        label: "Where the photograph sits",
        options: [
          { value: "image_right", label: "To the right of the words" },
          { value: "image_left", label: "To the left of the words" },
          { value: "none", label: "No photograph" },
        ],
      },
      { kind: "textarea", name: "quote", label: "Pull quote", rows: 3, hint: "Set large beside the text. Leave empty to hide it." },
      { kind: "text", name: "quote_attribution", label: "Who said it", placeholder: "Gulafsha Ansari, Founder" },
      { kind: "text", name: "watermark", label: "Big faint number behind the photograph", placeholder: "2017", hint: "A year or a figure. Optional." },
      { kind: "link", name: "cta", label: "Button", hint: "Leave both boxes empty to hide it." },
      { kind: "text", name: "anchor", label: "Link anchor", hint: "Lets another page link straight to this block, e.g. `who-we-are` makes /about#who-we-are work. Lowercase, hyphens, no spaces." },
    ],
  },

  teaser_cards: {
    label: "Teaser cards",
    description:
      "A row of small cards, each with an icon, a short summary and a link into a longer page. The three cards under the homepage banner.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading", hint: "Leave empty for no heading above the cards." },
      {
        kind: "repeat",
        name: "cards",
        label: "Cards",
        addLabel: "Add a card",
        fields: [
          { kind: "media", name: "media_id", label: "Icon or small image" },
          { kind: "text", name: "title", label: "Card heading" },
          { kind: "textarea", name: "body", label: "One or two sentences", rows: 3 },
          { kind: "link", name: "cta", label: "Link" },
        ],
      },
    ],
  },

  impact_stats: {
    label: "Impact numbers",
    description:
      "A row of headline numbers — girls trained, years running, coaches developed. Edit the numbers themselves under Impact numbers in the menu.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "refs", name: "stat_ids", label: "Which numbers", source: "impact_stat", hint: "Leave empty to show all of them, in their own order." },
    ],
  },

  achievement_rail: {
    label: "Achievements row",
    description:
      "Photographs of what has been won and done, with their captions. Edit the achievements themselves under Achievements in the menu.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "refs", name: "achievement_ids", label: "Which achievements", source: "achievement", hint: "Leave empty to show the most recent, in their own order." },
      { kind: "number", name: "limit", label: "How many to show", min: 1, max: 60, hint: "Only used when you have not picked them by hand. Set it to 60 to show everything." },
      { kind: "link", name: "cta", label: "Link to the full list" },
    ],
  },

  gallery_grid: {
    label: "Photo grid",
    description: "A grid of photographs. Edit the photographs themselves under Gallery in the menu.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "refs", name: "photo_ids", label: "Which photographs", source: "gallery_photo", hint: "Leave empty to show all of them, in their own order." },
      { kind: "number", name: "limit", label: "How many to show", min: 1, max: 60 },
      { kind: "link", name: "cta", label: "Link to the full gallery" },
    ],
  },

  team_rail: {
    label: "Team",
    description:
      "The people who run the foundation. Edit the people themselves under Team in the menu.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "textarea", name: "body", label: "Paragraph above the people", rows: 2 },
      { kind: "link", name: "cta", label: "Button" },
      { kind: "refs", name: "member_ids", label: "Which people", source: "team_member", hint: "Leave empty to show everyone, in their own order." },
    ],
  },

  dreamer_rail: {
    label: "Dreamer stories",
    description:
      "Girls from the programme in their own words. Edit the stories themselves under Dreamer stories in the menu.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "refs", name: "story_ids", label: "Which stories", source: "dreamer_story", hint: "Leave empty to show all of them, in their own order." },
      { kind: "number", name: "limit", label: "How many to show", min: 1, max: 24 },
    ],
  },

  timeline: {
    label: "Timeline",
    description:
      "Milestones down a centre line, alternating left and right. A year and a sentence for each.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      {
        kind: "repeat",
        name: "entries",
        label: "Milestones",
        addLabel: "Add a milestone",
        hint: "Oldest first. Only put a date here you can point at — an approximate year is worse than none.",
        fields: [
          { kind: "text", name: "year", label: "Year", placeholder: "2017" },
          { kind: "textarea", name: "body", label: "What happened", rows: 3 },
        ],
      },
    ],
  },

  program_list: {
    label: "Programme list",
    description:
      "A run of headed write-ups, one after another — the football programme, the coaching programme, each leadership project.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading", hint: "Leave empty for no heading above the list." },
      { kind: "textarea", name: "intro", label: "Paragraph before the list", rows: 3 },
      {
        kind: "repeat",
        name: "entries",
        label: "Entries",
        addLabel: "Add an entry",
        fields: [
          { kind: "text", name: "title", label: "Entry heading" },
          { kind: "textarea", name: "body", label: "The write-up", rows: 6 },
        ],
      },
    ],
  },

  rich_text: {
    label: "Text",
    description: "A heading and a few paragraphs, nothing else. Press Enter twice to start a new paragraph.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "textarea", name: "body", label: "Text", rows: 10 },
    ],
  },

  image_banner: {
    label: "Page banner",
    description: "A wide photograph with the page title over it. Every inner page starts with one.",
    fields: [
      { kind: "media", name: "media_id", label: "Photograph" },
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Headline" },
      { kind: "textarea", name: "body", label: "Paragraph", rows: 2 },
      { kind: "link", name: "cta", label: "Button" },
      { kind: "select", name: "align", label: "Where the writing sits", options: ALIGN },
    ],
  },

  donate_cta: {
    label: "Donate",
    description:
      "The ask. A heading, a paragraph, a button, and the bank QR code people scan to give.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "textarea", name: "body", label: "Paragraph", rows: 4 },
      {
        kind: "repeat",
        name: "ways",
        label: "Ways to help",
        addLabel: "Add a way to help",
        hint: "Listed as big rows above the button — partnering, volunteering, sponsoring a girl.",
        fields: [
          { kind: "text", name: "title", label: "What it is", placeholder: "Partner with us" },
          { kind: "link", name: "cta", label: "Where it goes" },
        ],
      },
      { kind: "link", name: "cta", label: "Button" },
      { kind: "media", name: "qr_media_id", label: "Bank QR code" },
      { kind: "text", name: "qr_caption", label: "Caption under the QR code", placeholder: "Scan the QR code for donation" },
      { kind: "textarea", name: "note", label: "Small print under everything", rows: 2, hint: "Tax exemption status, receipts, anything a donor should read first." },
    ],
  },

  partner_logos: {
    label: "Partners",
    description:
      "A row of partner and sponsor logos. Edit the partners themselves under Partners in the menu.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "refs", name: "partner_ids", label: "Which partners", source: "partner", hint: "Leave empty to show all of them, in their own order." },
    ],
  },

  contact_details: {
    label: "Contact details",
    description:
      "Email, phone and address — read from Site details in Settings, so they are never typed twice — plus a map and the enquiry form.",
    fields: [
      { kind: "text", name: "eyebrow", label: "Small label" },
      { kind: "text", name: "title", label: "Heading" },
      { kind: "textarea", name: "body", label: "Paragraph", rows: 3 },
      { kind: "text", name: "map_embed_url", label: "Google Maps embed address", hint: "From Google Maps → Share → Embed a map → copy the src=\"…\" address only." },
      {
        kind: "select",
        name: "show_form",
        label: "Show the enquiry form",
        options: [
          { value: "no", label: "No" },
          { value: "yes", label: "Yes" },
        ],
      },
    ],
  },
};

export const BLOCK_TYPES = Object.keys(BLOCK_SPECS) as BlockType[];

export function isBlockType(value: string): value is BlockType {
  return value in BLOCK_SPECS;
}

export function blockDefaults(type: BlockType): Record<string, unknown> {
  return defaultsFor(BLOCK_SPECS[type].fields);
}

export function parseBlockData(type: BlockType, fd: FormData): Record<string, unknown> {
  const spec = BLOCK_SPECS[type];
  return parseFields(spec.fields, defaultsFor(spec.fields), fd);
}

/** One short line describing a block in the page list, built from its payload. */
export function blockSummary(type: BlockType, data: Record<string, unknown>): string {
  const title = s(data, "title") || s(data, "eyebrow");
  if (title) return title;

  switch (type) {
    case "hero_slider": {
      const slides = Array.isArray(data.slides) ? data.slides.length : 0;
      return slides === 1 ? "1 slide" : `${slides} slides`;
    }
    case "contact_details":
      return "Email, phone and address from Settings";
    case "donate_cta":
      return id(data, "qr_media_id") ? "With a QR code" : "No QR code yet";
    default:
      return BLOCK_SPECS[type].label;
  }
}
