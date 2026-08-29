import type { Metadata } from "next";
import { PageBlocks } from "@/components/blocks/page-blocks";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Get involved" };

export default function GetInvolvedPage() {
  return <PageBlocks pageKey="get-involved" />;
}
