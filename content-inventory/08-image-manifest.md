# Image manifest

77 files downloaded to `images/`, 8.5 MB total. Filenames are kept exactly as the
old site names them (including the `achievments-` misspelling) so they can be
traced back to `raw/*.html`.

**None of these images has alt text on the live site.** Every `alt` in the new CMS
seed is newly written and needs review.

## Brand

| File | Size | Where used |
|---|---|---|
| `logo.png` | 200×82, 8 KB | header + footer, desktop |
| `logo-mob.png` | 150×62, 6 KB | header + footer, mobile |
| `bank-qr-code.jpg` | 500×500, 64 KB | Donate modal |

`assets/images/favicon.png` is linked from every page but **404s**. Not downloaded.

## Homepage banner slides

| File | Size | Use |
|---|---|---|
| `banner-five.jpg` | 1600×667, 234 KB | slide 1 desktop |
| `about-emphasis.jpg` | 1024×768, 167 KB | slide 1 mobile (also the About Emphasis photo) |
| `banner-six.jpg` | 1600×667, 274 KB | slide 2 desktop |
| `banner-six-mob.jpg` | 1024×768, 144 KB | slide 2 mobile |
| `banner-four.jpg` | 1600×667, 69 KB | slide 3 desktop |
| `banner-four-mob.jpg` | 1024×768, 54 KB | slide 3 mobile |
| `about-inner-banner.jpg` | 1600×333, 101 KB | inner-page banner on About, Programs, Achievements, Gallery, Contact |

## Homepage teaser icons

| File | Size | Use |
|---|---|---|
| `about.png` | 50×50, 1 KB | "Who are we ?" icon |
| `emphasis.png` | 50×50, 1 KB | "Emphasis" icon |
| `scope.png` | 50×50, 1 KB | "Scope" icon |

At 50×50 these are icons, not photographs. Too small to reuse at any larger size.

## Story-block photography

| File | Size | Use |
|---|---|---|
| `our-mission.jpg` | 1024×768, 93 KB | Our Mission (home + about) |
| `our-vision.jpg` | 1024×768, 98 KB | Our Vision (home + about) |
| `about-emphasis.jpg` | 1024×768, 167 KB | Emphasis |
| `train-girls.jpg` | 1024×768, 64 KB | Why we want to train girls in football? |
| `about-scope.jpg` | 1024×768, 41 KB | Scope |
| `block-first.jpg` | 1024×768, 139 KB | **unused** — referenced only inside HTML comments |

## Team portraits

| File | Size | Person |
|---|---|---|
| `gulafsha-ansari-pic.jpg` | 400×400, 31 KB | Gulafsha Ansari |
| `prajkta-tambadkar.jpg` | 400×400, 34 KB | Prajakta Tambadkar (filename misspells the name) |
| `muskaan-nishad.jpg` | 400×400, 19 KB | Muskan Nishad (filename spells it "Muskaan") |
| `pallavi-coach.jpg` | 400×400, 14 KB | Pallavi |
| `women.jpg` | 400×400, 5 KB | ⚠️ generic placeholder used for **both** Sheetal Pal and Jyoti Hiwale |

400×400 is small for a modern portrait treatment. At 5 KB, `women.jpg` is a flat
stock graphic, not a photo.

## Achievements

`achievments-1.jpg` … `achievments-36.jpg`, all 1024×768, 34–290 KB.
Captions in `04-achievements.md`.

## Gallery

`gallery-1.jpg` … `gallery-18.jpg`, all 768×576, 53–183 KB.
No captions exist. Ordering in `06-gallery.md`.

## Resolution warning

Nothing on the old site exceeds 1600 px wide, and most photography is 1024×768.
A full-bleed hero on a modern 2× display wants ~2400 px. These assets will be
soft if stretched. Higher-resolution originals should be requested from the
client before the design phase.
