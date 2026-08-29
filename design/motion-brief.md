# Motion & loader brief — Dreaming In Slums Foundation

Paste into Claude Design. Everything below matches the tokens, class names and
JS hooks that already exist in this repository, so the output ports into
`src/app/globals.css` and `src/components/motion.tsx` without translation.

---

## 1 · What this is

A website for **Dreaming In Slums Foundation**, a Mumbai NGO that has been
coaching football to girls aged 6–16 from urban-poor communities since 2017.
Founded by Gulafsha Ansari. The tone is not charity-appeal pity — it is a
**sports poster**: loud, confident, editorial, a little punk. Girls who train,
compete, coach and organise.

The site is Next.js 15 (App Router, React Server Components) with a
database-backed CMS. Every word and photograph is an editable row, so **no
animation may assume a fixed number of items, a fixed string length, or that any
particular image exists.** A section with one card and a section with forty must
both look deliberate.

Build target: **self-contained HTML + CSS + vanilla JS.** No GSAP, no Framer
Motion, no Lottie, no animation library of any kind. CSS-first; JavaScript only
where CSS genuinely cannot do it.

---

## 2 · The design system, exactly

### Colour
```
--brand-paper      #F4EFE4   warm paper ground
--brand-ink        #17092E   near-black violet, all body text
--brand-primary    #3C1A6E   deep purple, photo plates, outlines
--brand-secondary  #6A3AD6   violet, small labels and numerals
--brand-accent     #F5B800   gold — THE accent, used sparingly and loudly
--band-deep        #2A1150   dark band ground (dreamer section)
--band-night       #100522   footer
```
Gold is the only saturated colour. It should feel rationed — a marker pen, not a
wash. If a screen has more than roughly 10% gold, it is wrong.

### Type
- **Anton** — display. Uppercase always, `line-height: .92`, tracking `.01em`.
  Sizes run to `clamp(3.25rem, 9vw, 8.5rem)`.
- **Newsreader** (serif) — body and all italic pull-quotes.
- **IBM Plex Mono** — the "specimen label" register: `11px`, `letter-spacing: .14em`,
  uppercase. Section numbers, coordinates, dates, figure captions.

### Existing visual motifs — reuse these, do not invent new ones
1. **Grain overlay** — fixed fullscreen SVG fractal noise, `opacity: .4`, above everything, `pointer-events: none`.
2. **The sunburst mark** — a 16-ray starburst (8 rays at 45°, 8 more offset 22.5°) around a solid gold circle, with `ASPIRE / TO / INSPIRE` set in mono inside it. Currently rotates `22s linear infinite`. **This is the brand's hero object — the loader should be built from it.**
3. **Photo plates** — every image sits on a `#3C1A6E` plate with `filter: grayscale(1) contrast(1.15); mix-blend-mode: luminosity; opacity: .92`. This is what makes a 2018 phone snapshot and a press photo look like one publication.
4. **Gold marker highlight** — `background: gold` behind a word, `box-decoration-break: clone`.
5. **Outlined display type** — `-webkit-text-stroke: 2px` with `color: transparent`.
6. **Index rows** — full-width link rows that fill gold and slide right `28px` on hover.
7. **Tilted prints** — dreamer cards rotated `-1.2deg`/`1deg`/`-0.8deg`/`1.4deg`, straightening to `0deg` and lifting `-8px` on hover.
8. **Figure captions** — `Fig. 01 — Training ground, Mumbai` / `19°02′N 72°51′E`.

### Existing motion vocabulary — harmonise with it
```
--ease-out: cubic-bezier(.22,.75,.2,1)     /* the ONLY easing on this site */
@keyframes dis-rise     translateY(112%) → 0    /* masked line reveal */
@keyframes dis-spin     rotate(360deg)
@keyframes dis-marquee  translateX(-50%)
@keyframes dis-fade     opacity 0 → 1
```
Reveal-on-scroll: `.85s`, `translateY(44px)`, stagger `80–100ms`.
Nothing bounces. Nothing overshoots. Slow out, settle, stop.

### JS hooks already wired in `src/components/motion.tsx`
Add to these rather than creating a parallel system:
- `[data-reveal]` + `[data-reveal-delay]` — enters on scroll
- `[data-parallax="-0.05"]` — drifts against scroll
- `[data-count]` — figure ticks up from zero
- `[data-timeline]` + `.timeline-fill` — gold spine fills with scroll progress

---

## 3 · THE LOADER

### Rules it must obey
- **First visit only.** Set a `sessionStorage` flag; a returning navigation skips
  it entirely.
- **Hard cap 1800ms**, and it must exit early the moment `document.fonts.ready`
  and the hero image have both resolved. Never wait on the whole page.
- **Never blocks crawlers or no-JS users.** The page HTML underneath is complete;
  the loader is an overlay that removes itself. With JS off, nothing appears.
- **Must not cause layout shift.** It overlays, it does not push.
- **Skippable** — any key, click or scroll dismisses it immediately.
- Respects `prefers-reduced-motion`: reduced users get a 200ms cross-fade, no
  animation.
- Include `aria-hidden` on the visual, and an `aria-live="polite"` "Loading" for
  assistive tech, removed on exit.

### Develop all three concepts, then recommend one

**A · "Kickoff" — build the mark, then kick it away**
Paper ground. The 16 sunburst rays draw themselves outward from the centre one
by one, clockwise, ~40ms apart, in ink. As the last ray lands, the gold ball
drops in from above, compresses slightly on contact, settles. Beat. Then the
whole mark scales up hard and fast past the viewport while a gold curtain wipes
diagonally off-screen, revealing the hero already in position. The hero's own
`dis-rise` headline animation begins as the curtain clears, so the two read as
one continuous move.

**B · "The huddle"**
Six small ink circles enter from the six edges of the screen and converge into a
ring — the pre-match huddle the site already photographs. They lock, rotate as a
unit through 90°, then the ring contracts to a single gold dot and expands into
a full-screen gold flash that fades to reveal the page. Six is not hardcoded:
derive it from the number of team members if available, floor of 4, ceiling of 8.

**C · "Chalk lines"**
On the paper ground, ground markings draw themselves in ink as if chalked: a
halfway line across, then the centre circle sweeping around, then the penalty
spot. A ball appears on the spot. A stroke sweeps through it and the whole
composition slides off in the direction of the kick. Slightly rough, hand-drawn
stroke quality — `stroke-linecap: round`, very subtle `stroke-dasharray` jitter.

For each: give the full SVG, the keyframes, the exit sequence, and the JS that
handles the session flag, the early-exit condition, the skip handler and the
DOM removal. State the total duration and the LCP impact of each.

---

## 4 · The rest of the motion, section by section

These are the real sections. Each one is a CMS block, so the count of children
is always variable.

**Masthead (sticky, `#F4EFE4` at 92% with blur)**
- Nav links: underline wipes in from the left, `420ms`, `transform-origin: left`.
- Logo: the sunburst inside it accelerates its spin briefly on hover, then eases back.
- On scroll past ~80px, the bar tightens: height `5rem → 4rem`, hairline darkens. Transition, not a jump.
- Gold donate button: on hover it inverts to ink-on-gold and the `↗` travels up-right.

**Hero**
- Headline: existing masked `dis-rise` per line, `120ms` apart.
- The gold marker highlight behind the lead word should *paint in* left-to-right (`clip-path` or `scaleX`), `500ms`, starting as that line finishes rising.
- Hero photo plate: reveals under a `clip-path: inset()` wipe from the bottom, `900ms`, while the image itself scales `1.06 → 1` — a slow settle, not a zoom.
- Mono coordinates (`19°02′N 72°51′E`): type in character by character, ~25ms each.
- Slide changes cross-fade `600ms`; the dot indicator width animates `10px → 28px`.

**Marquee ticker**
- Pause on hover, ease back to speed over `600ms`.
- Optional and only if it stays subtle: scroll velocity nudges the marquee speed and direction. Cap it hard — it must never look broken.

**Impact scoreboard (dark band)**
- Each row's top rule draws left-to-right, `600ms`, as the row enters; rows stagger `80ms`.
- Figures use the existing `[data-count]` cubic ease-out over `1400ms`. Upgrade the digits to an **odometer roll** — each digit column slides vertically to its final value, later digits settling last. Must handle suffixes (`150+`) and must fall back to a plain count if the value is not purely numeric.
- The final row's bottom rule draws only after the last figure lands.

**Story blocks**
- The big faint year watermark parallaxes at `-0.04` (already wired).
- Drop cap: fades and scales `.92 → 1` slightly after its paragraph.
- Pull-quote: the gold left bar grows top-to-bottom `500ms`, then the quote fades in.
- Photo plate: on hover, `grayscale(1) → grayscale(.55)` over `700ms` — the photograph warms slightly under attention. Subtle.

**Programme index rows**
- Existing gold fill + `28px` slide. Add: the fill should **wipe from the left** rather than switching, and the row's number flips to ink as the gold passes under it.
- Arrow slides `6px` right and the row's description shifts up `2px`.

**Dreamer prints (dark band, horizontal scroller)**
- Entrance: cards arrive with the existing stagger, each rotating from `0deg` into its resting tilt — so the tilt reads as *settling*, not as a static style.
- Drag to scroll with momentum, and cursor `grab`/`grabbing`.
- Snap indicator dots below, gold for active.
- Hover: existing straighten and lift, plus the shadow softens and spreads.

**Timeline**
- Spine fill already exists. Add: each diamond node **pops** (`scale 0 → 1.25 → 1`, `450ms`) at the moment the fill passes it.
- The year goes from outlined to solid as its node fires.
- The final "Now" row should pulse gently and continuously once reached — one slow breath, `3s`, and only that row.

**Gold CTA band**
- The QR card parallaxes at `-0.05` and tilts a degree or two toward the pointer (`rotateX`/`rotateY`, max 4°, spring-free).
- The main button is magnetic: it translates up to `6px` toward the cursor within a `60px` radius, releasing on exit.

**Gallery grid**
- Masonry entrance, staggered by row, `70ms` apart.
- Lightbox open/close as a **FLIP transition** — the thumbnail grows into the full image from its own position, `500ms`. No fade-from-black.

**Global**
- **Scroll progress**: a 2px gold bar across the very top, tracking document progress.
- **Route transitions**: a gold curtain wipes across on navigation and clears on the new page — the same gesture as the loader's exit, so the site has one signature move.
- **Cursor ring** (fine pointers only): a `28px` gold-outlined ring lerping toward the cursor at `.18`, growing to `52px` with an `18%` gold fill over links. Never on touch.
- **Image arrival**: every photo fades from its purple plate rather than snapping — `@starting-style` with an opacity transition, no `onLoad` handler, no client boundary.

---

## 5 · Hard constraints

1. **Animate `transform` and `opacity` only.** No animating `width`, `height`, `top`, `left`, `margin`, `box-shadow` spread, or `filter` on large surfaces. Every scroll handler is `requestAnimationFrame`-throttled and `{ passive: true }`.
2. **`prefers-reduced-motion: reduce` kills all of it** — durations collapse, transforms are `none`, the loader becomes a 200ms fade, the marquee stops, the cursor ring never mounts. Content must remain fully readable and fully reachable.
3. **No layout shift, ever.** Nothing that animates may affect layout. `[data-reveal]` is applied *by JavaScript* after mount and only to elements below the fold, so server HTML paints complete and visible — preserve that pattern exactly.
4. **Progressive enhancement.** With JavaScript disabled the page is complete, readable and navigable. Nothing is hidden by default in the HTML.
5. **One observer per concern**, disconnected on unmount. No per-element listeners. No memory leaks across client-side navigation.
6. **Accessibility**: focus states are never removed, focus order is untouched, decorative SVG is `aria-hidden`, the scroller is keyboard-reachable, and no animation traps focus or auto-plays anything with sound.
7. **Variable content.** Every effect must survive 1 item, 40 items, a 4-word heading, a 200-word heading, and a missing image.
8. **Budget**: total added JS under 8KB gzipped. State the measured cost.

---

## 6 · Deliverable

- One self-contained HTML file demonstrating the loader (all three concepts,
  switchable) and every section animation against representative content.
- All CSS in a single `<style>` block, organised in the same order as the
  sections above, using the custom-property names given in §2 so it can be
  lifted straight into `globals.css`.
- All JS in a single `<script>`, written so it can become the body of a React
  `useEffect` — no globals, one setup function, one teardown that disconnects
  every observer and removes every listener.
- A short table at the end: each effect, its duration, its easing, its trigger,
  and its reduced-motion fallback.
- Call out anything you think is too much. A poster is loud because it is
  disciplined about *where* it is loud — if two of these effects fight each
  other, say which one to cut.
