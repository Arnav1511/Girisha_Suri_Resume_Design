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

- `protected: false` → gets a full case-study page automatically at
  `/work/<segment>/<project-slug>`, built from the `process` array (ordered
  research → inspiration → mood → mock → tech pack) plus a closing
  `lookbookImages` gallery.
- `protected: true` → no case-study page in Phase 1. It only ever appears as a
  locked card; clicking it opens the password gate. You must also:
  1. Add the real, full-resolution image as
     `/private/protected-images/<projectId>/hero-real.<ext>` (gitignored —
     never committed, this repo is public).
  2. Add `"<projectId>": "<password>"` to the `UNLOCK_PASSWORDS` JSON in your
     `.env` (local) or Render's Environment Variables (deployed).
  3. Run `npm run protected-assets` (or just `npm run dev` / `npm run build`,
     which do it automatically) — this copies the real image into
     `public/images/protected/<projectId>/hero-<hash>.<ext>`, where `<hash>`
     is derived from the password, and is how the gate finds it.
  4. Export a genuinely low-res, blurred version as the public `heroImage` —
     never a CSS blur over the real file. See
     `public/images/streetwear/overrun-bomber/hero-blurred.svg` for the
     pattern (an SVG with `feGaussianBlur` baked into the asset itself).

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
- **Getting the real protected image onto Render at all.** `private/` is
  gitignored on purpose, so a fresh clone/Render build has no source image to
  hash-copy — `prepare-protected-assets.mjs` just warns and skips. Render has
  no built-in private file storage for a Static Site. Once real unreleased
  photography needs to go behind the gate, you'll need to get it into the
  build some other way that isn't committing it to this public repo — Render
  Secret Files (check their size limit) for something small, or a build step
  that fetches it from a private bucket using a token stored as a Render env
  var, for anything larger.
