import type { Metadata } from "next";
import { PageBlocks } from "@/components/blocks/page-blocks";

export const revalidate = 300;
export const metadata: Metadata = { title: "Programs" };

export default function ProgramsPage() {
  return <PageBlocks pageKey="programs" />;
}
