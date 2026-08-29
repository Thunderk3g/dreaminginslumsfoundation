/**
 * The chrome around every page: organisation details, the menu, brand colours
 * and the SEO defaults.
 *
 * These live in the `settings` table as jsonb, but nothing in the app reads
 * that jsonb directly. Everything goes through the readers below, which fill in
 * a default for anything missing — so a half-saved settings row degrades to the
 * shipped copy instead of blanking the header on the live site.
 */

export type NavLink = { label: string; href: string };
export type FooterGroup = { title: string; links: NavLink[] };

export type SiteSettings = {
  org_name: string;
  short_name: string;
  tagline: string;
  logo_media_id: string | null;
  favicon_media_id: string | null;
  email: string;
  phone: string;
  address: string;
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  footer_blurb: string;
  announcement: { enabled: boolean; text: string; href: string };
  donate: NavLink;
};

export type BrandSettings = {
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  color_ink: string;
  color_paper: string;
};

export type NavSettings = {
  primary: NavLink[];
  footer_groups: FooterGroup[];
};

export type SeoSettings = {
  default_title: string;
  default_description: string;
  og_media_id: string | null;
};

export const SITE_DEFAULTS: SiteSettings = {
  org_name: "Dreaming In Slums Foundation",
  short_name: "Dreaming In Slums",
  tagline: "",
  logo_media_id: null,
  favicon_media_id: null,
  email: "",
  phone: "",
  address: "",
  facebook: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  footer_blurb: "",
  announcement: { enabled: false, text: "", href: "" },
  donate: { label: "Donate Now", href: "/get-involved" },
};

/**
 * Taken from the logo on the live site: purple, blue and green in the
 * hands-around-a-football mark. Sampled, not invented — but they are the
 * starting point for the design phase, not a finished palette.
 */
export const BRAND_DEFAULTS: BrandSettings = {
  color_primary: "#5B2E91",
  color_secondary: "#1F7BC1",
  color_accent: "#3FA34D",
  color_ink: "#1B1B1F",
  color_paper: "#FFFFFF",
};

export const NAV_DEFAULTS: NavSettings = {
  primary: [
    { label: "Home", href: "/" },
    { label: "About us", href: "/about" },
    { label: "Programs", href: "/programs" },
    { label: "Achievements", href: "/achievements" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ],
  footer_groups: [],
};

export const SEO_DEFAULTS: SeoSettings = {
  default_title: "Dreaming In Slums Foundation",
  default_description: "",
  og_media_id: null,
};

/* ----------------------------------------------------------------- readers -- */

const str = (v: unknown, fallback: string): string =>
  typeof v === "string" && v.trim() ? v : fallback;

const plain = (v: unknown): string => (typeof v === "string" ? v : "");

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);

const mediaId = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

function link(v: unknown): NavLink | null {
  if (!v || typeof v !== "object") return null;
  const { label, href } = v as Record<string, unknown>;
  if (typeof label !== "string" || typeof href !== "string") return null;
  if (!label.trim() || !href.trim()) return null;
  return { label: label.trim(), href: href.trim() };
}

export function readSite(raw: Record<string, unknown> | null): SiteSettings {
  if (!raw) return SITE_DEFAULTS;
  const ann = (raw.announcement ?? {}) as Record<string, unknown>;
  return {
    org_name: str(raw.org_name, SITE_DEFAULTS.org_name),
    short_name: str(raw.short_name, SITE_DEFAULTS.short_name),
    tagline: plain(raw.tagline),
    logo_media_id: mediaId(raw.logo_media_id),
    favicon_media_id: mediaId(raw.favicon_media_id),
    email: plain(raw.email),
    phone: plain(raw.phone),
    address: plain(raw.address),
    facebook: plain(raw.facebook),
    instagram: plain(raw.instagram),
    youtube: plain(raw.youtube),
    linkedin: plain(raw.linkedin),
    footer_blurb: plain(raw.footer_blurb),
    announcement: {
      enabled: bool(ann.enabled, false),
      text: plain(ann.text),
      href: plain(ann.href),
    },
    donate: link(raw.donate) ?? SITE_DEFAULTS.donate,
  };
}

/**
 * Colours are validated to a hex literal before they reach a stylesheet.
 *
 * These values are interpolated into a `<style>` element on every page, so an
 * unvalidated string here would be a CSS injection point. Anything that is not
 * plainly `#rgb` or `#rrggbb` falls back to the shipped colour.
 */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const hex = (v: unknown, fallback: string): string =>
  typeof v === "string" && HEX.test(v.trim()) ? v.trim() : fallback;

export function readBrand(raw: Record<string, unknown> | null): BrandSettings {
  if (!raw) return BRAND_DEFAULTS;
  return {
    color_primary: hex(raw.color_primary, BRAND_DEFAULTS.color_primary),
    color_secondary: hex(raw.color_secondary, BRAND_DEFAULTS.color_secondary),
    color_accent: hex(raw.color_accent, BRAND_DEFAULTS.color_accent),
    color_ink: hex(raw.color_ink, BRAND_DEFAULTS.color_ink),
    color_paper: hex(raw.color_paper, BRAND_DEFAULTS.color_paper),
  };
}

export function readNav(raw: Record<string, unknown> | null): NavSettings {
  if (!raw) return NAV_DEFAULTS;

  const primary = Array.isArray(raw.primary)
    ? raw.primary.flatMap((entry) => {
        const parsed = link(entry);
        return parsed ? [parsed] : [];
      })
    : [];

  const footer_groups = Array.isArray(raw.footer_groups)
    ? raw.footer_groups.flatMap((entry): FooterGroup[] => {
        if (!entry || typeof entry !== "object") return [];
        const { title, links } = entry as Record<string, unknown>;
        if (typeof title !== "string" || !title.trim()) return [];
        const parsed = Array.isArray(links)
          ? links.flatMap((l) => {
              const one = link(l);
              return one ? [one] : [];
            })
          : [];
        return [{ title: title.trim(), links: parsed }];
      })
    : [];

  // An empty menu is almost certainly a mistake rather than a choice, and a
  // header with no links strands every visitor. Fall back rather than obey.
  return {
    primary: primary.length ? primary : NAV_DEFAULTS.primary,
    footer_groups,
  };
}

export function readSeo(raw: Record<string, unknown> | null): SeoSettings {
  if (!raw) return SEO_DEFAULTS;
  return {
    default_title: str(raw.default_title, SEO_DEFAULTS.default_title),
    default_description: plain(raw.default_description),
    og_media_id: mediaId(raw.og_media_id),
  };
}

/* ----------------------------------------------------------------- writers -- */

const field = (fd: FormData, key: string): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

export function siteFromForm(fd: FormData): SiteSettings {
  return {
    org_name: field(fd, "org_name") || SITE_DEFAULTS.org_name,
    short_name: field(fd, "short_name") || SITE_DEFAULTS.short_name,
    tagline: field(fd, "tagline"),
    logo_media_id: field(fd, "logo_media_id") || null,
    favicon_media_id: field(fd, "favicon_media_id") || null,
    email: field(fd, "email"),
    phone: field(fd, "phone"),
    address: field(fd, "address"),
    facebook: field(fd, "facebook"),
    instagram: field(fd, "instagram"),
    youtube: field(fd, "youtube"),
    linkedin: field(fd, "linkedin"),
    footer_blurb: field(fd, "footer_blurb"),
    announcement: {
      enabled: fd.get("announcement_enabled") != null,
      text: field(fd, "announcement_text"),
      href: field(fd, "announcement_href"),
    },
    donate: {
      label: field(fd, "donate_label") || SITE_DEFAULTS.donate.label,
      href: field(fd, "donate_href") || SITE_DEFAULTS.donate.href,
    },
  };
}

export function brandFromForm(fd: FormData): BrandSettings {
  return readBrand({
    color_primary: field(fd, "color_primary"),
    color_secondary: field(fd, "color_secondary"),
    color_accent: field(fd, "color_accent"),
    color_ink: field(fd, "color_ink"),
    color_paper: field(fd, "color_paper"),
  });
}

export function navFromForm(fd: FormData): NavSettings {
  const labels = fd.getAll("primary.label");
  const hrefs = fd.getAll("primary.href");
  const primary: NavLink[] = [];
  for (let i = 0; i < labels.length; i += 1) {
    const parsed = link({ label: labels[i], href: hrefs[i] });
    if (parsed) primary.push(parsed);
  }

  // Footer groups are flat in the form: every link carries the index of the
  // group it belongs to, so the whole thing round-trips through one FormData
  // without nested field names.
  const groupTitles = fd.getAll("group.title");
  const groups: FooterGroup[] = groupTitles.map((title) => ({
    title: typeof title === "string" ? title.trim() : "",
    links: [],
  }));

  const linkGroups = fd.getAll("grouplink.group");
  const linkLabels = fd.getAll("grouplink.label");
  const linkHrefs = fd.getAll("grouplink.href");
  for (let i = 0; i < linkGroups.length; i += 1) {
    const gi = Number(linkGroups[i]);
    const parsed = link({ label: linkLabels[i], href: linkHrefs[i] });
    if (parsed && Number.isInteger(gi) && groups[gi]) groups[gi].links.push(parsed);
  }

  return { primary, footer_groups: groups.filter((g) => g.title && g.links.length > 0) };
}

export function seoFromForm(fd: FormData): SeoSettings {
  return {
    default_title: field(fd, "default_title") || SEO_DEFAULTS.default_title,
    default_description: field(fd, "default_description"),
    og_media_id: field(fd, "og_media_id") || null,
  };
}
