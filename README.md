# Girisha Suri — fashion design portfolio

Astro + TypeScript portfolio site. Phase 1 vertical slice: landing page with the
signature thread-stitch scroll moment, segment selection, one fully built
segment (Streetwear) with an open and a password-protected project, a complete
case-study page with a bespoke thread-into-embroidery scroll interaction, the
password gate, a recruiter filter, and an About page.

**Deploy target: Render Static Site + GoDaddy domain**, public GitHub repo.
That combination has no server to check a password against at request time —
see "How the password gate actually works" below for what that means and
the trade-off it implies.

## Run it

```bash
npm install
cp .env.example .env   # then add your own UNLOCK_PASSWORDS value
npm run dev
```

Opens at `http://localhost:4321`. `predev`/`prebuild` run
`scripts/prepare-protected-assets.mjs` automatically, which is what makes the
protected project's unlock work at all (see below) — re-run
`npm run protected-assets` manually after changing `UNLOCK_PASSWORDS`.

`npm run build` runs the same prep step, then `astro check`, then
`astro build`, outputting the static site to `dist/` — that's what Render
deploys.

## Where things live

- **Design tokens** — [src/styles/tokens.css](src/styles/tokens.css). Every
  color, font, spacing value, radius, and motion timing in the codebase reads
  from here. Tune the look by editing this one file.
- **Global base styles** — [src/styles/global.css](src/styles/global.css):
  font loading, CSS reset, focus-visible styling.
- **Content data** — [src/data/segments.ts](src/data/segments.ts) and
  [src/data/projects.ts](src/data/projects.ts). Typed arrays; no template
  needs to change when you edit these.
- **Pages** — [src/pages/](src/pages/): landing (`index.astro`), segment grid
  (`work/[segment]/index.astro`), case study
  (`work/[segment]/[project].astro`), `about.astro`.
- **Components** — [src/components/](src/components/), grouped by concern
  (`thread/`, `cards/`, `gate/`, `filter/`, `scroll/`, `process/`, `layout/`).
  The landing page's signature moment is
  [thread/ParticleAssemblyHero.astro](src/components/thread/ParticleAssemblyHero.astro)
  — the photo is sliced into a grid of rigid rectangular tiles (SVG
  `clipPath` windows onto the real full-resolution image, not sampled
  colour swatches), which scatter and tumble in from random positions and
  lock edge-to-edge into the finished photo as you scroll (pinned,
  scrubbed). Takes the image via props (`image`, `imageAlt`, `imageWidth`,
  `imageHeight` — the last two must be the file's real pixel dimensions, used
  as the SVG viewBox). Respects `prefers-reduced-motion` (shows the finished
  photo directly, no animation) and uses a smaller grid on small viewports.
- **Password-gate logic (active, static-hosting path)** —
  [src/lib/clientGate.ts](src/lib/clientGate.ts) and
  [scripts/prepare-protected-assets.mjs](scripts/prepare-protected-assets.mjs).
- **Password-gate logic (alternate, server-hosting path, not currently used)**
  — [src/server/](src/server/) + [api/src/](api/src/), built for Azure
  Functions or any Node host. Kept for reference in case hosting ever moves
  off a pure static site — see "If you ever need real server-side protection"
  below.

## Add a segment

Edit [src/data/segments.ts](src/data/segments.ts) — add an entry with a new
`id`/`slug`/`name`/`order`/`blurb`. It immediately appears on the landing page
and gets a route at `/work/<slug>` (empty-state grid until you add projects).

## Add a project

Edit [src/data/projects.ts](src/data/projects.ts) — add an entry to the
`projects` array with a matching `segmentId`. Drop images in
`public/images/<segment>/<project-slug>/` and point the project's
`heroImage`/`process[].images`/`lookbookImages` at them.

Every project gets a full case-study page at `/work/<segment>/<project-slug>`,
built from the `process` array (ordered research → inspiration → mood → mock →
tech pack) plus a closing `lookbookImages` gallery — `protected` only changes
what happens to the hero image:

- `protected: false` → hero image renders normally.
- `protected: true` → the grid card and the case-study hero both render the
  blurred placeholder behind a lock affordance; clicking either opens the
  password gate in place. Once unlocked in a browser (see
  [src/lib/gateStorage.ts](src/lib/gateStorage.ts)), both self-unlock without
  re-prompting. You must also:
  1. Add the real, full-resolution image as
     `/private/protected-images/<projectId>/hero-real.<ext>` (gitignored —
     never committed, this repo is public).
  2. Add `"<projectId>": "<password>"` to the `UNLOCK_PASSWORDS` JSON in your
     `.env` (local) or Render's Environment Variables (deployed).
  3. For Render, also make the real hero image available during the build.
     Preferred: keep a private GitHub repo with
     `<projectId>/hero-real.<ext>` (for example,
     `overrun-bomber/hero-real.jpg`) and set a read-only
     `PROTECTED_ASSETS_TOKEN` in Render. `protected-images/<projectId>/...`
     also works. `PROTECTED_ASSETS_REPO` defaults to
     `Arnav1511/girisha-protected-assets`; override it if your asset repo uses
     a different `owner/repo`.
  4. Run `npm run protected-assets` (or just `npm run dev` / `npm run build`,
     which do it automatically) — this copies the real image into
     `public/images/protected/<projectId>/hero-<hash>.<ext>`, where `<hash>`
     is derived from the password, and is how the gate finds it.
  5. Export a genuinely low-res, blurred version as the public `heroImage` —
     never a CSS blur over the real file. See
     `public/images/streetwear/overrun-bomber/hero-blurred.jpg` for the
     pattern: resize the real photo down to a few dozen pixels wide, blur it,
     re-export as a small JPEG (e.g. via `sharp`) — the result is too
     low-resolution to recover any real detail no matter how it's displayed.

A project's `tags` array drives the recruiter filter automatically — no
separate wiring needed.

## How the password gate actually works

Render Static Site (and any plain static host) has no server, so there's
nothing that can check `password === secret` at request time without
shipping `secret` to every visitor's browser. Instead:

1. At build time, `scripts/prepare-protected-assets.mjs` reads
   `UNLOCK_PASSWORDS` and copies each protected project's real image to
   `public/images/protected/<projectId>/hero-<hash>.<ext>`, where `<hash>` is
   `sha256(password + ":" + projectId)`, truncated.
2. The gate modal never sends the password anywhere. It hashes whatever the
   visitor typed the same way, client-side
   (`src/lib/clientGate.ts`), and tries to fetch the resulting URL. Right
   password → the file exists → it loads. Wrong password → 404 → "doesn't
   match."
3. The modal swaps the trigger's `<img>` src to that URL in place — no reload.

**What this does and doesn't protect against.** The plaintext password is
never in the JS bundle or git history — only the hashing scheme is, which is
fine, hash functions are public by design. That's enough to keep an
unreleased project out of casual browsing and off Google. It is **not** real
access control: once a visitor knows or guesses the password once, the
resulting URL works for anyone, forever (no expiry, no rate-limiting — there's
no server to enforce either). Don't put anything behind this gate you'd be
genuinely upset to see leak.

## If you ever need real server-side protection

`src/server/` + `api/` are a complete, separate implementation of this same
gate built for an actual server (originally Azure Functions, but it's plain
Node — any host with a runtime works, including a Render **Web Service**
instead of a Static Site). It checks the password server-side, issues a
short-lived signed token, and streams the real file only to someone holding
a valid token — real access control, not obscurity. It's currently unused by
the live site (the modal calls `clientGate.ts`, not `/api/unlock`) but kept
in the repo in case hosting ever changes. To reactivate it, change
`PasswordGateModal.astro`'s submit handler to POST `{ projectId, password }`
to `/api/unlock` and use the returned `images[0].url` instead of calling
`resolveUnlockedImageUrl` from `clientGate.ts`, then deploy `api/` alongside a
server-capable host. From there, wiring the real images to **Azure Blob +
SAS URLs** (or any private bucket) is documented in
`api/src/lib/protectedAssets.ts`'s comments.

## What's deliberately deferred to Phase 2

- The other four segments (Vendor/Client Collaboration, Evening Wear,
  Contemporary, Indo-Western) render real, clickable empty-state grids today;
  they get real projects once photography exists.
- The second interactive type, `measure-scale`, follows the same contract as
  `ThreadEmbroidery.astro` (a root element + a base image + an SVG path
  animated against one ScrollTrigger progress value) — it isn't built yet.
- The Azure Blob/SAS wiring documented above is written but not exercised
  against a real Azure subscription.
- **Render protected-image source.** `private/` is gitignored on purpose, so a
  fresh clone/Render build has no source image to hash-copy on its own.
  `prepare-protected-assets.mjs` first tries a private GitHub asset repo when
  `PROTECTED_ASSETS_TOKEN` is set. Put the file at
  `<projectId>/hero-real.<ext>` in that private repo, for example
  `overrun-bomber/hero-real.jpg`, and set `PROTECTED_ASSETS_REPO` only if it is not
  `Arnav1511/girisha-protected-assets`.

  Render [Secret Files](https://render.com/docs/configure-environment-variables#secret-files)
  still work as a fallback source. Render's Secret File editor is a plain-text
  box, so a raw binary photo can't be pasted in directly — base64-encode it
  into text first:

  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\real-photo.jpg")) |
    Set-Content -Path "$env:USERPROFILE\Desktop\overrun-bomber-hero-real.jpg.b64" -NoNewline -Encoding ascii
  ```

  Open that `.b64` file, select all, copy, and paste it as the **Contents**
  of a Secret File named `<projectId>-hero-real.<ext>.b64` (e.g.
  `overrun-bomber-hero-real.jpg.b64` — keep the real extension before
  `.b64`). Render mounts it at `/etc/secrets/<filename>` during the build;
  the script decodes it back to real image bytes before copying it into the
  public build, the same way it reads
  `private/protected-images/<projectId>/hero-real.<ext>` locally. Check
  Render's current size limit for Secret Files before uploading a large
  photo (base64 inflates size by about a third). For large files, use the
  private GitHub token flow instead of pasting the image into Render config.
