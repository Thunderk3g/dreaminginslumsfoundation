import { PageBlocks } from "@/components/blocks/page-blocks";

/**
 * Every public page in this app is the same four lines: the page is whatever
 * the console says it is. Adding, removing or reordering a section never
 * touches a file here.
 *
 * An hour, not five minutes. This timer is only a safety net — saving in the
 * console calls `revalidatePath("/", "layout")`, so an edit is live at once
 * either way. Its real cost is background database traffic, and the database
 * is behind a session pooler with fifteen connections for the whole project.
 * At five minutes, seven pages revalidating against a handful of visitors was
 * enough to exhaust it.
 */
export const revalidate = 3600;

export default function HomePage() {
  return <PageBlocks pageKey="home" />;
}
