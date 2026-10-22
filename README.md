# Equinix: Where the light goes

An internal, story-driven experience for Equinix CRO colleagues. A dark theatre in which the only light is what leaves a data center: a field of a few thousand points of light that travels between forms as six chapters pass across one stage, a horizontal day from the first swimmer in Saint-Denis to the night shift in Markham, five promises with their proof, the people, a library of sourced stories, training and the Viva Engage community.

This is a prototype. The images and films are AI generated and labelled as such; the field of light is drawn in code. Facts come from the linked Equinix sources. See [HANDOVER.md](HANDOVER.md) for creative decisions, provenance, validation and open editorial items.

## Run locally

Requires Node.js 22 or later.

```bash
npm install
npm run dev          # http://localhost:5173 with live reload
npm run build        # static site in dist/
npm run preview      # serve dist/ at http://localhost:4173
```

Use the "Pause motion" control, or the system reduced-motion setting, to see the still version: no smooth scrolling, the field holds each form, the day becomes a plain rail, films pause.

## Test

```bash
npm test                          # unit tests: content model, routing, state, sharing
npm run build && npm run test:e2e # browser checks against the production build
node tests/e2e/shot.mjs <url> <out.png> [width] [height] [waitMs] ["scroll=<y> full reduce"]   # one screenshot
SHOT_DIR=shots node tests/tools/walk.mjs <url> [width] [height] [tag]                           # every section, one run
```

The browser checks block every request that leaves the local host, then exercise the theatre (rail, keyboard, hash, the field's forms), stories and their links, copy actions, promises, library filters, the horizontal day, motion off, a phone and the Engage page.

## Structure

```text
impact/                   Vite root: the experience
  index.html              the page; content is pre-rendered into it at build time
  engage.html             the Engage page: the Viva Engage community embedded
  styles/                 tokens.css (palette, type, spacing), base.css, sections.css
  scripts/
    app.js                wiring: the theatre, the day, reveals, promises, library, header, sound, routing, story dialog
    field.js              the field of light: a Canvas 2D particle system that travels between forms
    shapes.js             the forms: strands, pulse, constellation, ascent, town, ripples, the Equinix mark
    state.js              single state model (topic, section, focus, story)
    router.js             hash routes: #/community, #/chapter/<topic>, #/story/<id>, #/day, #/promises and others
    story-dialog.js       toast, copy actions, story dialog and motion toggle
    clipboard.js          copy with graceful fallback
    content/stories.js    stories, sources, principles (edit content here)
    content/render.js     HTML for the rail, chapters, day, numbers, promises, library, sources, ticker, story detail
  public/media/           web-ready images, films, posters and the theme (media/audio)
media-src/                Higgsfield originals, prompts and asset-manifest.json
scripts/build_media.py    rebuilds public/media images and films from the originals
tests/                    unit and end-to-end tests, plus tools/walk.mjs
```

To edit a story, change `impact/scripts/content/stories.js`. Rendering code does not need to change. `npm test` checks that every story cites registered sources, that every metric carries its scope and period, and that every media file exists.

To change a chapter's framing (title, moment, form, place), edit `CHAPTERS` in `impact/scripts/content/render.js`; the day's moments are `DAY` in the same file. To change what a form looks like, edit its generator in `impact/scripts/shapes.js`.

## Deploy

The build is fully static and self-contained: fonts, images, films and scripts are bundled and served from the same host. No CDN, analytics or third-party runtime calls, except the Viva Engage feed embedded on the Engage page. Asset paths and story links are relative, so the same `dist/` works at a repository subpath or a host root.

- **GitHub Pages, automated:** `.github/workflows/pages.yml` builds and deploys on pushes to `main` when Pages source is set to "GitHub Actions". The site lives at `https://<owner>.github.io/Equinix-Community-Impact/`.
- **GitHub Pages, from a folder:** `npm run build:docs` writes a ready-built copy to `docs/`; commit it and point Pages at the `/docs` folder. The copy currently in `docs/` is from the previous design until that is run.
- **Cloudflare Pages:** build command `npm run build`, output directory `dist`, Node 22 (`NODE_VERSION=22`). No redirects needed because routes use the URL hash.
- **Internal hosting:** copy `dist/` to any static web server.

Note: this repository is currently public. The site sets `noindex`, but anyone with the URL can view a Pages deployment. Choose the hosting and access policy before publishing.

## Third-party code and assets

- Lenis 1.3.27 (MIT), Fraunces and Inter Tight via Fontsource (SIL Open Font License). No WebGL library and no animation library: the field is Canvas 2D and the choreography is CSS and a scroll handler.
- The flow is adapted from the "Future-State" direction in the Motionsites gallery (a pinned cinematic stage, a central light-form that changes per numbered sequence, a side rail) with the editorial serif and photo portals of its "Golden Portal" direction. No code or assets from either were used.
