import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { sql } from "@/lib/db";
import type { Block, PageKey } from "@/lib/blocks";
import { isPublishable, type ContentItem, type RecordKind } from "@/lib/records";
import {
  readBrand,
  readNav,
  readSeo,
  readSite,
  type BrandSettings,
  type NavSettings,
  type SeoSettings,
  type SiteSettings,
} from "@/lib/site-settings";

/**
 * Everything the public site reads that an editor can change from the console:
 * page blocks, the editorial lists, the chrome copy, the menu, and image
 * metadata.
 *
 * Two rules hold this module together.
 *
 * First, every read here is cached under the `cms` tag. The header and footer
 * run on every single page, so uncached that is one round trip per page before
 * anything can render. The console calls `revalidateCms()` after every save, so
 * the cache is invalidated by the write rather than waited out.
 *
 * Second, nothing here throws on bad data. A block whose payload is half-filled
 * renders as a missing value; a settings row someone emptied falls back to the
 * shipped copy. The console is the only writer, but a blank homepage is a worse
 * outcome than a stale one.
 */

export const CMS_TAG = "cms";

/** Called by every console action that changes something the site reads. */
export function revalidateCms() {
  revalidateTag(CMS_TAG);
}

/* ------------------------------------------------------------------ media -- */

export type MediaMeta = {
  id: string;
  filename: string;
  alt: string;
  width: number | null;
  height: number | null;
  content_type: string;
  bytes: number;
  focal_point: string;
  created_at: string;
};

/**
 * Media is served by /api/media/[id]. A row's `data` is never updated — the id
 * is the hash of the bytes in all but name — so the URL is safe to cache
 * forever, which is what the route handler tells the CDN.
 */
export function mediaSrc(mediaId: string | null | undefined): string | null {
  return mediaId ? `/api/media/${mediaId}` : null;
}

export const getMediaMeta = unstable_cache(
  async (ids: string[]): Promise<Record<string, MediaMeta>> => {
    if (ids.length === 0) return {};
    const rows = await sql<MediaMeta[]>`
      select id, filename, alt, width, height, content_type, bytes, focal_point, created_at
        from media_assets where id = any(${ids}::uuid[])`;
    return Object.fromEntries(rows.map((row) => [row.id, row]));
  },
  ["cms-media-meta"],
  { revalidate: 3600, tags: [CMS_TAG] }
);

/* ----------------------------------------------------------------- blocks -- */

export const getPageBlocks = unstable_cache(
  async (pageKey: PageKey): Promise<Block[]> =>
    sql<Block[]>`
      select id, page_key, block_type, position, is_visible, data
        from page_blocks
       where page_key = ${pageKey} and is_visible
       order by position, created_at`,
  ["cms-page-blocks"],
  { revalidate: 3600, tags: [CMS_TAG] }
);

/** The console needs hidden blocks too, and never wants a cached answer. */
export async function getPageBlocksForEdit(pageKey: PageKey): Promise<Block[]> {
  return sql<Block[]>`
    select id, page_key, block_type, position, is_visible, data
      from page_blocks
     where page_key = ${pageKey}
     order by position, created_at`;
}

export async function getBlockForEdit(id: string): Promise<Block | null> {
  const [row] = await sql<Block[]>`
    select id, page_key, block_type, position, is_visible, data
      from page_blocks where id = ${id}::uuid`;
  return row ?? null;
}

/* ---------------------------------------------------------- content items -- */

/**
 * Everything of one kind that is fit to publish.
 *
 * `isPublishable` is applied here rather than in SQL because it is a rule about
 * the *content* — a dreamer story without consent on file — and belongs next to
 * the schema that declares it, not duplicated into a WHERE clause.
 */
export const getItems = unstable_cache(
  async (kind: RecordKind): Promise<ContentItem[]> => {
    const rows = await sql<ContentItem[]>`
      select id, kind, position, is_visible, data
        from content_items
       where kind = ${kind} and is_visible
       order by position, created_at`;
    return rows.filter((row) => isPublishable(kind, row.data));
  },
  ["cms-content-items"],
  { revalidate: 3600, tags: [CMS_TAG] }
);

/**
 * Resolves a block's picker into rows: the chosen ones in the chosen order, or
 * everything in its own order when nothing has been picked.
 */
export async function pickItems(
  kind: RecordKind,
  chosen: string[],
  limit?: number
): Promise<ContentItem[]> {
  const all = await getItems(kind);
  if (chosen.length) {
    return chosen.flatMap((wanted) => all.filter((item) => item.id === wanted));
  }
  return limit != null ? all.slice(0, limit) : all;
}

/** The console list: hidden rows included, never cached. */
export async function getItemsForEdit(kind: RecordKind): Promise<ContentItem[]> {
  return sql<ContentItem[]>`
    select id, kind, position, is_visible, data
      from content_items
     where kind = ${kind}
     order by position, created_at`;
}

export async function getItemForEdit(id: string): Promise<ContentItem | null> {
  const [row] = await sql<ContentItem[]>`
    select id, kind, position, is_visible, data
      from content_items where id = ${id}::uuid`;
  return row ?? null;
}

/* --------------------------------------------------------------- settings -- */

export type Chrome = { site: SiteSettings; nav: NavSettings; brand: BrandSettings };

export const getChrome = unstable_cache(
  async (): Promise<Chrome> => {
    const rows = await sql<{ key: string; value: Record<string, unknown> }[]>`
      select key, value from settings where key in ('site', 'nav', 'brand')`;
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      site: readSite(byKey.site ?? null),
      nav: readNav(byKey.nav ?? null),
      brand: readBrand(byKey.brand ?? null),
    };
  },
  ["cms-chrome"],
  { revalidate: 3600, tags: [CMS_TAG] }
);

export const getSeo = unstable_cache(
  async (): Promise<SeoSettings> => {
    const [row] = await sql<{ value: Record<string, unknown> }[]>`
      select value from settings where key = 'seo'`;
    return readSeo(row?.value ?? null);
  },
  ["cms-seo"],
  { revalidate: 3600, tags: [CMS_TAG] }
);

/** Raw read for the console's settings forms — always current, never cached. */
export async function getSettingRaw(key: string): Promise<Record<string, unknown> | null> {
  const [row] = await sql<{ value: Record<string, unknown> }[]>`
    select value from settings where key = ${key}`;
  return row?.value ?? null;
}
