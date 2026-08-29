"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Every piece of motion on the site, in one mount.
 *
 * Structure, deliberately: one setup, one teardown, two IntersectionObservers
 * and a single rAF scroll loop shared by the progress bar, the masthead, the
 * parallax elements and the timeline. Nothing here adds a per-element scroll
 * listener, and nothing survives unmount.
 *
 * All of it is progressive enhancement. The markup carries `data-anim`; this
 * converts the below-the-fold ones to `data-reveal`, which is the attribute the
 * hiding rule keys off. So server HTML paints complete and visible, there is no
 * flash above the fold, and with JavaScript off nothing is hidden at all.
 *
 * Everything bails out under `prefers-reduced-motion` — with the timeline and
 * the scoreboard forced to their finished state rather than left mid-animation.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const cleanup: (() => void)[] = [];
    const on = <K extends keyof WindowEventMap>(
      target: Window | Document | Element,
      type: K,
      fn: (event: WindowEventMap[K]) => void,
      opts?: AddEventListenerOptions
    ) => {
      target.addEventListener(type, fn as EventListener, opts);
      cleanup.push(() => target.removeEventListener(type, fn as EventListener, opts));
    };
    const timers: number[] = [];
    const after = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    cleanup.push(() => timers.forEach(clearTimeout));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ------------------------------------------------ finished-state -- */

    if (reduced) {
      document.querySelectorAll(".tl-row").forEach((r) => r.classList.add("is-on"));
      document.querySelectorAll(".tl-node").forEach((n) => n.classList.add("is-on"));
      document.querySelectorAll<HTMLElement>(".pull-quote").forEach((q) => q.classList.add("is-in"));
      lightbox();
      return () => cleanup.forEach((fn) => fn());
    }

    /* -------------------------------------------------------- reveal -- */

    // Stagger is computed per section, so a four-card row cascades and a
    // forty-item grid does not end up with a four-second tail.
    const groups = new Map<Element, number>();
    for (const el of document.querySelectorAll<HTMLElement>("[data-anim]")) {
      if (el.getBoundingClientRect().top < window.innerHeight) continue;
      const key = el.closest("section, header, footer") ?? el.parentElement;
      if (!key) continue;
      const index = groups.get(key) ?? 0;
      groups.set(key, index + 1);
      const step = el.classList.contains("gal-item") ? 70 : 90;
      el.style.setProperty("--rd", `${Math.min(index, 8) * step}ms`);
      el.setAttribute("data-reveal", "");
    }

    const revealed = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          revealed.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 }
    );
    document.querySelectorAll("[data-reveal], .pull-quote").forEach((el) => revealed.observe(el));
    cleanup.push(() => revealed.disconnect());

    /* ---------------------------------------------------- scoreboard -- */

    /**
     * Digit columns slide to their value, later digits landing last.
     *
     * Capped at four digits: an odometer reads beautifully at two and three and
     * turns to mush at five, so anything longer counts plainly instead. A value
     * that is not a number at all — "Nine", "12A" — is left exactly as typed.
     */
    const roll = (el: HTMLElement) => {
      const raw = (el.dataset.count || el.textContent || "").trim();
      // A count may carry "+" or "%", and nothing else. A trailing letter means
      // the value is a code, not a quantity — this foundation's own figures
      // include "12A", and "80G" is the other registration it will add — and
      // counting those up to 12 and 80 would be nonsense.
      const match = raw.match(/^(\d+)\s*([+%]?)$/);
      if (!match) return;

      const [, digits, suffix] = match;
      if (digits.length > 4) {
        const target = Number(digits);
        const started = performance.now();
        const step = (now: number) => {
          const p = Math.min(1, (now - started) / 1400);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = raw;
        };
        requestAnimationFrame(step);
        return;
      }

      el.textContent = "";
      const wrap = document.createElement("span");
      wrap.className = "odo";
      digits.split("").forEach((digit, i) => {
        const col = document.createElement("span");
        col.className = "odo-col";
        const strip = document.createElement("span");
        strip.className = "odo-strip";
        strip.style.setProperty("--od", `${i * 90}ms`);
        for (let n = 0; n <= 9; n += 1) {
          const s = document.createElement("span");
          s.textContent = String(n);
          strip.appendChild(s);
        }
        col.appendChild(strip);
        wrap.appendChild(col);
        requestAnimationFrame(() => {
          strip.style.transform = `translateY(-${Number(digit) * 10}%)`;
        });
      });
      el.appendChild(wrap);
      if (suffix) {
        const s = document.createElement("span");
        s.textContent = suffix;
        el.appendChild(s);
      }
    };

    const board = document.querySelector<HTMLElement>("[data-board]");
    if (board) {
      const boardSeen = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          boardSeen.disconnect();

          const rules = [...board.querySelectorAll<HTMLElement>("[data-rule]:not([data-last-rule])")];
          rules.forEach((el, i) => el.style.setProperty("--rd", `${i * 80}ms`));
          rules.forEach((el) => el.classList.add("is-in"));

          const figures = [...board.querySelectorAll<HTMLElement>("[data-count]")];
          let lastLand = rules.length * 80;
          figures.forEach((el, i) => {
            const at = 220 + i * 80;
            lastLand = Math.max(lastLand, at + 1400);
            after(at, () => roll(el));
          });

          // The closing rule waits for the last figure so the section finishes
          // rather than trailing off.
          const last = board.querySelector<HTMLElement>("[data-last-rule]");
          if (last) after(lastLand, () => last.classList.add("is-in"));
        },
        { threshold: 0.25 }
      );
      boardSeen.observe(board);
      cleanup.push(() => boardSeen.disconnect());
    }

    /* ------------------------------ one rAF loop for everything scroll -- */

    const progress = document.querySelector<HTMLElement>(".progress");
    const masthead = document.querySelector<HTMLElement>(".masthead");
    const timeline = document.querySelector<HTMLElement>("[data-timeline]");
    const fill = timeline?.querySelector<HTMLElement>(".timeline-fill") ?? null;
    const rows = timeline ? [...timeline.querySelectorAll<HTMLElement>(".tl-row")] : [];
    const drifting = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];

    let queued = false;
    const frame = () => {
      queued = false;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;

      if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (masthead) masthead.classList.toggle("is-tight", y > 80);

      for (const el of drifting) {
        const r = el.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - window.innerHeight / 2) * Number(el.dataset.parallax);
        el.style.transform = `translate3d(0,${offset.toFixed(1)}px,0)`;
      }

      if (timeline && fill) {
        const r = timeline.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (window.innerHeight * 0.72 - r.top) / r.height));
        fill.style.transform = `scaleY(${p})`;
        // A node fires when the fill actually reaches it, so the pops read as
        // caused by the line rather than merely coincident with it.
        for (const row of rows) {
          const node = row.querySelector<HTMLElement>(".tl-node");
          if (!node) continue;
          const nr = node.getBoundingClientRect();
          const passed = nr.top + nr.height / 2 < window.innerHeight * 0.72;
          if (passed && !row.classList.contains("is-on")) {
            row.classList.add("is-on");
            node.classList.add("is-on");
          }
        }
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    };
    on(window, "scroll", onScroll, { passive: true });
    on(window, "resize", onScroll, { passive: true });
    frame();

    /* ----------------------------------------------------- drag scroller -- */

    for (const scroller of document.querySelectorAll<HTMLElement>(".card-scroller")) {
      let down = false;
      let startX = 0;
      let startLeft = 0;

      scroller.addEventListener("pointerdown", (e) => {
        // Let the browser handle touch: native momentum beats anything here.
        if (e.pointerType === "touch") return;
        down = true;
        startX = e.clientX;
        startLeft = scroller.scrollLeft;
        scroller.classList.add("is-drag");
      });
      const end = () => {
        down = false;
        scroller.classList.remove("is-drag");
      };
      scroller.addEventListener("pointermove", (e) => {
        if (!down) return;
        e.preventDefault();
        scroller.scrollLeft = startLeft - (e.clientX - startX);
      });
      scroller.addEventListener("pointerup", end);
      scroller.addEventListener("pointerleave", end);
      cleanup.push(() => {
        scroller.classList.remove("is-drag");
      });
    }

    /* --------------------------------------------------------- QR tilt -- */

    const qr = document.querySelector<HTMLElement>(".qr-tilt");
    if (qr && window.matchMedia("(pointer:fine)").matches) {
      const band = qr.closest("section");
      if (band) {
        on(window, "pointermove", (e) => {
          const r = band.getBoundingClientRect();
          if (e.clientY < r.top || e.clientY > r.bottom) return;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const rx = (-(e.clientY - cy) / r.height) * 8;
          const ry = ((e.clientX - cx) / r.width) * 8;
          qr.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        });
        cleanup.push(() => {
          qr.style.transform = "";
        });
      }
    }

    /* ----------------------------------------------------- cursor ring -- */

    if (window.matchMedia("(pointer:fine)").matches) {
      const ring = document.createElement("div");
      ring.className = "ring";
      ring.setAttribute("aria-hidden", "true");
      // Invisible until the pointer actually moves — otherwise it sits parked
      // in the top-left corner of every fresh page load.
      ring.style.opacity = "0";
      document.body.appendChild(ring);

      let mx = -100;
      let my = -100;
      let x = -100;
      let y = -100;
      let raf = 0;
      let seen = false;

      on(window, "pointermove", (e) => {
        mx = e.clientX;
        my = e.clientY;
        if (!seen) {
          seen = true;
          x = mx;
          y = my;
          ring.style.opacity = "1";
        }
      });
      on(window, "pointerover", (e) => {
        const over = (e.target as Element | null)?.closest?.("a, button");
        ring.classList.toggle("is-big", !!over);
      });

      const loop = () => {
        x += (mx - x) * 0.18;
        y += (my - y) * 0.18;
        ring.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        raf = requestAnimationFrame(loop);
      };
      loop();
      cleanup.push(() => {
        cancelAnimationFrame(raf);
        ring.remove();
      });
    }

    /* -------------------------------------------------- FLIP lightbox -- */

    function lightbox() {
      const items = [...document.querySelectorAll<HTMLElement>(".gal-open")];
      if (!items.length) return;

      const box = document.createElement("button");
      box.className = "lb";
      box.type = "button";
      box.setAttribute("aria-label", "Close image");
      const big = document.createElement("img");
      big.alt = "";
      box.appendChild(big);
      document.body.appendChild(box);

      let opener: HTMLElement | null = null;

      const close = () => {
        box.classList.remove("is-open");
        box.setAttribute("aria-hidden", "true");
        opener?.focus();
        opener = null;
      };

      for (const item of items) {
        item.addEventListener("click", () => {
          const source = item.querySelector("img");
          if (!source) return;
          opener = item;
          big.src = source.currentSrc || source.src;
          big.alt = source.alt;
          box.classList.add("is-open");
          box.removeAttribute("aria-hidden");
          box.focus();

          if (reduced) return;
          // FLIP: measure the thumbnail, start the big image transformed onto
          // it, then release. The image appears to grow out of the grid.
          const from = source.getBoundingClientRect();
          requestAnimationFrame(() => {
            const to = big.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const scale = from.width / to.width;
            big.style.transition = "none";
            big.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
            requestAnimationFrame(() => {
              big.style.transition = "transform .5s var(--ease-out)";
              big.style.transform = "none";
            });
          });
        });
      }

      box.addEventListener("click", close);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") close();
      };
      document.addEventListener("keydown", onKey);
      cleanup.push(() => {
        document.removeEventListener("keydown", onKey);
        box.remove();
      });
    }
    lightbox();

    return () => cleanup.forEach((fn) => fn());
    // Re-runs on navigation: a new page has new nodes to observe.
  }, [pathname]);

  return null;
}

/**
 * The gold curtain that wipes across on a route change.
 *
 * Separate from `Motion` because it keys off the pathname *changing* rather
 * than the page mounting, and it must not fire on first paint.
 */
export function RouteCurtain() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const curtain = document.querySelector<HTMLElement>(".route-curtain");
    if (!curtain) return;
    curtain.classList.remove("is-wiping");
    // Force a reflow so re-adding the class restarts the animation.
    void curtain.offsetWidth;
    curtain.classList.add("is-wiping");
    const id = window.setTimeout(() => curtain.classList.remove("is-wiping"), 900);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
