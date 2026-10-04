# Deploying — GitHub + Vercel

Everything below assumes the `portfolio/` folder is the one you're deploying.

## Pre-flight (30 seconds)

```bash
node -v        # need v18 or higher — v20+ is ideal
```

That's the only requirement: **no dependencies, nothing to install.** The build, watch and preview scripts have zero packages, so `npm install` does nothing (and isn't needed).

Tested to work in paths containing **spaces and symbols** (`C:\Users\Antwi Desmond\Documents\My Portfolio`), on Windows, macOS and Linux. The scripts resolve their own location with `fileURLToPath`, so no path escaping to worry about.

The build is deterministic: cloning the repo fresh and running `npm run build` produces a **byte-identical** `site/index.html` to your local one (verified). So whatever you see locally is exactly what Vercel will publish.

---

## Step 0 · Decide what goes in the repo

You have two folders side by side:

```
your-folder/
├─ portfolio/     ← the site            (2.5 MB)  ✅ this is the repo
└─ uploads/       ← raw originals       (9.6 MB)  ❌ keep out of the repo
```

`uploads/` holds the original photos, the old CVs and a 7.4 MB `gff.gif` that nothing uses any more. Don't push it — it just bloats the repo. Two ways to handle that:

- **Easy:** make `portfolio/` itself the repo (all the commands below do this), and leave `uploads/` where it is.
- **If you'd rather have one repo for everything:** move `uploads/` outside the folder you `git init` in, or add `uploads/` to `.gitignore`.

Also: the CV PDF is already embedded in `site/index.html`, so the résumé download keeps working even if you never host the PDF separately.

---

## Step 1 · Push to GitHub

### Option A — VS Code, no terminal (easiest)

1. Open VS Code → **File ▸ Open Folder…** → choose the **`portfolio`** folder (not the parent).
2. Click the **Source Control** icon in the left sidebar (the branch icon), or press `Ctrl+Shift+G`.
3. Click **Initialize Repository**.
4. Type a message in the box, e.g. `Initial commit — portfolio revamp`, then click **Commit** (✔). If it asks to stage everything, choose **Yes** — when prompted "Would you like to stage all your changes and commit them directly?", click **Yes**.
5. Click **Publish Branch** (or **Publish to GitHub**).
6. Choose **public** or **private** repository, name it something like `dessy-portfolio`, and press Enter / click Publish.
7. VS Code creates the GitHub repo and pushes. You may be asked to sign in to GitHub — do that once and it's remembered.

### Option B — terminal

```bash
cd path/to/portfolio

git init
git branch -M main
git config user.name  "Antwi Desmond"          # first time only
git config user.email "desmondantwi07@gmail.com" # first time only

git add .
git commit -m "Initial commit — portfolio revamp"

# create the repo on GitHub, then connect it (replace YOUR-USERNAME):
git remote add origin https://github.com/YOUR-USERNAME/dessy-portfolio.git
git push -u origin main
```

Or with the GitHub CLI, which creates the repo *and* pushes in one go:

```bash
gh auth login
gh repo create dessy-portfolio --public --source=. --remote=origin --push
```

> First push may ask you to authenticate. GitHub no longer accepts your account password over HTTPS — use a **Personal Access Token** (GitHub ▸ Settings ▸ Developer settings ▸ Tokens (classic) ▸ Generate new token, tick `repo`) as the password, or run `gh auth login`. Publishing from VS Code (Option A) avoids this entirely.

Check it worked: `git log --oneline` should show your commit, and the repo should appear at `github.com/YOUR-USERNAME/dessy-portfolio`.

---

## Step 2 · Deploy on Vercel

### Option A — connect the GitHub repo (recommended, auto-deploys on every push)

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with **Continue with GitHub**.
2. Find `dessy-portfolio` in the list and click **Import**.
3. On the configure screen, leave everything at the defaults — `vercel.json` in the repo already supplies:
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `site`
   - **Install Command:** `npm install`
4. Click **Deploy**. It takes about 30 seconds.
5. You'll get a URL like `dessy-portfolio.vercel.app`. Done.

> If Vercel can't find `vercel.json` (for example you set a different Root Directory), set these by hand in **Settings ▸ Build & Development Settings**: Build Command `npm run build`, Output Directory `site`.

**Important — if you put the repo one level higher** (so the repo root contains both `portfolio/` and `uploads/`), then on the import screen set **Root Directory** to `portfolio`. Otherwise Vercel builds the wrong folder and you'll see a 404.

### Option B — Vercel CLI (no GitHub needed)

```bash
cd path/to/portfolio
npx vercel login
npx vercel          # preview deploy — accept the defaults, it reads vercel.json
npx vercel --prod   # promote to your production URL
```

### Option C — drag & drop (no terminal, no Git)

Run `npm run build` locally, then drag the **`site`** folder onto [vercel.com/new](https://vercel.com/new). Quick, but no auto-deploys later.

---

## Step 3 · Every change after that

With Option A (GitHub connected), deploying is just a push:

```bash
npm run build                                    # rebuild site/index.html
git add .
git commit -m "Update hero image"
git push
```

Vercel detects the push and redeploys automatically in ~30 seconds. In VS Code you can do the same from the Source Control panel: commit, then **Sync Changes**.

> You actually don't even need to run `npm run build` before pushing — Vercel runs it on their servers. Building locally just lets you preview before you commit.

---

## Step 4 · Custom domain (optional)

1. Buy a domain (Namecheap, Porkbun, Google Domains successor…) — e.g. `desmondantwi.com`.
2. Vercel ▸ your project ▸ **Settings ▸ Domains** ▸ add the domain.
3. Follow the DNS instructions Vercel shows (usually an `A` record to `76.76.21.21`, or a `CNAME` to `cname.vercel-dns.com` for `www`).
4. Wait for it to verify — usually minutes.

**When you have a real domain, update two lines** in `src/template.html` so search engines and link previews point at the right place:

```html
<link rel="canonical" href="https://YOUR-DOMAIN.com/">
<meta property="og:url"   content="https://YOUR-DOMAIN.com/">
```

…and the same URL inside the `"@type": "Person"` JSON-LD block. Then rebuild and push.

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| 404 on the Vercel URL | Output Directory isn't `site`, or Root Directory isn't `portfolio`. Check both in Settings ▸ Build & Development. |
| Deploy succeeds but the page is stale | You edited `src/` but didn't push — remember the deployed page is generated from `src/` by the build. |
| `git push` rejected (authentication) | Use a Personal Access Token instead of your password, or publish from VS Code instead. |
| Pushed a 7.4 MB GIF you didn't want | `git rm --cached uploads/gff.gif`, commit, push. To purge history you'd need `git filter-repo` — easier to start the repo clean. |
| Vercel build fails | Run `npm run build` locally first. It has zero dependencies, so if it works locally it works on Vercel (Node 18+). |
| Images look wrong after swapping one | You replaced the file in `src/assets/img/` but didn't rebuild — see the "Source vs. build output" section of `README.md`. |
| `ENOENT ... %20` in the path | Fixed — the scripts previously didn't decode URL-escaped paths. Update to the current `build.mjs` / `scripts/*.mjs`. |
| Repo feels heavy after a few deploys | `site/index.html` is 1.4 MB and changes with every deploy. It's committed for convenience; if you want a lean history, add `site/` to `.gitignore` — Vercel rebuilds it from `src/` anyway. |

---

## Quick reference

```bash
npm run build      # src/ → site/index.html   (one self-contained file)
npm run dev        # rebuild automatically on every save
npm run preview    # serve site/ at http://localhost:5173
```

**Deploy target:** the `site/` folder only. Nothing else needs uploading.
