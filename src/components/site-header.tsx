import Link from "next/link";
import { mediaSrc, type Chrome } from "@/server/cms";

/**
 * The fixed masthead: logo, menu, and the donate button welded to the right
 * edge in gold.
 *
 * Everything here is a settings row — the logo, every link, the button's words
 * and where it goes. Nothing about this component knows what the organisation
 * is called.
 */
export function SiteHeader({ chrome }: { chrome: Chrome }) {
  const { site, nav } = chrome;
  const logo = mediaSrc(site.logo_media_id);

  return (
    <>
      {site.announcement.enabled && site.announcement.text ? (
        <div
          className="spec"
          style={{
            background: "var(--brand-ink)",
            color: "var(--brand-paper)",
            textAlign: "center",
            padding: "0.625rem 1.25rem",
          }}
        >
          {site.announcement.href ? (
            <Link href={site.announcement.href}>{site.announcement.text} →</Link>
          ) : (
            site.announcement.text
          )}
        </div>
      ) : null}

      <nav
        aria-label="Main"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 60,
          background: "color-mix(in srgb, var(--brand-paper) 92%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--brand-ink)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            gap: "1rem",
            paddingLeft: "1.25rem",
          }}
        >
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.75rem 0" }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={site.org_name}
                style={{ height: 40, width: "auto", display: "block", mixBlendMode: "multiply" }}
              />
            ) : (
              <span className="display" style={{ fontSize: "1.125rem" }}>
                {site.short_name}
              </span>
            )}
          </Link>

          <div
            className="spec"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "clamp(0.75rem,2vw,1.875rem)",
              fontWeight: 500,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <ul
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(0.75rem,2vw,1.875rem)",
                listStyle: "none",
                margin: 0,
                padding: "0.5rem 0",
                flexWrap: "wrap",
              }}
            >
              {nav.primary.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    style={{ borderBottom: "1px solid transparent", padding: "2px 0" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {site.donate.href ? (
              <Link
                href={site.donate.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "stretch",
                  background: "var(--brand-accent)",
                  color: "var(--brand-ink)",
                  padding: "1.25rem 1.625rem",
                  fontWeight: 600,
                  borderLeft: "1px solid var(--brand-ink)",
                }}
              >
                {site.donate.label} ↗
              </Link>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  );
}
