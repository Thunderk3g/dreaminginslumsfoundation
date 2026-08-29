import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/admin-auth";
import { humanError, OperatorError } from "@/server/errors";
import type { ActionState } from "./ui";

/**
 * Shared by every Server Action in the console.
 *
 * Deliberately not a "use server" module: a file with that directive may only
 * export async functions, which rules out the small synchronous form readers
 * below. Keeping them here means every action file shares one definition of
 * "what a trimmed field is" and one definition of how a database error becomes
 * a sentence an editor can act on.
 */

export function isRedirect(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/** Re-verify → run → revalidate. Database errors come back as human sentences. */
export async function run(paths: string[], fn: () => Promise<string>): Promise<ActionState> {
  await requireSession(); // outside the try: its redirect must escape uncaught
  try {
    const ok = await fn();
    for (const path of paths) revalidatePath(path);
    return { ok };
  } catch (error) {
    if (isRedirect(error)) throw error;
    return { error: humanError(error) };
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks a record id before it reaches SQL.
 *
 * Postgres raises 22P02 on a malformed uuid, which surfaces as "something went
 * wrong" — true but useless. This says which thing was wrong instead.
 */
export function recordId(value: string): string {
  if (!UUID.test(value)) throw new OperatorError("That record id is not valid.");
  return value;
}

export const text = (fd: FormData, key: string): string => {
  const value = fd.get(key);
  return typeof value === "string" ? value.trim() : "";
};

export const optional = (fd: FormData, key: string): string | null => text(fd, key) || null;

export const flag = (fd: FormData, key: string): boolean => fd.get(key) != null;
