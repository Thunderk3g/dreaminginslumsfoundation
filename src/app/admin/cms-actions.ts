"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/admin-auth";
import { isBlockType, isPageKey, parseBlockData, BLOCK_SPECS } from "@/lib/blocks";
import { isRecordKind, parseRecordData, RECORD_SPECS } from "@/lib/records";
import {
  brandFromForm,
  navFromForm,
  seoFromForm,
  siteFromForm,
} from "@/lib/site-settings";
import * as cms from "@/server/admin-cms";
import { OperatorError, humanError } from "@/server/errors";
import { getBlockForEdit, getItemForEdit, revalidateCms } from "@/server/cms";
import { run, text, flag, isRedirect, recordId } from "./plumbing";
import type { ActionState } from "./ui";

/**
 * Console mutations for everything the site renders.
 *
 * Every one of these ends in the same two calls: `revalidateCms()` drops the
 * tagged reads in src/server/cms.ts, and `revalidatePath("/", "layout")` drops
 * the rendered pages built from them. Without the second, a change lands in the
 * database, the console shows it, and the live site keeps serving the old
 * static HTML for five minutes — which reads to an editor as "the CMS is
 * broken" and is the single most common way a setup like this disappoints.
 */

/** Drops both the cached reads and the pages built from them. */
function publish(extraPaths: string[] = []) {
  revalidateCms();
  revalidatePath("/", "layout");
  for (const path of extraPaths) revalidatePath(path);
}

/* ------------------------------------------------------------------ media -- */

export async function uploadMediaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(["/admin/media"], async () => {
    const file = fd.get("file");
    if (!(file instanceof File)) throw new OperatorError("Choose a file to upload.");
    await cms.uploadMedia(file, text(fd, "alt"));
    publish();
    return "Image added to the library.";
  });
}

/**
 * Called imperatively by the photo picker rather than by submitting a form.
 *
 * A picker lives inside whatever form it is editing, and a form cannot contain
 * another form — so uploading from inside a section or entry editor has to be a
 * direct action call. It returns the new id so the picker can select it without
 * a round trip through the page.
 */
export async function uploadMediaInline(fd: FormData): Promise<{ id?: string; error?: string }> {
  await requireSession();
  try {
    const file = fd.get("file");
    if (!(file instanceof File)) return { error: "Choose a file to upload." };
    const id = await cms.uploadMedia(file, text(fd, "alt"));
    revalidateCms();
    revalidatePath("/admin/media");
    return { id };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { error: humanError(error) };
  }
}

export async function updateMediaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(["/admin/media"], async () => {
    const id = recordId(text(fd, "id"));
    if (!text(fd, "alt")) {
      throw new OperatorError(
        "Every photograph needs a description. It is what someone using a screen reader hears instead of the image."
      );
    }
    await cms.updateMedia(id, text(fd, "alt"), text(fd, "focal_point") || "center");
    publish();
    return "Saved.";
  });
}

export async function deleteMediaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(["/admin/media"], async () => {
    await cms.deleteMedia(recordId(text(fd, "id")));
    publish();
    return "Image deleted.";
  });
}

/* ----------------------------------------------------------------- blocks -- */

export async function createBlockAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireSession();

  const pageKey = text(fd, "page_key");
  const blockType = text(fd, "block_type");

  if (!isPageKey(pageKey)) return { error: "Unknown page." };
  if (!isBlockType(blockType)) return { error: "Unknown section type." };

  let id: string;
  try {
    id = await cms.createBlock(pageKey, blockType);
  } catch (error) {
    return { error: humanError(error) };
  }

  publish();
  // New sections start hidden, so the editor lands on the editor screen and
  // decides when it goes live rather than pushing an empty band onto the site.
  redirect(`/admin/website/${pageKey}/${id}`);
}

export async function saveBlockAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run([], async () => {
    const id = recordId(text(fd, "id"));
    const blockType = text(fd, "block_type");
    if (!isBlockType(blockType)) throw new OperatorError("Unknown section type.");

    const visible = flag(fd, "is_visible");
    await cms.updateBlock(id, parseBlockData(blockType, fd), visible);
    publish();
    return visible
      ? `Saved. ${BLOCK_SPECS[blockType].label} is live on the site.`
      : "Saved as hidden — nobody can see it on the site yet.";
  });
}

export async function deleteBlockAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireSession();
  const pageKey = text(fd, "page_key");
  try {
    await cms.deleteBlock(recordId(text(fd, "id")));
  } catch (error) {
    return { error: humanError(error) };
  }
  publish();
  redirect(`/admin/website/${isPageKey(pageKey) ? pageKey : "home"}`);
}

export async function moveBlockAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run([`/admin/website/${text(fd, "page_key") || "home"}`], async () => {
    const direction = text(fd, "direction") === "up" ? "up" : "down";
    await cms.moveBlock(recordId(text(fd, "id")), direction);
    publish();
    return "Moved.";
  });
}

/** The one-click show/hide on the page list, so nothing needs opening to unpublish. */
export async function toggleBlockAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run([`/admin/website/${text(fd, "page_key") || "home"}`], async () => {
    const id = recordId(text(fd, "id"));
    const block = await getBlockForEdit(id);
    if (!block) throw new OperatorError("That section no longer exists.");
    await cms.updateBlock(id, block.data, !block.is_visible);
    publish();
    return block.is_visible ? "Hidden from the site." : "Now live on the site.";
  });
}

/* ---------------------------------------------------------- content items -- */

export async function createItemAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireSession();

  const kind = text(fd, "kind");
  if (!isRecordKind(kind)) return { error: "Unknown kind of content." };

  let id: string;
  try {
    id = await cms.createItem(kind);
  } catch (error) {
    return { error: humanError(error) };
  }

  publish();
  redirect(`/admin/lists/${kind}/${id}`);
}

export async function saveItemAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run([], async () => {
    const id = recordId(text(fd, "id"));
    const kind = text(fd, "kind");
    if (!isRecordKind(kind)) throw new OperatorError("Unknown kind of content.");

    const data = parseRecordData(kind, fd);
    const visible = flag(fd, "is_visible");

    // Consent is checked here as well as at render time, so an editor who ticks
    // "show on the site" without it gets told why nothing appeared rather than
    // being left to wonder.
    if (kind === "dreamer_story" && visible && data.consent !== "yes") {
      throw new OperatorError(
        "This story stays hidden until consent is on file. Record the consent first, then show it."
      );
    }

    await cms.updateItem(id, data, visible);
    publish();
    return visible
      ? "Saved and live on the site."
      : "Saved as hidden — nobody can see it on the site yet.";
  });
}

export async function deleteItemAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireSession();
  const kind = text(fd, "kind");
  try {
    await cms.deleteItem(recordId(text(fd, "id")));
  } catch (error) {
    return { error: humanError(error) };
  }
  publish();
  redirect(`/admin/lists/${isRecordKind(kind) ? kind : "achievement"}`);
}

export async function moveItemAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run([`/admin/lists/${text(fd, "kind")}`], async () => {
    const direction = text(fd, "direction") === "up" ? "up" : "down";
    await cms.moveItem(recordId(text(fd, "id")), direction);
    publish();
    return "Moved.";
  });
}

export async function toggleItemAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run([`/admin/lists/${text(fd, "kind")}`], async () => {
    const id = recordId(text(fd, "id"));
    const item = await getItemForEdit(id);
    if (!item) throw new OperatorError("That entry no longer exists.");

    const goingLive = !item.is_visible;
    if (goingLive && item.kind === "dreamer_story" && item.data.consent !== "yes") {
      throw new OperatorError(
        `${RECORD_SPECS.dreamer_story.singular} stays hidden until consent is on file. Open it and record the consent first.`
      );
    }

    await cms.updateItem(id, item.data, goingLive);
    publish();
    return goingLive ? "Now live on the site." : "Hidden from the site.";
  });
}

/* --------------------------------------------------------------- settings -- */

export async function saveSiteSettingsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(["/admin/settings"], async () => {
    await cms.saveSetting("site", siteFromForm(fd));
    publish();
    return "Saved. The change is live.";
  });
}

export async function saveBrandAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(["/admin/settings/brand"], async () => {
    await cms.saveSetting("brand", brandFromForm(fd));
    publish();
    return "Saved. Anything that was not a colour like #5B2E91 was left as it was.";
  });
}

export async function saveNavAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(["/admin/settings/navigation"], async () => {
    const nav = navFromForm(fd);
    if (nav.primary.length === 0) {
      throw new OperatorError("Keep at least one link in the main menu.");
    }
    await cms.saveSetting("nav", nav);
    publish();
    return "Menu saved. The change is live.";
  });
}

export async function saveSeoAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(["/admin/settings/seo"], async () => {
    await cms.saveSetting("seo", seoFromForm(fd));
    publish();
    return "Saved.";
  });
}
