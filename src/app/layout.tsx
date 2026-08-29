import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Newsreader, IBM_Plex_Mono } from "next/font/google";
import { getChrome, getSeo, mediaSrc } from "@/server/cms";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Motion } from "@/components/motion";
import "./globals.css";

/**
 * Three typefaces, three jobs: Anton shouts, Newsreader speaks, IBM Plex Mono
 * labels. Self-hosted by next/font, so there is no third-party request on any
 * page and no flash of a fallback face.
 */
const display = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const body = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-body", display: "swap" });
const spec = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-spec",
  display: "swap",
});

/** Even the page title and the favicon come out of the database. */
export async function generateMetadata(): Promise<Metadata> {
  const [seo, chrome] = await Promise.all([getSeo(), getChrome()]);
  const favicon = mediaSrc(chrome.site.favicon_media_id);
  const og = mediaSrc(seo.og_media_id);

  return {
    title: { default: seo.default_title, template: `%s · ${chrome.site.short_name}` },
    description: seo.default_description || undefined,
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
      : undefined,
    openGraph: {
      title: seo.default_title,
      description: seo.default_description || undefined,
      images: og ? [{ url: og }] : undefined,
      siteName: chrome.site.org_name,
      type: "website",
    },
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const chrome = await getChrome();
  const { brand } = chrome;

  // Brand colours reach CSS as custom properties. Every value is run through
  // `readBrand`, which rejects anything that is not a hex literal — without
  // that check this element would be a CSS injection point on every page.
  const palette = `:root{--brand-primary:${brand.color_primary};--brand-secondary:${brand.color_secondary};--brand-accent:${brand.color_accent};--brand-ink:${brand.color_ink};--brand-paper:${brand.color_paper}}`;

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${spec.variable}`}>
      <body>
        <style>{palette}</style>
        <div className="grain" aria-hidden />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader chrome={chrome} />
        <main id="main">{children}</main>
        <SiteFooter chrome={chrome} />
        <Motion />
      </body>
    </html>
  );
}
