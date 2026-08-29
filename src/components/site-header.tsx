import Link from "next/link";
import { mediaSrc, type Chrome } from "@/server/cms";
import { MobileNav } from "./mobile-nav";

/**
 * The sticky masthead: logo, menu, and the donate button welded to the right
 * edge in gold.
 *
 * Everything is a settings row — the logo, every link, the button's words and
 * where it goes. Nothing here knows what the organisation is called.
 *
 * Two menus are rendered: the inline one, which is the real markup and is all a
 * crawler or a no-JS visitor ever sees, and the phone panel, which is hidden
 * from wide screens by CSS. Below 64rem the inline list is hidden and the
 * toggle takes over.
 */
export function SiteHeader({ chrome }: { chrome: Chrome }) {
  const { site, nav } = chrome;
  const logo = mediaSrc(site.logo_media_id);
  const donate = site.donate.href ? site.donate : null;

  return (
    <>
      {site.announcement.enabled && site.announcement.text ? (
        <div className="announce spec">
          {site.announcement.href ? (
            <Link href={site.announcement.href}>{site.announcement.text} →</Link>
          ) : (
            site.announcement.text
          )}
        </div>
      ) : null}

      <header className="masthead">
        <div className="masthead-row">
          <Link href="/" className="masthead-brand">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={site.org_name} className="masthead-logo" />
            ) : (
              <span className="display masthead-wordmark">{site.short_name}</span>
            )}
          </Link>

          <nav aria-label="Main" className="masthead-nav spec">
            <ul>
              {nav.primary.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {donate ? (
            <Link href={donate.href} className="masthead-donate spec">
              {donate.label} <span className="arr" aria-hidden>↗</span>
            </Link>
          ) : null}

          <MobileNav links={nav.primary} donate={donate} />
        </div>
      </header>
    </>
  );
}
