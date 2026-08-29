-- 003 · The whole CMS: settings, the media library, page blocks, and the
-- repeatable editorial lists.
--
-- Four tables carry every word and every photograph on this website. Nothing is
-- hardcoded in a component; if an editor can see it on the site, it is a row
-- here and they can change it in the console.

-- ----------------------------------------------------------------- settings --

-- Chrome and brand: site strings, the menu, SEO defaults, brand colours.
-- Shapes are enforced in src/lib/site-settings.ts, and the console renders real
-- fields for every key — an editor never edits raw JSON.
create table settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint settings_value_is_object check (jsonb_typeof(value) = 'object')
);
alter table settings enable row level security;
-- No grant, no policy: read through the server connection only.

-- ------------------------------------------------------------ media library --

-- Image bytes live in Postgres and are served by /api/media/[id] behind a
-- one-year immutable cache header. That is a deliberate trade: no second
-- vendor, no token to rotate, no bucket to leak, and the CDN means the function
-- runs about once per image per region. Uploads are re-encoded to WebP at
-- <= 2400px before they land, so rows are a few hundred KB, not a few MB.
--
-- Content-addressed on the *output* bytes: the same file uploaded twice is one
-- row, so replacing an image everywhere it appears is one pointer change.
create table media_assets (
  id           uuid primary key default gen_random_uuid(),
  sha256       text not null unique,
  filename     text not null,
  content_type text not null,
  bytes        integer not null check (bytes > 0),
  width        integer,
  height       integer,
  -- Alt text is required by the console UI. It is nullable-by-default here only
  -- so an upload can be recorded before the editor has typed it. The old site
  -- had no alt text at all, so every description in this table is new writing.
  alt          text not null default '',
  focal_point  text not null default 'center',
  data         bytea not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint media_assets_type_allowed check (
    content_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif')
  ),
  constraint media_assets_focal_known check (
    focal_point in ('center', 'top', 'bottom', 'left', 'right')
  )
);
create trigger media_assets_updated_at before update on media_assets
  for each row execute function public.set_updated_at();
create index media_assets_created_idx on media_assets(created_at desc);
alter table media_assets enable row level security;
-- No grant, no policy: bytes reach the public only through the route handler.

-- -------------------------------------------------------------- page blocks --

-- Every page is a list of ordered blocks, each with a typed jsonb payload. The
-- console edits rows here; the site renders whatever it finds. Adding a section
-- to a page is inserting a row, not a deployment.
--
-- block_type and page_key are CHECKed rather than enums so that adding one is a
-- migration that alters a constraint, not one that rewrites a type used
-- elsewhere. The matching TypeScript declarations live in src/lib/blocks.ts and
-- are the authority on what `data` holds for each type.
create table page_blocks (
  id         uuid primary key default gen_random_uuid(),
  page_key   text not null,
  block_type text not null,
  position   int  not null default 0,
  is_visible boolean not null default true,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint page_blocks_page_known check (page_key in (
    'home', 'about', 'programs', 'achievements', 'gallery', 'contact', 'get-involved'
  )),
  constraint page_blocks_type_known check (block_type in (
    'hero_slider',
    'story',
    'teaser_cards',
    'impact_stats',
    'achievement_rail',
    'gallery_grid',
    'team_rail',
    'dreamer_rail',
    'program_list',
    'rich_text',
    'image_banner',
    'donate_cta',
    'partner_logos',
    'contact_details'
  )),
  -- jsonb, not a JSON string. postgres.js will happily store a stringified
  -- object as a scalar and every reader then sees a string; the check makes
  -- that fail at write time instead of silently blanking a page.
  constraint page_blocks_data_is_object check (jsonb_typeof(data) = 'object')
);
create trigger page_blocks_updated_at before update on page_blocks
  for each row execute function public.set_updated_at();
create index page_blocks_page_idx on page_blocks(page_key, position);
alter table page_blocks enable row level security;

-- ------------------------------------------------------------ content items --

-- The repeatable editorial lists: achievements, team members, gallery photos,
-- impact statistics, dreamer stories, partners.
--
-- One table rather than six, because all six are flat editorial lists with
-- identical operations — add, reorder, show/hide, delete — and no relationships
-- to anything except a photograph. Six near-identical tables would mean six
-- near-identical admin screens; one table plus a spec in src/lib/records.ts
-- means one screen that renders itself, exactly the way page_blocks works.
--
-- If one of these ever grows real relations (an achievement that belongs to a
-- programme, a team member with their own page), promote that kind to its own
-- table then. Until then this is the smaller thing that does the job.
create table content_items (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,
  position   int  not null default 0,
  is_visible boolean not null default true,
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_kind_known check (kind in (
    'achievement',
    'team_member',
    'gallery_photo',
    'impact_stat',
    'dreamer_story',
    'partner'
  )),
  constraint content_items_data_is_object check (jsonb_typeof(data) = 'object')
);
create trigger content_items_updated_at before update on content_items
  for each row execute function public.set_updated_at();
create index content_items_kind_idx on content_items(kind, position);
alter table content_items enable row level security;

-- ----------------------------------------------------------------- defaults --

-- Seeded empty-but-valid so the site renders on a fresh database before anyone
-- runs the content seed. Real values arrive in scripts/seed.mjs.
insert into settings (key, value) values
  ('site', '{
     "org_name": "Dreaming In Slums Foundation",
     "short_name": "Dreaming In Slums",
     "tagline": "",
     "logo_media_id": null,
     "favicon_media_id": null,
     "email": "",
     "phone": "",
     "address": "",
     "facebook": "",
     "instagram": "",
     "youtube": "",
     "linkedin": "",
     "footer_blurb": "",
     "announcement": { "enabled": false, "text": "", "href": "" },
     "donate": { "label": "Donate Now", "href": "/get-involved" }
   }'::jsonb),
  ('brand', '{
     "color_primary": "#5B2E91",
     "color_secondary": "#1F7BC1",
     "color_accent": "#3FA34D",
     "color_ink": "#1B1B1F",
     "color_paper": "#FFFFFF"
   }'::jsonb),
  ('nav', '{ "primary": [], "footer_groups": [] }'::jsonb),
  ('seo', '{
     "default_title": "Dreaming In Slums Foundation",
     "default_description": "",
     "og_media_id": null
   }'::jsonb)
on conflict (key) do nothing;
