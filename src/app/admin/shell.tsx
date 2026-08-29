"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/**
 * The console shell: a fixed left rail, a sticky bar, and the page.
 *
 * The rail is the whole information architecture made visible — nobody should
 * have to remember where something lives. Labels are the words the foundation
 * would use, not the words the schema uses: "Photos", not "Media assets";
 * "Pages & sections", not "Page blocks".
 *
 * Client-side only for two reasons: the active link needs `usePathname`, and
 * the rail slides away on a phone.
 */

export type NavItem = { href: string; label: string; badge?: number };
export type NavGroup = { group: string; items: NavItem[] };

/**
 * Exactly one item in the rail is highlighted: the one whose address is the
 * longest prefix of where you are.
 *
 * A plain prefix test would light up both `/admin/lists` and
 * `/admin/lists/team_member` at once, and an exact test would light up nothing
 * while you edit one entry. Longest-match answers both without special cases.
 */
function bestMatch(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (best === null || href.length > best.length)) best = href;
  }
  return best;
}

export function ConsoleShell({
  nav,
  orgName,
  siteUrl,
  children,
  signOut,
}: {
  nav: NavGroup[];
  orgName: string;
  siteUrl: string;
  children: ReactNode;
  signOut: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // A tap in the rail on a phone should close it; without this the panel stays
  // over the page you just navigated to.
  useEffect(() => setOpen(false), [pathname]);

  const active = bestMatch(
    pathname,
    nav.flatMap((group) => group.items.map((item) => item.href))
  );

  return (
    <div className="min-h-screen bg-paper-deep">
      <a href="#console" className="skip-link">
        Skip to content
      </a>

      {/* Scrim, phone only. */}
      <button
        type="button"
        aria-hidden={!open}
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-ink text-white transition-transform duration-200 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link href="/admin" className="font-mono text-[0.8125rem] tracking-[0.18em]">
            DREAMING IN SLUMS
          </Link>
        </div>

        <a
          href={siteUrl}
          target="_blank"
          rel="noreferrer"
          className="mx-3 mt-3 rounded-sm bg-white/5 px-3 py-2.5 transition-colors hover:bg-white/10"
        >
          <span className="block truncate text-[0.8125rem] font-semibold">{orgName}</span>
          <span className="block truncate text-[0.6875rem] text-white/50">View the live site ↗</span>
        </a>

        <nav aria-label="Console" className="flex-1 overflow-y-auto px-3 pt-2 pb-6">
          {nav.map((group) => (
            <div key={group.group}>
              <p className="px-3 pt-4 pb-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-white/40">
                {group.group}
              </p>
              {group.items.map((item) => {
                const here = item.href === active;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={here ? "page" : undefined}
                    className={`mb-px flex items-center gap-3 rounded-sm px-3 py-2 text-[0.8125rem] font-medium transition-colors ${
                      here ? "bg-clay text-white" : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`ml-auto rounded-full px-1.5 py-px font-mono text-[0.625rem] font-bold ${
                          here ? "bg-white/25" : "bg-white/15"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">{signOut}</div>
      </aside>

      <div className="lg:ml-[248px]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 left-4 z-30 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg lg:hidden"
        >
          Menu
        </button>
        {children}
      </div>
    </div>
  );
}
