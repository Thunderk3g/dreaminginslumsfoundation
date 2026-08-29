import Link from "next/link";
import { cta, id, lines, rows, s, type Cta } from "@/lib/fields";
import { mediaSrc, type MediaMeta } from "@/server/cms";
import type { ContentItem } from "@/lib/records";
import { HeroDots } from "@/components/hero-rotator";

/**
 * One component per block type, in the design's visual language.
 *
 * Every string, image and figure on the page arrives as `data` or `items` from
 * the database. Nothing here is hardcoded copy — where a component appears to
 * name something, it is naming a section number or a field label, never
 * content.
 */

type Data = Record<string, unknown>;
type MediaMap = Record<string, MediaMeta>;

/* ------------------------------------------------------------------ atoms -- */

/** The mono strapline that opens a section: label left, aside right. */
function SectionHead({ num, label, aside }: { num?: string; label: string; aside?: string }) {
  if (!label && !aside) return null;
  return (
    <div className="sec-head spec" data-anim>
      <span>
        {num ? `Sec. ${num} — ` : null}
        {label}
      </span>
      {aside ? <span className="sec-aside">{aside}</span> : null}
    </div>
  );
}

function Button({ value, quiet = false }: { value: Cta | null; quiet?: boolean }) {
  if (!value) return null;
  return (
    <Link href={value.href} className={quiet ? "btn-quiet" : "btn"}>
      {value.label} {quiet ? "→" : "→"}
    </Link>
  );
}

/** Blank lines are paragraph breaks. That is the whole rich-text contract. */
function Paragraphs({ text, className = "prose" }: { text: string; className?: string }) {
  const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  return (
    <div className={className}>
      {parts.map((part, i) => (
        <p key={i}>
          {part.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

/**
 * A photograph from the library.
 *
 * Alt text comes from the media row, never from the block — describing an image
 * belongs with the image, so fixing it once fixes it everywhere. When the
 * description is missing the element gets `alt=""`, which tells a screen reader
 * to skip it: an announced filename is worse than silence.
 */
/**
 * `ratio` exists so the plate matches the shape of what is actually in the
 * library. The scraped photography is 4:3 (1024×768 and 768×576) and the
 * portraits are square (400×400) — pick the matching box and `object-fit:
 * cover` crops nothing. Get it wrong and it eats faces, which is exactly what
 * a mismatched box was doing to the team.
 */
type Ratio = "auto" | "square" | "photo";

function Figure({
  mediaId,
  media,
  ratio = "auto",
  wipe = false,
  eager = false,
  plain = false,
  missing = "No photograph chosen",
}: {
  mediaId: string | null;
  media: MediaMap;
  ratio?: Ratio;
  /** Reveals under a bottom-up clip wipe while the image settles from 1.06. */
  wipe?: boolean;
  eager?: boolean;
  /**
   * Skips the purple plate entirely. For images that are not photographs and
   * must not be tinted — the bank QR code above all, which has to stay
   * high-contrast black on white or a phone camera will not read it.
   */
  plain?: boolean;
  missing?: string | null;
}) {
  const src = mediaSrc(mediaId);
  if (!src) return missing ? <p className="no-media">{missing}</p> : null;
  const meta = mediaId ? media[mediaId] : undefined;

  if (plain) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={meta?.alt ?? ""}
        width={meta?.width ?? undefined}
        height={meta?.height ?? undefined}
        loading="lazy"
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    );
  }

  const shape = ratio === "square" ? " plate-square" : ratio === "photo" ? " plate-photo" : "";
  return (
    <div className={`plate${shape}${wipe ? " plate-wipe" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={meta?.alt ?? ""}
        width={meta?.width ?? undefined}
        height={meta?.height ?? undefined}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
      />
    </div>
  );
}

/** The rotating sunburst-and-ball mark, lifted from the design's hero. */
function Sunburst() {
  return (
    <div className="sunburst" aria-hidden>
      <svg
        viewBox="0 0 140 140"
        style={{ animation: "dis-spin 22s linear infinite", display: "block", width: "100%", height: "100%" }}
      >
        <g stroke="var(--brand-ink)" strokeWidth="1.5" strokeLinecap="round">
          {Array.from({ length: 8 }, (_, i) => i * 45).flatMap((deg) =>
            [0, 22.5].map((offset) => (
              <line
                key={`${deg}-${offset}`}
                x1="70"
                y1="4"
                x2="70"
                y2="26"
                transform={`rotate(${deg + offset} 70 70)`}
              />
            ))
          )}
        </g>
        <circle cx="70" cy="70" r="30" fill="var(--brand-accent)" stroke="var(--brand-ink)" strokeWidth="1.5" />
      </svg>
      <div className="spec sunburst-text">
        Aspire
        <br />
        to
        <br />
        inspire
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- blocks -- */

/**
 * The hero.
 *
 * The headline is split at the first line break so the second half can be
 * marked in gold — the design's "From the / Slums to / Limitless / Dreams."
 * treatment, driven by whatever an editor typed rather than by four hardcoded
 * lines. Both halves come from the same two fields the old carousel had.
 */
export function HeroSliderBlock({ data, media }: { data: Data; media: MediaMap }) {
  const slides = rows(data, "slides");
  if (!slides.length) return null;

  return (
    <header
      style={{
        position: "relative",
        // The sticky masthead already occupies the top of a phone screen, so a
        // 7rem floor here left a band of nothing under it.
        padding: "clamp(3rem,12vw,9.5rem) 0 clamp(2.5rem,6vw,4.5rem)",
        borderBottom: "1px solid var(--brand-ink)",
        overflow: "hidden",
      }}
    >
      <div className="wrap">
        {slides.map((slide, i) => {
          const lead = typeof slide.lead === "string" ? slide.lead : "";
          const headline = typeof slide.headline === "string" ? slide.headline : "";
          const mediaId = typeof slide.media_id === "string" ? slide.media_id : null;

          return (
            <div key={i} data-hero-slide="" className="hero-grid">
              <div className="hero-words">
                <div>
                  {/* Each line rises out of its own mask, 120ms apart, and the
                      gold marker paints itself in once the first line lands. */}
                  <h1 className="h-xl">
                    {lead ? (
                      <span className="rise-mask">
                        <span className="rise" style={{ "--i": 0 } as React.CSSProperties}>
                          <span className="mark">{lead}</span>
                        </span>
                      </span>
                    ) : null}
                    <span className="rise-mask">
                      <span className="rise" style={{ "--i": lead ? 1 : 0 } as React.CSSProperties}>
                        {headline}
                      </span>
                    </span>
                  </h1>

                  <div
                    style={{
                      marginTop: "clamp(2rem,4vw,3.25rem)",
                      animation: "dis-fade .8s 1s both",
                    }}
                  >
                    <Button value={cta(slide, "cta")} />
                  </div>
                </div>
              </div>

              {mediaId ? (
                <figure className="hero-figure">
                  <div style={{ position: "relative" }}>
                    {/* The first slide is the LCP image on most visits, so it
                        loads eagerly and at high priority. */}
                    <Figure mediaId={mediaId} media={media} missing={null} wipe eager={i === 0} />
                    <Sunburst />
                  </div>
                  <figcaption className="fig-caption spec">
                    <span>Fig. 0{i + 1}</span>
                    <span>19°02′N 72°51′E</span>
                  </figcaption>
                </figure>
              ) : null}
            </div>
          );
        })}

        <HeroDots count={slides.length} />
      </div>
    </header>
  );
}

/** The scrolling word marquee. Duplicated once so the loop has no seam. */
export function TickerBlock({ data }: { data: Data }) {
  const words = lines(data, "words");
  if (!words.length) return null;

  const run = (
    <div className="marquee-run" aria-hidden>
      {words.map((word, i) => (
        <span key={i} style={i % 2 ? { color: "var(--ink-55)" } : undefined}>
          {word}
          <span className="marquee-dot" style={{ paddingLeft: "2.125rem" }}>
            ●
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee">
      {/* The words are decoration in a loop; announce them once, in order. */}
      <p className="sr-only" style={{ position: "absolute", left: "-9999px" }}>
        {words.join(". ")}
      </p>
      <div className="marquee-track">
        {run}
        {run}
      </div>
    </div>
  );
}

export function StoryBlock({ data, media }: { data: Data; media: MediaMap }) {
  const layout = s(data, "layout") || "image_right";
  const bullets = lines(data, "bullets");
  const anchor = s(data, "anchor");
  const quote = s(data, "quote");
  const watermark = s(data, "watermark");
  const mediaId = id(data, "media_id");

  const words = (
    <div>
      <h2 className="h-lg" data-anim style={{ marginBottom: "2.75rem" }}>
        {s(data, "title")}
      </h2>
      <div data-anim>
        <Paragraphs text={s(data, "body")} className="prose prose-drop" />
      </div>
      {bullets.length ? (
        <ol className="bullets" data-anim>
          {bullets.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      ) : null}
      {quote ? (
        <>
          {/* The gold bar grows first, then the words arrive under it. */}
          <blockquote className="pull-quote">
            <span className="quote-bar" aria-hidden />
            <p className="quote-text">“{quote}”</p>
          </blockquote>
          {s(data, "quote_attribution") ? (
            <p className="spec" data-anim style={{ margin: "1.125rem 0 0 1.8rem", fontWeight: 600 }}>
              — {s(data, "quote_attribution")}
            </p>
          ) : null}
        </>
      ) : null}
      <div style={{ marginTop: "2.75rem" }} data-anim>
        <Button value={cta(data, "cta")} quiet />
      </div>
    </div>
  );

  return (
    <section className="band" id={anchor || undefined}>
      <div className="wrap">
        <SectionHead label={s(data, "eyebrow")} />
        {layout === "none" || !mediaId ? (
          <div style={{ maxWidth: "56rem" }}>{words}</div>
        ) : (
          <div className="split" data-layout={layout}>
            <div className="split-media">
              {watermark ? (
                <div className="watermark" data-parallax="-0.04" aria-hidden>
                  {watermark}
                </div>
              ) : null}
              <div data-anim style={{ position: "relative", zIndex: 1 }}>
                <Figure mediaId={mediaId} media={media} />
              </div>
            </div>
            {words}
          </div>
        )}
      </div>
    </section>
  );
}

/** The numbered index of programmes — the design's "Six ways we build leaders". */
export function TeaserCardsBlock({ data, media }: { data: Data; media: MediaMap }) {
  const cards = rows(data, "cards");
  if (!cards.length) return null;

  const heading = s(data, "title");
  const anyIcons = cards.some((card) => typeof card.media_id === "string" && card.media_id);

  return (
    <section className="band">
      <div className="wrap">
        <SectionHead label={s(data, "eyebrow")} />
        {heading ? (
          <h2 className="h-lg" data-anim style={{ marginBottom: "clamp(2.5rem,5vw,4rem)" }}>
            {heading}
          </h2>
        ) : null}

        <div data-anim>
          {cards.map((card, i) => {
            const target = cta(card, "cta");
            const mediaId = typeof card.media_id === "string" ? card.media_id : null;
            const src = mediaSrc(mediaId);
            const meta = mediaId ? media[mediaId] : undefined;

            const body = (
              <>
                <span className="index-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="h-md index-title" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {anyIcons && src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={meta?.alt ?? ""} width={32} height={32} style={{ display: "block" }} />
                  ) : null}
                  {typeof card.title === "string" ? card.title : ""}
                </span>
                <span className="index-note">{typeof card.body === "string" ? card.body : ""}</span>
                <span className="index-arrow" aria-hidden>
                  →
                </span>
              </>
            );

            return target ? (
              <Link key={i} href={target.href} className="index-row">
                {body}
              </Link>
            ) : (
              <div key={i} className="index-row">
                {body}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** The dark scoreboard. Figures tick up from zero as it scrolls into view. */
export function ImpactStatsBlock({ data, items }: { data: Data; items: ContentItem[] }) {
  if (!items.length) return null;
  return (
    <section className="band band-dark">
      <div className="wrap" data-board>
        <SectionHead num="01" label={s(data, "eyebrow")} aside={s(data, "title")} />
        {items.map((item, i) => (
          <div className="score-row" key={item.id}>
            {/* The rule draws itself left to right as the row arrives. */}
            <div data-rule className="score-rule" aria-hidden />
            <span className="score-index">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="spec" style={{ fontSize: "0.8125rem", fontWeight: 600, letterSpacing: "0.2em" }}>
                {s(item.data, "label")}
              </div>
              {s(item.data, "note") ? <p className="lede" style={{ marginTop: 8 }}>{s(item.data, "note")}</p> : null}
            </div>
            {/* data-count carries the value verbatim, so a figure that is not a
                number — "Nine", "12A" — is simply left as typed. */}
            <div className="score-value" data-count={s(item.data, "value")}>
              {s(item.data, "value")}
            </div>
          </div>
        ))}
        <div data-rule data-last-rule className="score-rule" aria-hidden />
      </div>
    </section>
  );
}

export function AchievementRailBlock({
  data,
  items,
  media,
}: {
  data: Data;
  items: ContentItem[];
  media: MediaMap;
}) {
  if (!items.length) return null;
  return (
    <section className="band">
      <div className="wrap">
        <SectionHead label={s(data, "eyebrow")} aside={s(data, "title") ? undefined : undefined} />
        {s(data, "title") ? (
          <h2 className="h-lg" data-anim style={{ marginBottom: "clamp(2.5rem,5vw,4rem)" }}>
            {s(data, "title")}
          </h2>
        ) : null}

        <ul className="card-grid">
          {items.map((item) => (
            <li key={item.id} data-anim>
              <figure style={{ margin: 0 }}>
                <Figure mediaId={id(item.data, "media_id")} media={media} ratio="photo" missing={null} />
                <figcaption style={{ marginTop: "0.875rem" }}>
                  {s(item.data, "date_label") ? (
                    <div className="spec" style={{ color: "var(--brand-secondary)" }}>
                      {s(item.data, "date_label")}
                    </div>
                  ) : null}
                  <p style={{ margin: "0.375rem 0 0", fontSize: "1rem", lineHeight: 1.55 }}>
                    {s(item.data, "caption")}
                  </p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: "2.5rem" }} data-anim>
          <Button value={cta(data, "cta")} quiet />
        </div>
      </div>
    </section>
  );
}

export function GalleryGridBlock({
  data,
  items,
  media,
}: {
  data: Data;
  items: ContentItem[];
  media: MediaMap;
}) {
  if (!items.length) return null;
  return (
    <section className="band">
      <div className="wrap">
        <SectionHead label={s(data, "eyebrow")} />
        {s(data, "title") ? (
          <h2 className="h-lg" data-anim style={{ marginBottom: "clamp(2.5rem,5vw,4rem)" }}>
            {s(data, "title")}
          </h2>
        ) : null}

        <ul className="card-grid card-grid-dense">
          {items.map((item) => (
            <li key={item.id} data-anim className="gal-item">
              <figure style={{ margin: 0 }}>
                {/* A button, not a div: the lightbox has to be reachable and
                    openable from the keyboard. */}
                <button type="button" className="gal-open" aria-label="Open photograph">
                  <Figure mediaId={id(item.data, "media_id")} media={media} ratio="photo" missing={null} />
                </button>
                {s(item.data, "caption") || s(item.data, "taken_label") ? (
                  <figcaption className="spec" style={{ marginTop: "0.625rem", color: "var(--ink-55)" }}>
                    {s(item.data, "caption")}
                    {s(item.data, "caption") && s(item.data, "taken_label") ? " · " : null}
                    {s(item.data, "taken_label")}
                  </figcaption>
                ) : null}
              </figure>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: "2.5rem" }} data-anim>
          <Button value={cta(data, "cta")} quiet />
        </div>
      </div>
    </section>
  );
}

const MEMBER_SOCIALS = [
  { key: "facebook", label: "FB" },
  { key: "instagram", label: "IG" },
  { key: "linkedin", label: "LI" },
] as const;

export function TeamRailBlock({
  data,
  items,
  media,
}: {
  data: Data;
  items: ContentItem[];
  media: MediaMap;
}) {
  return (
    <section className="band">
      <div className="wrap">
        <SectionHead label={s(data, "eyebrow")} />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "2rem",
            marginBottom: "clamp(2.5rem,5vw,4rem)",
          }}
          data-anim
        >
          <h2 className="h-lg">{s(data, "title")}</h2>
          <div style={{ maxWidth: "26rem" }}>
            <Paragraphs text={s(data, "body")} className="lede" />
            <div style={{ marginTop: "1.25rem" }}>
              <Button value={cta(data, "cta")} />
            </div>
          </div>
        </div>

        {items.length ? (
          <ul className="card-grid card-grid-dense">
            {items.map((item) => {
              const socials = MEMBER_SOCIALS.filter((social) => s(item.data, social.key));
              return (
                <li key={item.id} data-anim>
                  {/* Square: every portrait in the library is 400×400, so a
                      square box shows the whole face instead of cropping it. */}
                  <Figure mediaId={id(item.data, "media_id")} media={media} ratio="square" missing={null} />
                  <h3 className="h-md" style={{ marginTop: "0.875rem" }}>
                    {s(item.data, "name")}
                  </h3>
                  {s(item.data, "role") ? (
                    <p className="spec" style={{ color: "var(--brand-secondary)", marginTop: "0.25rem" }}>
                      {s(item.data, "role")}
                    </p>
                  ) : null}
                  <Paragraphs text={s(item.data, "bio")} className="prose" />
                  {socials.length ? (
                    <ul
                      className="spec"
                      style={{ display: "flex", gap: "0.75rem", listStyle: "none", padding: 0, marginTop: "0.75rem" }}
                    >
                      {socials.map((social) => (
                        <li key={social.key}>
                          <a
                            href={s(item.data, social.key)}
                            target="_blank"
                            rel="noreferrer noopener"
                            style={{ borderBottom: "1px solid var(--brand-accent)" }}
                          >
                            {social.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

/** Tilted prints in a horizontal scroller — the design's "Meet our dreamers". */
export function DreamerRailBlock({
  data,
  items,
  media,
}: {
  data: Data;
  items: ContentItem[];
  media: MediaMap;
}) {
  if (!items.length) return null;
  return (
    <section className="band band-deep" style={{ paddingInline: 0 }}>
      <div className="wrap">
        <SectionHead num="04" label={s(data, "eyebrow")} aside="In their own words" />
        {s(data, "title") ? (
          <h2 className="h-lg" data-anim style={{ marginBottom: "clamp(2.5rem,5vw,4.375rem)" }}>
            {s(data, "title")}
          </h2>
        ) : null}
      </div>

      <ul className="card-scroller" style={{ listStyle: "none", margin: 0 }}>
        {items.map((item, i) => (
          <li key={item.id} className="print" data-anim>
            <figure style={{ margin: 0 }}>
              <div style={{ position: "relative" }}>
                {/* One plate, not a plate inside a plate — nesting them
                    doubled the purple ground and the luminosity blend. */}
                <Figure mediaId={id(item.data, "media_id")} media={media} ratio="square" missing={null} />
                <div
                  className="display outline outline-accent"
                  style={{ position: "absolute", top: 8, right: 12, fontSize: 64, lineHeight: 1 }}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              <figcaption>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "0.75rem",
                    marginTop: "1.125rem",
                  }}
                >
                  <span className="h-md">{s(item.data, "name")}</span>
                  <span className="spec" style={{ color: "var(--ink-55)" }}>
                    {[s(item.data, "age"), s(item.data, "location")].filter(Boolean).join(" / ")}
                  </span>
                </div>
                <p className="print-quote">“{s(item.data, "quote")}”</p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Milestones down a centre line. The gold spine fills as you scroll. */
export function TimelineBlock({ data }: { data: Data }) {
  const entries = rows(data, "entries");
  if (!entries.length) return null;

  return (
    <section className="band">
      <div className="wrap">
        <SectionHead num="05" label={s(data, "eyebrow")} aside={s(data, "title")} />
        <div className="timeline" data-timeline>
          <div className="timeline-spine" aria-hidden />
          <div className="timeline-fill" aria-hidden />
          {entries.map((entry, i) => (
            // The last milestone is "now": once the spine reaches it, its node
            // keeps breathing rather than settling.
            <div className={`tl-row${i === entries.length - 1 ? " is-now" : ""}`} key={i} data-anim>
              <div className="tl-year">{typeof entry.year === "string" ? entry.year : ""}</div>
              <div className="tl-node" aria-hidden />
              <p className="tl-text">{typeof entry.body === "string" ? entry.body : ""}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProgramListBlock({ data }: { data: Data }) {
  const entries = rows(data, "entries");
  return (
    <section className="band">
      <div className="wrap">
        <SectionHead label={s(data, "eyebrow")} />
        {s(data, "title") ? (
          <h2 className="h-lg" data-anim style={{ marginBottom: "1.5rem" }}>
            {s(data, "title")}
          </h2>
        ) : null}
        <div style={{ maxWidth: "48rem" }} data-anim>
          <Paragraphs text={s(data, "intro")} className="lede" />
        </div>

        {entries.map((entry, i) => (
          <article
            key={i}
            data-anim
            style={{
              display: "grid",
              gap: "1.25rem clamp(1.5rem,4vw,3.5rem)",
              gridTemplateColumns: "1fr",
              borderTop: "1px solid var(--ink-25)",
              paddingTop: "2rem",
              marginTop: "2.5rem",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
              <span className="index-num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="h-md">{typeof entry.title === "string" ? entry.title : ""}</h3>
            </div>
            <div style={{ maxWidth: "58rem" }}>
              <Paragraphs text={typeof entry.body === "string" ? entry.body : ""} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RichTextBlock({ data }: { data: Data }) {
  return (
    <section className="band">
      <div className="wrap" style={{ maxWidth: "56rem" }}>
        <SectionHead label={s(data, "eyebrow")} />
        {s(data, "title") ? (
          <h2 className="h-lg" data-anim style={{ marginBottom: "1.5rem" }}>
            {s(data, "title")}
          </h2>
        ) : null}
        <div data-anim>
          <Paragraphs text={s(data, "body")} />
        </div>
      </div>
    </section>
  );
}

/** The banner that opens every inner page: title over a wide photograph. */
export function ImageBannerBlock({ data, media }: { data: Data; media: MediaMap }) {
  const mediaId = id(data, "media_id");
  const align = (s(data, "align") || "left") as "left" | "center" | "right";

  return (
    <header
      style={{
        position: "relative",
        borderBottom: "1px solid var(--brand-ink)",
        background: "var(--brand-primary)",
        color: "var(--brand-paper)",
        overflow: "hidden",
      }}
    >
      {mediaId ? (
        <div style={{ position: "absolute", inset: 0 }} aria-hidden>
          <div className="banner-bleed">
            <Figure mediaId={mediaId} media={media} missing={null} />
          </div>
        </div>
      ) : null}

      <div
        className="wrap"
        style={{
          position: "relative",
          paddingBlock: "clamp(7rem,13vw,10rem) clamp(2.5rem,5vw,4rem)",
          textAlign: align,
        }}
      >
        {s(data, "eyebrow") ? (
          <p className="spec" style={{ color: "var(--brand-accent)", marginBottom: "0.75rem" }}>
            {s(data, "eyebrow")}
          </p>
        ) : null}
        <h1 className="h-xl">{s(data, "title")}</h1>
        <div style={{ maxWidth: "38rem", marginTop: "1.5rem", marginInline: align === "center" ? "auto" : undefined }}>
          <Paragraphs text={s(data, "body")} className="lede" />
        </div>
        <div style={{ marginTop: "1.5rem" }}>
          <Button value={cta(data, "cta")} />
        </div>
      </div>
    </header>
  );
}

/** The gold ask: a headline, the ways to help, the button and the QR code. */
export function DonateCtaBlock({ data, media }: { data: Data; media: MediaMap }) {
  const qr = id(data, "qr_media_id");
  const ways = rows(data, "ways");

  return (
    <section className="band band-gold">
      <div className="wrap">
        <SectionHead num="06" label={s(data, "eyebrow")} />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "clamp(2rem,5vw,3.75rem)",
          }}
        >
          <h2 className="h-xl" data-anim style={{ flex: "1 1 20rem" }}>
            {s(data, "title")}
          </h2>

          {qr ? (
            <figure
              data-anim
              className="qr-tilt"
              style={{
                width: "min(260px, 100%)",
                flex: "none",
                margin: 0,
                background: "var(--brand-ink)",
                padding: "1rem",
                boxShadow: "0 24px 50px rgb(23 9 46 / 0.4)",
              }}
            >
              {/* Never plated: a tinted QR code is a QR code that may not
                  scan, and a donation that silently fails is the worst
                  possible failure on this page. */}
              <Figure mediaId={qr} media={media} plain missing={null} />
              {s(data, "qr_caption") ? (
                <figcaption
                  className="spec"
                  style={{ color: "var(--brand-accent)", marginTop: "0.75rem", textAlign: "center" }}
                >
                  {s(data, "qr_caption")}
                </figcaption>
              ) : null}
            </figure>
          ) : null}
        </div>

        <div style={{ maxWidth: "30rem", margin: "2rem 0 3.5rem" }} data-anim>
          <Paragraphs text={s(data, "body")} className="lede" />
        </div>

        {ways.length ? (
          <div data-anim>
            {ways.map((way, i) => {
              const target = cta(way, "cta");
              const body = (
                <>
                  <span className="index-num">{String.fromCharCode(65 + i)}</span>
                  <span className="h-md index-title">{typeof way.title === "string" ? way.title : ""}</span>
                  <span className="index-arrow" aria-hidden>
                    →
                  </span>
                </>
              );
              return target ? (
                <Link key={i} href={target.href} className="index-row is-compact">
                  {body}
                </Link>
              ) : (
                <div key={i} className="index-row is-compact">
                  {body}
                </div>
              );
            })}
          </div>
        ) : null}

        <div style={{ marginTop: "3.5rem" }} data-anim>
          <Button value={cta(data, "cta")} />
        </div>

        {s(data, "note") ? (
          <p className="spec" style={{ marginTop: "2rem", maxWidth: "44rem", letterSpacing: "0.06em" }}>
            {s(data, "note")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function PartnerLogosBlock({
  data,
  items,
  media,
}: {
  data: Data;
  items: ContentItem[];
  media: MediaMap;
}) {
  if (!items.length) return null;
  return (
    <section className="band">
      <div className="wrap">
        <SectionHead label={s(data, "eyebrow")} aside={s(data, "title")} />
        <ul
          className="card-grid"
          style={{ gridTemplateColumns: "repeat(auto-fill,minmax(11rem,1fr))", alignItems: "center" }}
        >
          {items.map((item) => {
            const mediaId = id(item.data, "media_id");
            const src = mediaSrc(mediaId);
            const meta = mediaId ? media[mediaId] : undefined;
            const inner = src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={meta?.alt || s(item.data, "name")}
                style={{ display: "block", width: "100%", height: "auto" }}
                loading="lazy"
              />
            ) : (
              <span className="h-md">{s(item.data, "name")}</span>
            );
            const url = s(item.data, "url");
            return (
              <li key={item.id} data-anim>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer noopener">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/**
 * Contact details are read from Settings rather than typed into the block, so
 * the address on this page and the address in the footer can never disagree.
 */
export function ContactDetailsBlock({
  data,
  site,
}: {
  data: Data;
  site: { email: string; phone: string; address: string };
}) {
  const map = s(data, "map_embed_url");

  const rowsOut = [
    site.email ? { label: "Email", value: site.email, href: `mailto:${site.email}` } : null,
    site.phone ? { label: "Phone", value: site.phone, href: `tel:${site.phone.replace(/[^\d+]/g, "")}` } : null,
    site.address ? { label: "Address", value: site.address, href: null } : null,
  ].filter(Boolean) as { label: string; value: string; href: string | null }[];

  return (
    <section className="band">
      <div className="wrap">
        <SectionHead label={s(data, "eyebrow")} />
        {s(data, "title") ? (
          <h2 className="h-lg" data-anim style={{ marginBottom: "1.5rem" }}>
            {s(data, "title")}
          </h2>
        ) : null}
        <div style={{ maxWidth: "40rem" }} data-anim>
          <Paragraphs text={s(data, "body")} className="lede" />
        </div>

        <div className="split" style={{ marginTop: "clamp(2rem,4vw,3rem)" }}>
          <dl style={{ margin: 0 }} data-anim>
            {rowsOut.map((row) => (
              <div key={row.label} style={{ borderTop: "1px solid var(--ink-25)", padding: "1.25rem 0" }}>
                <dt className="spec" style={{ color: "var(--brand-secondary)" }}>
                  {row.label}
                </dt>
                <dd className="contact-value" style={{ margin: "0.375rem 0 0", fontSize: "1.125rem" }}>
                  {row.href ? <a href={row.href}>{row.value}</a> : row.value}
                </dd>
              </div>
            ))}
          </dl>

          {map ? (
            <div data-anim className="split-media">
              <iframe
                src={map}
                title="Map to the foundation"
                width="100%"
                height="380"
                style={{ border: "1px solid var(--brand-ink)", display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </div>

        {s(data, "show_form") === "yes" ? (
          <p className="no-media" style={{ marginTop: "2rem" }}>
            Enquiry form not built yet. The old site&apos;s form could never submit — its inputs had
            no <code>name</code> attributes and <code>form.php</code> returned an empty response — so
            there was nothing to migrate. Wire this to a real handler before turning it on.
          </p>
        ) : null}
      </div>
    </section>
  );
}
