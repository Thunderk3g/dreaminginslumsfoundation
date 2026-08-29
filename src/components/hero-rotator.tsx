"use client";

import { useEffect, useState } from "react";

/**
 * Rotates the hero between its slides, and draws the dots that jump between
 * them.
 *
 * The old site ran a three-slide carousel and all three headlines are real
 * copy, so they cannot simply be dropped. Rather than pull in a carousel
 * library: the hero renders every slide in the server HTML, and this hides all
 * but one on mount. Without JavaScript every slide is simply visible, stacked,
 * which is a worse-looking but entirely readable page — the right failure.
 *
 * A single slide renders nothing here and hides nothing.
 */
export function HeroDots({ count }: { count: number }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (count < 2) return;
    document.querySelectorAll<HTMLElement>("[data-hero-slide]").forEach((slide, i) => {
      slide.hidden = i !== active;
    });
  }, [active, count]);

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % count), 6500);
    return () => window.clearInterval(id);
  }, [count]);

  if (count < 2) return null;

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.75rem" }}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Show slide ${i + 1} of ${count}`}
          aria-current={i === active}
          onClick={() => setActive(i)}
          style={{
            width: i === active ? 28 : 10,
            height: 10,
            border: "1px solid var(--brand-ink)",
            background: i === active ? "var(--brand-accent)" : "transparent",
            cursor: "pointer",
            transition: "width .3s, background .3s",
            padding: 0,
          }}
        />
      ))}
    </div>
  );
}
