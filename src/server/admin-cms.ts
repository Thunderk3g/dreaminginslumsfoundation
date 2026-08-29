import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { sql, withTx } from "@/lib/db";
import { blockDefaults, type BlockType, type PageKey } from "@/lib/blocks";
import { recordDefaults, recordTitle, RECORD_KINDS, type RecordKind } from "@/lib/records";
import { OperatorError } from "./errors";

/**
 * Console writes for everything the site renders.
 *
 * Order matters in three of these — blocks on a page, rows in a list, photos in
 * a grid — and in every case it is stored as an integer column rewritten as a
 * block, not inferred from insertion time. A list an editor can reorder has to
 * survive a save.
 */

/**
 * postgres.js types `sql.json` against its own recursive `JSONValue`, which a
 * `Record<string, unknown>` satisfies structurally but not nominally. This is
 * the one cast in the module, kept in one place so the call sites stay honest.
 *
 * It must be `sql.json` and never `JSON.stringify`: stringifying first stores a
 * jsonb *string* scalar, and every reader then sees `"{...}"` instead of an
 * object — which is exactly how a section renders blank with no error anywhere.
 */
const asJson = (value: unknown) => sql.json(value as Parameters<typeof sql.json>[0]);

/* ------------------------------------------------------------------ media -- */

/** Anything larger is a phone photo nobody cropped; refuse it with a reason. */
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Long edge after normalisation. Above this, `next/image` is only downscaling. */
const MAX_EDGE = 2400;

export type MediaRow = {
  id: string;
  filename: string;
  alt: string;
  content_type: string;
  bytes: number;
  width: number | null;
  height: number | null;
  focal_point: string;
  created_at: string;
  uses: number;
};

/**
 * Normalises an upload and stores it once.
 *
 * Everything is re-encoded to WebP at a sane size before it is stored, which is
 * what keeps rows in the hundreds of kilobytes rather than the megabytes a
 * phone produces. `.rotate()` bakes in the EXIF orientation — without it a
 * portrait photo from a phone lands sideways, and the metadata that would have
 * corrected it is stripped by the re-encode.
 *
 * Storage is content-addressed on the *output* bytes, so the same photo dropped
 * in twice is one row and one URL.
 */
export async function uploadMedia(file: File, alt: string): Promise<string> {
  if (!file || file.size === 0) throw new OperatorError("Choose a file to upload.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new OperatorError(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 15 MB — export it smaller and try again.`
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  let data: Buffer;
  let width: number | null = null;
  let height: number | null = null;
  try {
    const result = await sharp(input, { failOn: "error" })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    data = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch {
    throw new OperatorError("That file is not an image we can read. Use a JPEG, PNG or WebP.");
  }

  return storeMedia({ data, width, height, filename: file.name, alt });
}

/** The insert half of an upload, shared with the seed script's importer. */
export async function storeMedia({
  data,
  width,
  height,
  filename,
  alt,
}: {
  data: Buffer;
  width: number | null;
  height: number | null;
  filename: string;
  alt: string;
}): Promise<string> {
  const sha256 = createHash("sha256").update(data).digest("hex");
  const name = (filename || "image").replace(/[^\w.\- ]+/g, "").slice(0, 120) || "image";

  const [existing] = await sql<{ id: string; alt: string }[]>`
    select id, alt from media_assets where sha256 = ${sha256}`;

  if (existing) {
    // Re-uploading a file already in the library is how an editor fixes a
    // missing description. Never overwrite a description with a blank.
    if (alt.trim() && alt.trim() !== existing.alt) {
      await sql`update media_assets set alt = ${alt.trim()} where id = ${existing.id}::uuid`;
    }
    return existing.id;
  }

  const [row] = await sql<{ id: string }[]>`
    insert into media_assets (sha256, filename, content_type, bytes, width, height, alt, data)
    values (${sha256}, ${name}, 'image/webp', ${data.length}, ${width}, ${height},
            ${alt.trim()}, ${data})
    returning id`;

  return row.id;
}

/**
 * The library, with a usage count so an editor can see what is safe to delete.
 * Counting the references means scanning jsonb as text: payloads hold ids in
 * half a dozen differently-named fields, and a containment query per field
 * would be six index-less scans instead of one.
 */
export async function listMedia(filter: { q?: string } = {}): Promise<MediaRow[]> {
  const q = filter.q?.trim();
  return sql<MediaRow[]>`
    select m.id, m.filename, m.alt, m.content_type, m.bytes, m.width, m.height,
           m.focal_point, m.created_at,
           (
             (select count(*) from page_blocks    where data::text  like '%' || m.id::text || '%') +
             (select count(*) from content_items  where data::text  like '%' || m.id::text || '%') +
             (select count(*) from settings       where value::text like '%' || m.id::text || '%')
           )::int as uses
      from media_assets m
     ${q ? sql`where m.filename ilike ${"%" + q + "%"} or m.alt ilike ${"%" + q + "%"}` : sql``}
     order by m.created_at desc
     limit 400`;
}

export async function updateMedia(id: string, alt: string, focalPoint: string) {
  await sql`
    update media_assets
       set alt = ${alt.trim()}, focal_point = ${focalPoint}
     where id = ${id}::uuid`;
}

/**
 * Deleting is refused while anything points at the asset. References live
 * inside jsonb with no foreign key to protect them, so without this an editor
 * clearing out the library would blank images across the live site and see no
 * error at all.
 */
export async function deleteMedia(id: string): Promise<void> {
  const [row] = await sql<{ uses: number }[]>`
    select (
      (select count(*) from page_blocks   where data::text  like '%' || ${id}::text || '%') +
      (select count(*) from content_items where data::text  like '%' || ${id}::text || '%') +
      (select count(*) from settings      where value::text like '%' || ${id}::text || '%')
    )::int as uses`;

  if (row && row.uses > 0) {
    throw new OperatorError(
      `That image is used in ${row.uses} place${row.uses === 1 ? "" : "s"}. Replace it there first, then delete it.`
    );
  }

  await sql`delete from media_assets where id = ${id}::uuid`;
}

/* ----------------------------------------------------------------- blocks -- */

export async function createBlock(pageKey: PageKey, type: BlockType): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    insert into page_blocks (page_key, block_type, position, is_visible, data)
    values (
      ${pageKey}, ${type},
      coalesce((select max(position) + 10 from page_blocks where page_key = ${pageKey}), 10),
      false,
      ${asJson(blockDefaults(type))}
    )
    returning id`;
  return row.id;
}

export async function updateBlock(
  id: string,
  data: Record<string, unknown>,
  isVisible: boolean
): Promise<void> {
  await sql`
    update page_blocks
       set data = ${asJson(data)}, is_visible = ${isVisible}
     where id = ${id}::uuid`;
}

export async function deleteBlock(id: string): Promise<void> {
  await sql`delete from page_blocks where id = ${id}::uuid`;
}

/** Swaps a block with its neighbour, then renumbers so positions stay sane. */
export async function moveBlock(id: string, direction: "up" | "down"): Promise<void> {
  await withTx(async (tx) => {
    const [block] = await tx<{ page_key: string }[]>`
      select page_key from page_blocks where id = ${id}::uuid`;
    if (!block) return;

    const rows = await tx<{ id: string }[]>`
      select id from page_blocks where page_key = ${block.page_key}
       order by position, created_at`;

    const index = rows.findIndex((r) => r.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= rows.length) return;

    [rows[index], rows[target]] = [rows[target], rows[index]];

    for (const [i, row] of rows.entries()) {
      await tx`update page_blocks set position = ${(i + 1) * 10} where id = ${row.id}::uuid`;
    }
  });
}

/* ---------------------------------------------------------- content items -- */

export async function createItem(kind: RecordKind): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    insert into content_items (kind, position, is_visible, data)
    values (
      ${kind},
      coalesce((select max(position) + 10 from content_items where kind = ${kind}), 10),
      false,
      ${asJson(recordDefaults(kind))}
    )
    returning id`;
  return row.id;
}

export async function updateItem(
  id: string,
  data: Record<string, unknown>,
  isVisible: boolean
): Promise<void> {
  await sql`
    update content_items
       set data = ${asJson(data)}, is_visible = ${isVisible}
     where id = ${id}::uuid`;
}

export async function deleteItem(id: string): Promise<void> {
  await sql`delete from content_items where id = ${id}::uuid`;
}

export async function moveItem(id: string, direction: "up" | "down"): Promise<void> {
  await withTx(async (tx) => {
    const [item] = await tx<{ kind: string }[]>`
      select kind from content_items where id = ${id}::uuid`;
    if (!item) return;

    const rows = await tx<{ id: string }[]>`
      select id from content_items where kind = ${item.kind} order by position, created_at`;

    const index = rows.findIndex((r) => r.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= rows.length) return;

    [rows[index], rows[target]] = [rows[target], rows[index]];

    for (const [i, row] of rows.entries()) {
      await tx`update content_items set position = ${(i + 1) * 10} where id = ${row.id}::uuid`;
    }
  });
}

/* --------------------------------------------------------------- settings -- */

export async function saveSetting(key: string, value: unknown): Promise<void> {
  await sql`
    insert into settings (key, value) values (${key}, ${asJson(value)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

/* ---------------------------------------------------------- picker options -- */

/** Everything the block editor's reference pickers offer, in one round trip. */
export async function getPickerOptions(): Promise<Record<string, { id: string; name: string }[]>> {
  const rows = await sql<{ id: string; kind: RecordKind; data: Record<string, unknown> }[]>`
    select id, kind, data from content_items order by kind, position, created_at`;

  const out = Object.fromEntries(RECORD_KINDS.map((kind) => [kind, [] as { id: string; name: string }[]]));
  for (const row of rows) {
    out[row.kind]?.push({ id: row.id, name: recordTitle(row.kind, row.data) });
  }
  return out;
}

export type PickerOptions = Awaited<ReturnType<typeof getPickerOptions>>;

/* -------------------------------------------------------------- dashboard -- */

export async function getConsoleCounts() {
  const [blocks, items, media] = await Promise.all([
    sql<{ page_key: string; total: number; live: number }[]>`
      select page_key, count(*)::int as total,
             count(*) filter (where is_visible)::int as live
        from page_blocks group by page_key`,
    sql<{ kind: string; total: number; live: number }[]>`
      select kind, count(*)::int as total,
             count(*) filter (where is_visible)::int as live
        from content_items group by kind`,
    sql<{ total: number; missing_alt: number }[]>`
      select count(*)::int as total,
             count(*) filter (where alt = '')::int as missing_alt
        from media_assets`,
  ]);

  return {
    blocks,
    items,
    media: media[0] ?? { total: 0, missing_alt: 0 },
  };
}
