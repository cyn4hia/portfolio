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

- Videos are treated as horizontal (16:9): they play letterboxed inside the
  vertical phone, and the on-video **full screen** pill (or `R`) turns the
  phone to landscape — same interaction as a horizontal TikTok.
- `stats` is just `views` and `likes`, displayed rounded down with a `+`
  (`102400` shows as `100K+`), so drifting counts never go stale.
- `hook` + `thoughts` fill the field-notes panel — the "why" behind the video.
- `brands: [...]` on an account renders a "worked with" row on its profile.

**Accounts** — copy an account object and give it a unique `id`. The
`hidden: true` flag keeps an account out of every view while showing a locked
ghost tab on the homepage (the third account, `vault`, ships hidden — flip the
flag when you're ready).

## Deploy to GitHub Pages

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and
publishes automatically — just set the repo's **Settings → Pages → Source**
to **GitHub Actions** once. Asset paths are relative (`base: "./"`) and
routing uses the URL hash, so it works on `user.github.io/repo/` with zero
config. Any other static host (Netlify, Vercel, Cloudflare) can serve `dist/`
as-is.

## Controls

- Drag the phone up/down (or scroll, or arrow keys) to move between videos
- `R` rotates the phone, `M` toggles sound, `Space` plays/pauses, `Esc` closes
- Tap the phone to play/pause
