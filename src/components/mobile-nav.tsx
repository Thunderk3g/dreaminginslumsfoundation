"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NavLink } from "@/lib/site-settings";

/**
 * The phone menu.
 *
 * Only the toggle and the panel are client-side; the desktop menu next to it is
 * plain server-rendered markup and is what search engines and no-JS visitors
 * read. This panel is additive, so with JavaScript off the links are still
 * there — the header simply falls back to showing them inline.
 *
 * Closes on navigation, on Escape, and locks the page behind it while open.
 */
export function MobileNav({ links, donate }: { links: NavLink[]; donate: NavLink | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  // A tap on a link should close the panel. On a client-side navigation the
  // component never unmounts, so without this the panel stays over the page
  // you just moved to.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Stop the page scrolling underneath the panel.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="nav-toggle spec"
      >
        {open ? "Close" : "Menu"}
      </button>

      {/* Portalled to <body> on purpose. The masthead carries a
          `backdrop-filter`, and any filter or backdrop-filter makes an element
          the containing block for its fixed-position descendants — so a panel
          rendered inside the header would be clipped to the header's own 60px
          instead of covering the viewport. */}
      {mounted && open
        ? createPortal(
            <div id="mobile-menu" className="nav-panel">
              {/* The toggle in the masthead is behind this panel and cannot be
                  raised above it — it lives inside the header's stacking
                  context. So the panel carries its own way out. */}
              <button type="button" className="nav-close spec" onClick={() => setOpen(false)}>
                Close ✕
              </button>
              <ul>
                {links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link href={link.href} onClick={() => setOpen(false)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {donate ? (
                <Link href={donate.href} className="btn nav-panel-cta" onClick={() => setOpen(false)}>
                  {donate.label} ↗
                </Link>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
