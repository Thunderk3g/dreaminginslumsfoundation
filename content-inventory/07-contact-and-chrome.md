# Contact, header, footer, donate

## Contact Us — `Contact-Us.html`

Title tag: `Dreaming In Slums`
Inner banner image: `about-inner-banner.jpg`, heading `Contact Us`.

### "Our Information" block

| Field | Value |
|---|---|
| Email | `dreaminginslums22@gmail.com` (`mailto:`) |
| Phone | `+91 9987444460` (`tel:9987444460` — note the `tel:` href omits the +91) |
| Address | Room no 107, Jai Sainath Chawl, Dattamandir Road, Waghriwada, Vakola, Santacruz East, Mumbai-400055 |
| Follow us on | Facebook → https://www.facebook.com/dreaminginaslum · Instagram → `javascript:void(0);` **(dead)** |

### Map

Google Maps `<iframe>` embed pinned to "Sainath chawl Committee", roughly
19.08299 N, 72.84033 E. Full embed URL preserved in `raw/Contact-Us.html`.

### "Get In Touch" form

Fields: First Name, Last Name, Phone No., Email Id, Messege *(sic — misspelled
label on the live site)*, Submit button.

`<form method="post" action="form.php">`

**Flagged:** the inputs have `id` attributes but **no `name` attributes**, so a
submission would post an empty body. `form.php` returns HTTP 200 with a zero-byte
response. The contact form on the live site does not work.

---

## Header — `header.html` (injected by `assets/js/global.js`)

Utility bar:
- `dreaminginslums22@gmail.com`
- `+91 9987444460`
- **Donate Now** button — opens the QR modal, not a page

Nav bar:
- Logo `logo.png` (desktop) / `logo-mob.png` (mobile), both linking to `index.html`
- Links: Home · About us · Programs · Achievements · Gallery · Contact

A commented-out "About Us" dropdown menu exists in the source but is not live.

---

## Footer — `footer.html`

- Logo (`logo.png` desktop, `logo-mob.png` mobile) → `index.html`
- `Room no 107, Jai Sainath Chawl, Dattamandir Road, Waghriwada, Vakola, Santacruz East, Mumbai-400055`
- `+91 9987444460` - `dreaminginslums22@gmail.com`
- Link row repeating the six nav items
- `@ <year> Dreaming In Slums Foundation, All rights reserved.` — the year is
  written by inline JS on every page; the `@` is a literal at-sign, not a © symbol.

---

## Donate

The only donation mechanism on the entire site is a Bootstrap modal in
`footer.html`:

- Modal title: `Scan the QR code for donation`
- Body: a single image, `assets/images/bank-qr-code.jpg`

There is no donate page, no payment gateway, no bank account details in text, no
amount presets, and no partner or sponsor logos anywhere on the site.

**Flagged:** the QR code image has been downloaded to `images/bank-qr-code.jpg`.
Confirm it is still the correct account before republishing it — a stale payment
QR is worse than none.
