import Link from "next/link";
import { type Chrome } from "@/server/cms";

const SOCIALS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
] as const;

/**
 * The footer, opening with the tagline set enormous.
 *
 * The tagline, the blurb, every link and every contact detail are settings
 * rows. Only social channels with an address are shown at all — the old site
 * printed dead icons that went nowhere, which is worse than an absent link.
 */
export function SiteFooter({ chrome }: { chrome: Chrome }) {
  const { site, nav } = chrome;
  const socials = SOCIALS.filter((s) => site[s.key]);

  // Set the last word of the tagline in outline, the way the design does. Split
  // rather than hardcoded so any tagline gets the same treatment.
  const words = site.tagline.trim().split(/\s+/).filter(Boolean);
  const lastWord = words.length > 1 ? words.pop() : null;

  return (
    <footer
      style={{
        background: "var(--band-night)",
        color: "var(--brand-paper)",
        paddingBlock: "clamp(4rem,8vw,6.25rem) 2.75rem",
      }}
    >
      <div className="wrap">
        {site.tagline ? (
          <p className="h-xl" style={{ marginBottom: "clamp(3rem,7vw,5.625rem)" }}>
            {words.join(" ")}{" "}
            {lastWord ? <span className="outline outline-accent">{lastWord}</span> : null}
          </p>
        ) : null}

        <div
          style={{
            display: "grid",
            gap: "3rem",
            gridTemplateColumns: "repeat(auto-fit,minmax(12rem,1fr))",
            alignItems: "start",
          }}
        >
          <div>
            <p className="display" style={{ fontSize: "1.1875rem", lineHeight: 1.2, margin: 0 }}>
              {site.org_name}
            </p>
            {site.footer_blurb ? (
              <p
                style={{
                  margin: "1.125rem 0 0",
                  fontSize: "1rem",
                  fontStyle: "italic",
                  color: "var(--paper-60)",
                  maxWidth: "18rem",
                }}
              >
                {site.footer_blurb}
              </p>
            ) : null}
          </div>

          <nav aria-label="Footer" className="spec" style={{ letterSpacing: "0.06em" }}>
            <p style={{ color: "var(--paper-45)", marginBottom: "0.75rem" }}>Explore</p>
            <ul style={{ display: "grid", gap: "0.75rem", listStyle: "none", margin: 0, padding: 0 }}>
              {nav.primary.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="spec" style={{ letterSpacing: "0.06em" }}>
            <p style={{ color: "var(--paper-45)", marginBottom: "0.75rem" }}>Contact</p>
            <ul style={{ display: "grid", gap: "0.75rem", listStyle: "none", margin: 0, padding: 0 }}>
              {site.email ? (
                <li>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </li>
              ) : null}
              {site.phone ? (
                <li>
                  <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}>{site.phone}</a>
                </li>
              ) : null}
              {site.address ? <li style={{ color: "var(--paper-60)" }}>{site.address}</li> : null}
            </ul>
          </div>

          {socials.length ? (
            <div className="spec" style={{ letterSpacing: "0.06em" }}>
              <p style={{ color: "var(--paper-45)", marginBottom: "0.75rem" }}>Follow</p>
              <ul style={{ display: "grid", gap: "0.75rem", listStyle: "none", margin: 0, padding: 0 }}>
                {socials.map((social) => (
                  <li key={social.key}>
                    <a href={site[social.key]} target="_blank" rel="noreferrer noopener">
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {nav.footer_groups.map((group) => (
          <div key={group.title} className="spec" style={{ marginTop: "2.5rem" }}>
            <p style={{ color: "var(--paper-45)", marginBottom: "0.75rem" }}>{group.title}</p>
            <ul style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", listStyle: "none", margin: 0, padding: 0 }}>
              {group.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Rendered on the server, so the year is right in the HTML rather than
            written in by a script after the page has already painted. */}
        <p
          className="spec"
          style={{
            borderTop: "1px solid var(--paper-25)",
            marginTop: "clamp(3rem,6vw,5rem)",
            paddingTop: "1.625rem",
            color: "var(--paper-45)",
            letterSpacing: "0.04em",
          }}
        >
          © {new Date().getFullYear()} {site.org_name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
