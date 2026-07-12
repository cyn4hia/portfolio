# cyn — video portfolio

A mono-themed portfolio for short-form video work. Each account is a browser
tab on the homepage; opening one drops you into a 3D phone that plays the
video, rotates from vertical to horizontal for widescreen cuts, and pairs
every video with its performance stats and the thinking behind it.

## Run it

```sh
npm install
npm run dev      # local dev at http://localhost:5173
npm run build    # production build in dist/
```

## Add your content

Everything lives in [`src/data/accounts.js`](src/data/accounts.js).

**Videos** — drop the mp4 into `public/videos/<account-id>/` and set the
video's `src` field, e.g. `src: "videos/main/hook-experiment.mp4"`. Until a
`src` exists the phone shows an "awaiting footage" static screen, so you can
lay out the whole portfolio before exporting a single file.

- Every video declares `orientation: "horizontal" | "vertical"` (missing =
  vertical). Horizontal videos play letterboxed inside the vertical phone,
  and the on-video **full screen** pill (or `R`) turns the phone to
  landscape — same interaction as a horizontal TikTok. Vertical videos fill
  the phone natively, with no letterbox and no rotation.
- `stats` is just `views` and `likes`, displayed rounded down with a `+`
  (`102400` shows as `100K+`), so drifting counts never go stale.
- `hook` + `thoughts` fill the field-notes panel — the "why" behind the video.
- `brands: [...]` on an account renders a "worked with" row on its profile.

**Profile pictures** — set an account's `avatar` to an image path (drop the
file in `public/images/`); `null` falls back to the monogram circle.

**Accounts** — copy an account object and give it a unique `id`. The
`hidden: true` flag keeps an account out of every view while showing a locked
ghost tab on the homepage (the third account, `vault`, ships hidden — flip the
flag when you're ready).

## Deploying (and keeping content off GitHub)

`public/videos/` and `public/images/` are **gitignored** — your mp4s,
covers, and photos never reach GitHub, so nobody can browse or clone them
from the repo. That has one consequence: the GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds from the repo alone, so a Pages
deploy from it would show "awaiting footage" placeholders instead of media.

**Recommended: deploy from this machine**, where the media exists:

```sh
npm run build                                  # dist/ now includes the media
npx netlify-cli deploy --prod --dir dist       # or drag dist/ into app.netlify.com
```

Cloudflare Pages (`npx wrangler pages deploy dist`) and Vercel work the same
way. Asset paths are relative and routing uses the URL hash, so any static
host serves `dist/` as-is.

**Alternative: GitHub Pages with a private repo.** Remove the two ignore
lines, make the repo private (Settings → General → Danger Zone), and Pages
keeps working if you have GitHub Pro — free for students via the GitHub
Student Developer Pack. The repo becomes unbrowsable, but note the limit
below.

**The honest limit:** whatever host you choose, a public website must send
the video files to visitors' browsers to play them — a determined person can
always capture what a browser plays. The site ships deterrents (no
right-click on media, no download affordances), and the strongest real
protection is watermarking your exports.

## Controls

- Drag the phone up/down (or scroll, or arrow keys) to move between videos
- `R` rotates the phone, `M` toggles sound, `Space` plays/pauses, `Esc` closes
- Tap the phone to play/pause
