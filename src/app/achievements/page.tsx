import type { Metadata } from "next";
import { PageBlocks } from "@/components/blocks/page-blocks";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Achievements" };

export default function AchievementsPage() {
  return <PageBlocks pageKey="achievements" />;
}
