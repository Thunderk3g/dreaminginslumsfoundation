import { defaultsFor, parseFields, s, id, type FieldSpec, type RefSource } from "./fields";

/**
 * The repeatable editorial lists.
 *
 * Same idea as BLOCK_SPECS, applied to `content_items` rows instead of page
 * blocks: one declaration per kind, and the console builds its list screen and
 * its editor from it. Adding a list to the site is an entry here plus one value
 * in the CHECK constraint in migration 003.
 *
 * `titleField` is what the row is called in a list; `subtitleField` is the grey
 * line under it. `thumbField` is which media field to show as the thumbnail.
 */

export type RecordKind = RefSource;

export type ContentItem = {
  id: string;
  kind: RecordKind;
  position: number;
  is_visible: boolean;
  data: Record<string, unknown>;
};

type RecordSpec = {
  /** Plural, as it appears in the console menu. */
  label: string;
  /** Singular, for buttons: "Add an achievement". */
  singular: string;
  /** One line explaining what this list is for. */
  description: string;
  /** Shown when the list is empty. */
  empty: string;
  titleField: string;
  subtitleField?: string;
  thumbField?: string;
  fields: FieldSpec[];
};

export const RECORD_SPECS: Record<RecordKind, RecordSpec> = {
  achievement: {
    label: "Achievements",
    singular: "achievement",
    description:
      "Everything the girls and coaches have won, attended or started. These fill the achievements row on the homepage and the whole Achievements page.",
    empty: "No achievements yet. Each one is a photograph, a date and a sentence.",
    titleField: "caption",
    subtitleField: "date_label",
    thumbField: "media_id",
    fields: [
      { kind: "media", name: "media_id", label: "Photograph" },
      { kind: "text", name: "date_label", label: "Date", placeholder: "18 December 2021", hint: "Written however it should read. Leave empty if the date is not known — better blank than guessed." },
      { kind: "textarea", name: "caption", label: "What happened", rows: 3 },
    ],
  },

  team_member: {
    label: "Team",
    singular: "team member",
    description:
      "The founder, the coaches and everyone who runs the foundation. Order here is the order they appear on the site.",
    empty: "Nobody added yet.",
    titleField: "name",
    subtitleField: "role",
    thumbField: "media_id",
    fields: [
      { kind: "text", name: "name", label: "Name" },
      { kind: "text", name: "role", label: "Role", placeholder: "Founder" },
      { kind: "media", name: "media_id", label: "Photograph" },
      { kind: "textarea", name: "bio", label: "A short biography", rows: 4, hint: "Optional. Nothing was written for anyone on the old site." },
      { kind: "text", name: "facebook", label: "Facebook address", hint: "Full address, or leave empty to hide the icon." },
      { kind: "text", name: "instagram", label: "Instagram address" },
      { kind: "text", name: "linkedin", label: "LinkedIn address" },
    ],
  },

  gallery_photo: {
    label: "Gallery",
    singular: "photograph",
    description: "Photographs for the gallery page and any photo grid on the site.",
    empty: "No photographs yet.",
    titleField: "caption",
    subtitleField: "taken_label",
    thumbField: "media_id",
    fields: [
      { kind: "media", name: "media_id", label: "Photograph" },
      { kind: "text", name: "caption", label: "Caption", hint: "Shown under the photograph. Optional — the old gallery had none." },
      { kind: "text", name: "taken_label", label: "When or where", placeholder: "Vakola, 2023" },
    ],
  },

  impact_stat: {
    label: "Impact numbers",
    singular: "number",
    description:
      "The headline figures — girls trained, years running, coaches developed. Keep them true and keep them current; a stale number is worse than no number.",
    empty:
      "No numbers yet. The old website had none, so every figure here has to come from the foundation rather than from the old site.",
    titleField: "value",
    subtitleField: "label",
    fields: [
      { kind: "text", name: "value", label: "The number", placeholder: "150+" },
      { kind: "text", name: "label", label: "What it counts", placeholder: "girls training every weekend" },
      { kind: "text", name: "note", label: "Small print", hint: "Where the figure comes from, or as-at what date." },
    ],
  },

  dreamer_story: {
    label: "Dreamer stories",
    singular: "story",
    description:
      "Girls from the programme in their own words. Nothing like this existed on the old website, so everything here is new and needs the girl's — and where she is a minor, her guardian's — consent before it goes live.",
    empty: "No stories yet.",
    titleField: "name",
    subtitleField: "quote",
    thumbField: "media_id",
    fields: [
      { kind: "text", name: "name", label: "Name" },
      { kind: "text", name: "age", label: "Age", placeholder: "14" },
      { kind: "text", name: "location", label: "Where she is from", placeholder: "Vakola, Santacruz East" },
      { kind: "textarea", name: "quote", label: "The line to pull out", rows: 3, hint: "One or two sentences. This is what shows on the card." },
      { kind: "textarea", name: "story", label: "Her full statement", rows: 12, hint: "Kept whole, in her own words. Not shown on the card — this is the record." },
      { kind: "media", name: "media_id", label: "Photograph" },
      {
        kind: "select",
        name: "consent",
        label: "Consent on file",
        hint: "A story stays hidden on the site until this says yes, whatever the show/hide switch says.",
        options: [
          { value: "no", label: "No — not yet" },
          { value: "yes", label: "Yes — written consent held" },
        ],
      },
    ],
  },

  partner: {
    label: "Partners",
    singular: "partner",
    description: "Funders, sponsors and partner organisations, shown as a row of logos.",
    empty: "No partners yet. The old website listed none.",
    titleField: "name",
    subtitleField: "url",
    thumbField: "media_id",
    fields: [
      { kind: "text", name: "name", label: "Organisation name" },
      { kind: "media", name: "media_id", label: "Logo" },
      { kind: "text", name: "url", label: "Their website", placeholder: "https://" },
    ],
  },
};

export const RECORD_KINDS = Object.keys(RECORD_SPECS) as RecordKind[];

export function isRecordKind(value: string): value is RecordKind {
  return value in RECORD_SPECS;
}

export function recordDefaults(kind: RecordKind): Record<string, unknown> {
  return defaultsFor(RECORD_SPECS[kind].fields);
}

export function parseRecordData(kind: RecordKind, fd: FormData): Record<string, unknown> {
  const spec = RECORD_SPECS[kind];
  return parseFields(spec.fields, defaultsFor(spec.fields), fd);
}

/** How a row is named in a list, a picker, or a breadcrumb. */
export function recordTitle(kind: RecordKind, data: Record<string, unknown>): string {
  const spec = RECORD_SPECS[kind];
  const raw = s(data, spec.titleField).trim();
  if (!raw) return `Untitled ${spec.singular}`;
  return raw.length > 70 ? `${raw.slice(0, 69)}…` : raw;
}

export function recordSubtitle(kind: RecordKind, data: Record<string, unknown>): string {
  const spec = RECORD_SPECS[kind];
  if (!spec.subtitleField) return "";
  const raw = s(data, spec.subtitleField).trim();
  return raw.length > 90 ? `${raw.slice(0, 89)}…` : raw;
}

export function recordThumb(kind: RecordKind, data: Record<string, unknown>): string | null {
  const field = RECORD_SPECS[kind].thumbField;
  return field ? id(data, field) : null;
}

/**
 * A dreamer story is public only when consent is on file.
 *
 * This is not a UI nicety. These are girls, most of them minors, and the
 * show/hide switch is one click that an editor can hit by accident. Consent is
 * a second, deliberate switch that the site checks independently.
 */
export function isPublishable(kind: RecordKind, data: Record<string, unknown>): boolean {
  if (kind !== "dreamer_story") return true;
  return s(data, "consent") === "yes";
}
