import { PageBlocks } from "@/components/blocks/page-blocks";

/**
 * Every public page in this app is the same four lines: the page is whatever
 * the console says it is. Adding, removing or reordering a section never
 * touches a file here.
 */
export const revalidate = 300;

export default function HomePage() {
  return <PageBlocks pageKey="home" />;
}
