import type { Metadata } from "next";
import { PageBlocks } from "@/components/blocks/page-blocks";

export const revalidate = 300;
export const metadata: Metadata = { title: "About us" };

export default function AboutPage() {
  return <PageBlocks pageKey="about" />;
}
