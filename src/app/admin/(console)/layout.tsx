import type { ReactNode } from "react";
import { requireSession } from "@/lib/admin-auth";
import { RECORD_KINDS, RECORD_SPECS } from "@/lib/records";
import { getChrome } from "@/server/cms";
import { logoutAction } from "../actions";
import { ConsoleShell, type NavGroup } from "../shell";

/**
 * Everything under this group is behind the session. Middleware already turned
 * away requests with no cookie; this verifies the signature, which middleware
 * cannot do on the Edge runtime.
 *
 * The rail is grouped by the job being done — "The website", "Content",
 * "Settings" — because the person using this wants to change something on a
 * page, not visit a table.
 */
export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  await requireSession();

  const chrome = await getChrome();

  const nav: NavGroup[] = [
    {
      group: "Today",
      items: [{ href: "/admin", label: "Overview" }],
    },
    {
      group: "The website",
      items: [
        { href: "/admin/website", label: "Pages & sections" },
        { href: "/admin/media", label: "Photos" },
      ],
    },
    {
      group: "Content",
      items: RECORD_KINDS.map((kind) => ({
        href: `/admin/lists/${kind}`,
        label: RECORD_SPECS[kind].label,
      })),
    },
    {
      group: "Settings",
      items: [
        { href: "/admin/settings", label: "Site details" },
        { href: "/admin/settings/navigation", label: "Menu" },
        { href: "/admin/settings/brand", label: "Brand colours" },
        { href: "/admin/settings/seo", label: "Search & sharing" },
      ],
    },
  ];

  return (
    <ConsoleShell
      nav={nav}
      orgName={chrome.site.org_name}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "/"}
      signOut={
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-sm border border-white/15 px-3 py-2 text-left text-[0.8125rem] text-white/70 transition-colors hover:border-white/40 hover:text-white"
          >
            Sign out
          </button>
        </form>
      }
    >
      {/* No top padding: `PageHeader` is the sticky bar and paints its own. */}
      <main id="console" className="px-5 pb-20 lg:px-8">
        {children}
      </main>
    </ConsoleShell>
  );
}
