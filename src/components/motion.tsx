"use client";

import { useEffect } from "react";

/**
 * Every piece of motion on the site, in one mount.
 *
 * Four behaviours, all of them progressive enhancement — the server HTML is
 * complete and correct without any of this, which is why `data-reveal` is set
 * *by* this component rather than rendered:
 *
 *   1. reveal   sections rise in as they enter the viewport
 *   2. count    figures on the scoreboard tick up from zero
 *   3. parallax marked elements drift against the scroll
 *   4. timeline the gold spine fills as the milestones pass
 *
 * Everything bails out under `prefers-reduced-motion`, and everything is
 * disconnected on unmount so a client-side navigation does not leak observers.
 */
export function Motion() {
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return;

    /* -------------------------------------------------------- reveal -- */

    const revealed = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset.revealDelay ?? 0);
          window.setTimeout(() => el.setAttribute("data-reveal", "in"), delay);
          revealed.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
      // Only hide what is genuinely below the fold. Anything already on screen
      // must never be faded out — that is a flash of blank page on load.
      if (el.getBoundingClientRect().top > window.innerHeight * 0.88) {
        el.setAttribute("data-reveal", "out");
        revealed.observe(el);
      } else {
        el.setAttribute("data-reveal", "in");
      }
    }

    /* --------------------------------------------------------- count -- */

    const counted = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const final = el.textContent ?? "";
          // Count only the leading digits, and put back whatever followed them
          // — "150+" ticks to 150 and keeps its plus, "12A" is left alone.
          const match = final.match(/^(\d+)(.*)$/s);
          counted.unobserve(el);
          if (!match) continue;

          const target = Number(match[1]);
          const suffix = match[2];
          const started = performance.now();
          const step = (now: number) => {
            const p = Math.min(1, (now - started) / 1400);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = final;
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );

    for (const el of document.querySelectorAll("[data-count]")) counted.observe(el);

    /* ----------------------------------------------- parallax + spine -- */

    const drifting = [...document.querySelectorAll<HTMLElement>("[data-parallax]")].map((el) => {
      const box = el.getBoundingClientRect();
      return {
        el,
        speed: Number(el.dataset.parallax),
        top: box.top + window.scrollY,
        height: box.height,
      };
    });

    const timeline = document.querySelector<HTMLElement>("[data-timeline]");
    const fill = timeline?.querySelector<HTMLElement>(".timeline-fill") ?? null;

    let frame: number | null = null;
    const onScroll = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;

        for (const item of drifting) {
          const offset =
            (window.scrollY + window.innerHeight / 2 - (item.top + item.height / 2)) * item.speed;
          item.el.style.transform = `translateY(${offset.toFixed(1)}px)`;
        }

        if (timeline && fill) {
          const box = timeline.getBoundingClientRect();
          const progress = Math.min(
            1,
            Math.max(0, (window.innerHeight * 0.6 - box.top) / box.height)
          );
          fill.style.height = `${(progress * 100).toFixed(1)}%`;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      revealed.disconnect();
      counted.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
