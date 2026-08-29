"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/settings", label: "Site details" },
  { href: "/admin/settings/navigation", label: "Menu" },
  { href: "/admin/settings/brand", label: "Brand colours" },
  { href: "/admin/settings/seo", label: "Search & sharing" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${
            pathname === tab.href
              ? "border-clay bg-clay text-white"
              : "border-rule-strong hover:border-ink hover:bg-paper-deep"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
