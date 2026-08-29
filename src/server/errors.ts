import "server-only";

/**
 * A message written for the person at the keyboard, not for a log.
 *
 * `humanError` passes these through verbatim, which it decides by reading
 * `.name` rather than with `instanceof`: the console and the server modules are
 * separate bundles, and a class identity does not reliably survive that.
 */
export class OperatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperatorError";
  }
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  media_assets_type_allowed: "Only JPEG, PNG and WebP images can be uploaded.",
  media_assets_focal_known: "That is not a focus point this site knows about.",
  page_blocks_page_known: "That page does not exist.",
  page_blocks_type_known: "That section type does not exist.",
  page_blocks_data_is_object: "That section's content was saved in the wrong shape and has been rejected.",
  content_items_kind_known: "That kind of content does not exist.",
  content_items_data_is_object: "That entry was saved in the wrong shape and has been rejected.",
  media_assets_sha256_key: "That exact image is already in the library.",
};

/** Turns whatever was thrown into one sentence an editor can act on. */
export function humanError(error: unknown): string {
  const err = error as {
    name?: string;
    message?: string;
    constraint_name?: string;
    issues?: { message: string }[];
  };

  // Already written for the editor by the module that threw it.
  if (err?.name === "OperatorError" && err.message) return err.message;

  // zod
  if (err?.issues?.length) return err.issues[0].message;

  const constraint = err?.constraint_name;
  if (constraint && CONSTRAINT_MESSAGES[constraint]) return CONSTRAINT_MESSAGES[constraint];
  if (constraint) return `Rejected by the database (${constraint}).`;

  // Never echo a raw Postgres error to the editor; log it for the developer.
  console.error("[cms]", error);
  return "Something went wrong and nothing was saved.";
}
