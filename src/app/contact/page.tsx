import type { Metadata } from "next";
import { PageBlocks } from "@/components/blocks/page-blocks";

export const revalidate = 300;
export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return <PageBlocks pageKey="contact" />;
}
