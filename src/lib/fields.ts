/**
 * The field vocabulary shared by page blocks and content records.
 *
 * One declaration of what a field *is* drives three things everywhere it is
 * used: the console renders an editor from it, `parseFields` reads the form
 * back into a payload, and the site reads the payload through the accessors at
 * the bottom of this file.
 *
 * No "use client" and no "server-only": the console imports it in a client
 * component, the site and the Server Actions import it on the server.
 */

/* ------------------------------------------------------------- primitives -- */

export type Cta = { label: string; href: string };

/** What a `refs`/`ref` field can point at. Matches `content_items.kind`. */
export type RefSource =
  | "achievement"
  | "team_member"
  | "gallery_photo"
  | "impact_stat"
  | "dreamer_story"
  | "partner";

/** Fields allowed inside a repeating row. Deliberately a small set. */
export type SubFieldSpec =
  | { kind: "text"; name: string; label: string; placeholder?: string }
  | { kind: "textarea"; name: string; label: string; rows?: number }
  | { kind: "media"; name: string; label: string }
  | { kind: "link"; name: string; label: string };

export type FieldSpec =
  | { kind: "text"; name: string; label: string; hint?: string; placeholder?: string }
  | { kind: "textarea"; name: string; label: string; hint?: string; rows?: number }
  | { kind: "number"; name: string; label: string; hint?: string; min?: number; max?: number }
  | { kind: "media"; name: string; label: string; hint?: string }
  | { kind: "link"; name: string; label: string; hint?: string }
  | { kind: "select"; name: string; label: string; hint?: string; options: { value: string; label: string }[] }
  | { kind: "ref"; name: string; label: string; source: RefSource; hint?: string }
  | { kind: "refs"; name: string; label: string; source: RefSource; hint?: string }
  /** An ordered list of plain lines — the bullet lists all over the About page. */
  | { kind: "list"; name: string; label: string; hint?: string; placeholder?: string }
  /** An ordered list of rows, each row a small set of sub-fields. */
  | { kind: "repeat"; name: string; label: string; hint?: string; addLabel?: string; fields: SubFieldSpec[] };

/* ------------------------------------------------------------------ parsing */

const str = (fd: FormData, key: string): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

const all = (fd: FormData, key: string): string[] =>
  fd.getAll(key).map((v) => (typeof v === "string" ? v.trim() : ""));

/**
 * Rebuilds a payload from the console's form.
 *
 * Every value is coerced here rather than trusted. The editor is behind the
 * staff session, but a payload that reaches the live site with a number where a
 * string belongs blanks a section, and that is a worse failure than a rejected
 * save.
 */
export function parseFields(
  fields: FieldSpec[],
  defaults: Record<string, unknown>,
  fd: FormData
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults };

  for (const field of fields) {
    switch (field.kind) {
      case "text":
      case "textarea":
        out[field.name] = str(fd, field.name);
        break;

      case "number": {
        const text = str(fd, field.name);
        const fallback = Number(defaults[field.name] ?? 0);
        const raw = Number(text);
        // An emptied box means "leave it alone", not "zero" — and `Number("")`
        // is 0, which would clamp to the minimum and quietly shrink a section
        // to one item. Blank and nonsense both fall back to the shipped value.
        let n = text === "" || !Number.isFinite(raw) ? fallback : Math.round(raw);
        if (field.min != null) n = Math.max(field.min, n);
        if (field.max != null) n = Math.min(field.max, n);
        out[field.name] = n;
        break;
      }

      case "media":
      case "ref":
        out[field.name] = str(fd, field.name) || null;
        break;

      case "refs":
        // Order matters for hand-picked rows, and the console submits one
        // hidden input per row in the order they appear on screen.
        out[field.name] = all(fd, field.name).filter(Boolean);
        break;

      case "link":
        out[field.name] = {
          label: str(fd, `${field.name}.label`),
          href: str(fd, `${field.name}.href`),
        } satisfies Cta;
        break;

      case "select": {
        const value = str(fd, field.name);
        out[field.name] = field.options.some((o) => o.value === value)
          ? value
          : field.options[0].value;
        break;
      }

      case "list":
        out[field.name] = all(fd, `${field.name}.item`).filter(Boolean);
        break;

      case "repeat": {
        // Every sub-field submits one input per row, in row order, so zipping
        // the arrays by index reconstructs the rows without nested field names.
        const columns = new Map<string, string[]>();
        for (const sub of field.fields) {
          if (sub.kind === "link") {
            columns.set(`${sub.name}.label`, all(fd, `${field.name}.${sub.name}.label`));
            columns.set(`${sub.name}.href`, all(fd, `${field.name}.${sub.name}.href`));
          } else {
            columns.set(sub.name, all(fd, `${field.name}.${sub.name}`));
          }
        }

        const rowCount = Math.max(0, ...[...columns.values()].map((c) => c.length));
        const rows: Record<string, unknown>[] = [];

        for (let i = 0; i < rowCount; i += 1) {
          const row: Record<string, unknown> = {};
          let filled = false;
          for (const sub of field.fields) {
            if (sub.kind === "link") {
              const label = columns.get(`${sub.name}.label`)?.[i] ?? "";
              const href = columns.get(`${sub.name}.href`)?.[i] ?? "";
              row[sub.name] = { label, href } satisfies Cta;
              if (label || href) filled = true;
            } else if (sub.kind === "media") {
              const value = columns.get(sub.name)?.[i] ?? "";
              row[sub.name] = value || null;
              if (value) filled = true;
            } else {
              const value = columns.get(sub.name)?.[i] ?? "";
              row[sub.name] = value;
              if (value) filled = true;
            }
          }
          // An entirely blank row is a row the editor added and abandoned.
          if (filled) rows.push(row);
        }

        out[field.name] = rows;
        break;
      }
    }
  }

  return out;
}

/** Every field's zero value, so a new record starts valid rather than empty. */
export function defaultsFor(fields: FieldSpec[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    switch (field.kind) {
      case "text":
      case "textarea":
        out[field.name] = "";
        break;
      case "number":
        out[field.name] = field.min ?? 0;
        break;
      case "media":
      case "ref":
        out[field.name] = null;
        break;
      case "refs":
      case "list":
      case "repeat":
        out[field.name] = [];
        break;
      case "link":
        out[field.name] = { label: "", href: "" };
        break;
      case "select":
        out[field.name] = field.options[0]?.value ?? "";
        break;
    }
  }
  return out;
}

/* -------------------------------------------------------------- accessors -- */
/* The site reads payloads through these, so a half-filled block renders as a
   missing value rather than throwing on a live page. */

export function s(data: Record<string, unknown>, key: string): string {
  const v = data[key];
  return typeof v === "string" ? v : "";
}

export function n(data: Record<string, unknown>, key: string, fallback: number): number {
  const v = data[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function id(data: Record<string, unknown>, key: string): string | null {
  const v = data[key];
  return typeof v === "string" && v ? v : null;
}

export function ids(data: Record<string, unknown>, key: string): string[] {
  const v = data[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];
}

export function cta(data: Record<string, unknown>, key: string): Cta | null {
  const v = data[key];
  if (!v || typeof v !== "object") return null;
  const { label, href } = v as Record<string, unknown>;
  if (typeof label !== "string" || typeof href !== "string") return null;
  if (!label.trim() || !href.trim()) return null;
  return { label: label.trim(), href: href.trim() };
}

export function lines(data: Record<string, unknown>, key: string): string[] {
  const v = data[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : [];
}

export function rows(data: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((row): row is Record<string, unknown> => !!row && typeof row === "object");
}
