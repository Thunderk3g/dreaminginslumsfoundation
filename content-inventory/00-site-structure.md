# Site structure — dreaminginslumsfoundation.org

Scraped 2026-08-29. Raw HTML kept verbatim in `raw/`, images in `images/`.

## Stack of the old site

Static hand-written HTML + Bootstrap 4 + jQuery + Owl Carousel + AOS + baguetteBox.
No CMS, no build step. Header and footer are `<div id="header">` / `<div id="footer">`
placeholders filled at runtime by `assets/js/global.js`, which `$.load()`s
`header.html` and `footer.html`.

## Pages

| URL | Title tag | In nav | Notes |
|---|---|---|---|
| `index.html` (`/`) | Dreaming In Slums | yes (Home) | 3-slide banner, 3 teaser blocks, mission, vision, welcome, achievements carousel, team carousel |
| `About-Us.html` | Dreaming In Slums | yes (About us) | anchors `#who-we-are`, `#emphasis`, `#train-girl`, `#scope`, `#our-vission`, `#our-mission` |
| `Programs.html` | Dreaming In Slums | yes (Programs) | football program, youth coaching, leadership program + 5 girl-led projects |
| `Achievements.html` | Dreaming In Slums | yes (Achievements) | 36 achievement items in 6 paginated groups |
| `Gallery.html` | Dreaming In Slums | yes (Gallery) | 18 photos in 2 paginated tabs, lightbox |
| `Contact-Us.html` | Dreaming In Slums | yes (Contact) | contact details, Google Map embed, contact form posting to `form.php` |
| `form.php` | — | no | returns 200 with an empty body |

Anchors linked from the homepage teasers: `About-Us.html#who-we-are`,
`#emphasis`, `#scope`, `#our-mission`, `#our-vission` (note the misspelling —
that is the real id on the live page).

## Navigation (from `header.html`)

Home · About us · Programs · Achievements · Gallery · Contact

Top utility bar: email `dreaminginslums22@gmail.com`, phone `+91 9987444460`,
and a **Donate Now** button that opens a Bootstrap modal titled
"Scan the QR code for donation" showing `assets/images/bank-qr-code.jpg`.

## Footer (from `footer.html`)

- Logo (desktop `logo.png`, mobile `logo-mob.png`)
- Address: Room no 107, Jai Sainath Chawl, Dattamandir Road, Waghriwada, Vakola, Santacruz East, Mumbai-400055
- `+91 9987444460` — `dreaminginslums22@gmail.com`
- Repeat of the six nav links
- `@ <current year> Dreaming In Slums Foundation, All rights reserved.` (year injected by JS)

## Metadata / SEO

There is essentially none. Every page carries the same:

```html
<title>Dreaming In Slums</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
<link rel="icon" type="image/x-icon" href="assets/images/favicon.png">
```

No `<meta name="description">`, no Open Graph, no Twitter cards, no canonical,
no structured data, no per-page titles, no `lang` beyond `<html lang="en">`.

## Flagged problems found while scraping

1. **`assets/images/favicon.png` returns 404.** Every page links to it. Broken today.
2. **No `alt` text anywhere.** Every single `<img>` on the site is missing `alt`,
   including the logo (`alt="Logo-Image"` is the only one, and it is not descriptive).
   All alt text in the new CMS seed is written fresh — it is **not** scraped, so
   review it.
3. **Mojibake in the source.** The live HTML is served with UTF-8 bytes that were
   double-encoded at authoring time, so curly apostrophes and quotes render as
   `â€™` / `â€œ`. Repaired to the intended characters in the inventory below;
   the raw files keep the damage as served.
4. **Team roles are wrong on the live site.** All six team members are labelled
   "Founder". Gulafsha Ansari is the founder per the About copy; the other five
   roles are unknown. Flagged, not guessed — see `05-team.md`.
5. **Two team members share a placeholder photo.** Sheetal Pal and Jyoti Hiwale
   both use `assets/images/women.jpg`, a generic stock image, not a real headshot.
6. **Team social links are dead.** Every Facebook/Instagram icon is `javascript:void(0);`.
7. **Instagram link is dead** in the Contact page "Follow us on" block —
   `javascript:void(0);`. Only Facebook resolves: https://www.facebook.com/dreaminginaslum
8. **Contact form is non-functional.** Inputs have `id` but no `name` attributes,
   so nothing would be submitted; `form.php` returns an empty 200.
9. **Achievement dates are embedded in prose**, not in a separate field, and about
   half the items carry no date at all.
10. **`achievments-` is misspelled** in every image filename. Kept verbatim so the
    files still match the source.
11. **No impact statistics exist on the old site.** The "150+ girls every weekend"
    figure appears only inside the Programs prose. Any stat block in the new site
    is new content that the client must supply or approve.
12. **No testimonials / dreamer stories exist on the old site.** That content type
    is entirely new.
