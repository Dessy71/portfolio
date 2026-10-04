# Dessy. — portfolio

Personal site for **Antwi Desmond** — web developer &amp; graphic designer, Accra, Ghana.
Light, premium, motion-led. **No dependencies, no build tooling, no CDN calls.**

---

## Source vs. build output — read this first

There are two `.html` files and they are **not** two versions of the same thing:

| | `src/template.html` | `site/index.html` |
| --- | --- | --- |
| What it is | the **source** you edit | the **generated page** you deploy |
| Images | referenced by path (`assets/img/desk.webp`) | baked in as base64 text |
| Fonts / CSS / JS | separate files | inlined into the one file |
| Editing it | do all your editing here | **never edit — the next build overwrites it** |
| Freshness | always current | only as current as the last build |

**Why your image change showed up in `template.html` but not in the browser preview:** `template.html` loads pictures from `src/assets/img/` on disk, so it always shows the newest file. `site/index.html` has the image bytes frozen inside the file as `data:image/webp;base64,…` — that's what makes it work as a single file with no server. Swapping a `.webp` on disk changes nothing until you rebuild.

```bash
npm run build      # after changing anything → regenerates site/index.html
npm run dev        # rebuilds automatically every time you save (leave it running)
npm run preview    # serves site/ on http://localhost:5173
```

The everyday loop is: **`npm run dev` in one terminal, edit files in `src/`, refresh the browser.** Every generated file starts with a `GENERATED FILE — do not edit` banner and a build timestamp, so it's always obvious which one you're looking at.

## What to edit, for common changes

| I want to… | Edit this | Then |
| --- | --- | --- |
| Change a photo | drop the new file into `src/assets/img/` **using the same filename** | it rebuilds itself (`npm run dev`) |
| Swap in a photo with a new name | `src/template.html` → update that `src="assets/img/…"` | rebuild |
| Update my résumé | replace `src/assets/DESMOND-Antwi-CV.pdf` | all four download buttons update |
| Change wording | `src/template.html` | rebuild |
| Change colours | `src/styles.css` → the `:root` block at the top | rebuild |
| Change a project | `src/template.html` → the `<article class="project …">` block | rebuild |

**Image guidance:** keep project shots around 1100–1400 px wide and under ~150 KB (WebP). Every inlined KB adds ~1.4 KB to the page because base64 is 33 % larger than the raw file. Hero thumbnails are 480 px (`hero-*.webp`) since they only render ~170 px wide.

## Repo structure

```
portfolio/
├─ package.json          scripts: build · dev · preview
├─ build.mjs             the whole build (zero dependencies)
├─ README.md
├─ scripts/
│  ├─ watch.mjs          rebuild-on-save for development
│  └─ serve.mjs          local preview server
├─ src/                  ← everything you edit
│  ├─ template.html      the page markup
│  ├─ styles.css         design system + all styling (tokens at the top)
│  ├─ main.js            interactions
│  └─ assets/
│     ├─ DESMOND-Antwi-CV.pdf
│     ├─ fonts.css + fonts/     self-hosted Inter, Space Grotesk, Instrument Serif
│     └─ img/                   10 optimised WebP shots (8 projects + 2 hero thumbs)
└─ site/                 ← generated output; deploy this folder
   └─ index.html         ONE self-contained file
```

## Deploy

Full step-by-step (GitHub → Vercel, custom domain, troubleshooting): **[DEPLOY.md](DEPLOY.md)**

Short version:

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/dessy-portfolio.git
git push -u origin main
```

Then import the repo at [vercel.com/new](https://vercel.com/new). `vercel.json` already sets the build command (`npm run build`) and output directory (`site`), so there's nothing to configure. After that every `git push` redeploys automatically.

> If the repo root sits **above** this folder, set Vercel's **Root Directory** to `portfolio`.

## Palette

Deep teal → lime/gold — deliberately not the ubiquitous violet→orange. Six tokens in the `:root` block of `src/styles.css` control the whole scheme:

| Token | Value | Used for |
| --- | --- | --- |
| `--brand` | `#0c7a5f` | links, icons, accents (text-safe on paper: 5.1:1) |
| `--brand-deep` | `#064e42` | headings, hover states |
| `--accent` / `--accent-soft` | `#9a5b00` / `#e0a33c` | ochre labels / gold decoration |
| `--lime` | `#aadc3c` | scribble underline, footer stars |
| `--grad` | `#064e42 → #0c7a5f → #159a63` | buttons, bars, progress |
| `--grad-bright` | `#064e42 → #0c7a5f → #4d8f1c` | count-up numerals, rotator |

Bright lime/gold is decoration only — never body text. If you re-hue, keep text-on-paper contrast at **4.5:1** or better.

## Sections

`about` · `services` · `skills` · `community` · `work` · `journey` · `contact`

## Interaction inventory

Scroll progress · sticky glass nav with scrollspy · aurora blobs · cursor glow · word rotator · masked line reveals · count-up stats · animated skill meters · spotlight cards · magnetic buttons · tilt hero stack · project filtering (All / Web apps / Community / Automation / Design) · case-study modals (Esc, scrim click, focus trap, focus restore) · copy-to-clipboard with confetti · Formspree submission with loading/success/error states · live Accra clock · marquee tickers · full `prefers-reduced-motion` support.

## Content notes

- **Community &amp; social** is one section — the site leads with web development and design.
- Stats: 3+ years building · 8 projects shipped · 4 leadership &amp; community roles · 2 official awards · **115+ graphic designs created** (full-width card).
- The CV (`src/assets/DESMOND-Antwi-CV.pdf`) powers all four download buttons. Replace that one file to update every link.
- **BILMAP** and **NetflixPay** have no live URL, so their case-study buttons are hidden on purpose. Add `data-link="…" data-link-label="…"` to the `<article class="project …">` element to switch one on.
- **GYIDI MUSIC** (2022) and **SACSU Fresher Registration &amp; Automation Platform** (2025) carry the years from the 2026 CV.
- Hero photo is `src/assets/img/desk.webp` — swap in a newer shot of yourself and update the `alt`.

## Accessibility &amp; performance

Keyboard-first (visible focus, cards act as buttons, modal traps focus), `aria-live` form status, skip link, descriptive `alt` text, and reduced-motion honoured everywhere. Page weight ≈ 1.35 MB in a single request — 118 KB markup/CSS/JS, 532 KB images (base64), 315 KB subset fonts, 412 KB résumé. No image is inlined twice: the two hero thumbnails are dedicated 480 px files rather than copies of the full-size project shots (that alone saved ~94 KB). Below-the-fold images are lazy-loaded.
