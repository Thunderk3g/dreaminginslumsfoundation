import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Content console",
  robots: { index: false, follow: false },
};

/**
 * The console is an internal tool, not a public page. It nests inside the app
 * root layout, so it switches off the site chrome that layout renders rather
 * than duplicating a second root layout it does not own.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <style>{"body > header, body > footer { display: none !important; }"}</style>
      {children}
    </div>
  );
}
