# Equinix: Infrastructure for human possibility

An internal, explorable experience for Equinix CRO colleagues about the positive impact of Equinix data centers on the communities around them. Light, photography-led and corporate in tone, built around five pillars: Care, Research, Growth, Support and Progress. Visitors explore a world map of where the stories happen, read each pillar with its lead story and figures, drag a progress timeline from 1998 to the 2040 net-zero target, open the five community promises, meet the people, and carry sourced stories into their own conversations.

This is a prototype. The images and films are AI generated and labelled as such. Facts come from the linked Equinix sources. See [HANDOVER.md](HANDOVER.md) for creative decisions, provenance, validation and open editorial items.

## Run locally

Requires Node.js 22 or later.

```bash
npm install
npm run dev          # http://localhost:5173 with live reload
npm run build        # static site in dist/
npm run preview      # serve dist/ at http://localhost:4173
```

Use the "Pause motion" control, or the system reduced-motion setting, for the still version: no smooth scrolling, no pulsing pins, figures shown at once, films paused.

## Test

```bash
npm test                          # unit tests: content model, routing, state, sharing
npm run build && npm run test:e2e # browser checks against the production build
node tests/e2e/shot.mjs <url> <out.png> [width] [height] [waitMs] ["scroll=<y> full reduce"]   # one screenshot
SHOT_DIR=shots node tests/tools/walk.mjs <url> [width] [height] [tag]                           # every section, one run
```

The browser checks block every request that leaves the local host, then exercise the map (list, pins, keyboard, filters, arcs), stories and their links, copy actions, the pillar tabs, the timeline drag, counters and meters, promises, library filters, direct links, motion off, a phone and the Engage page.

## Structure

```text
impact/                   Vite root: the experience
  index.html              the page; content is pre-rendered into it at build time
  engage.html             the Engage page: the Viva Engage community embedded
  styles/                 tokens.css (palette, type, spacing), base.css, sections.css
  scripts/
    app.js                wiring: map, pillar tabs, timeline, reveals and counters, promises, library, header, routing, story dialog
    map.js                the impact map: dot-matrix land, pins, arcs, selection and filtering (SVG)
    state.js              single state model (topic, section, focus, story)
    router.js             hash routes: #/community, #/chapter/<topic>, #/story/<id>, #/progress, #/promises and others
    story-dialog.js       toast, copy actions, story dialog and motion toggle
    clipboard.js          copy with graceful fallback
    content/stories.js    stories, sources, principles, the five pillars' ids and labels (edit content here)
    content/places.js     pillar framing, map pins, arcs, timeline milestones
    content/map-dots.js   generated land dots for the map (scripts/build-map.mjs)
    content/render.js     HTML for the pillar row, map panel, pillars, timeline, numbers, meters, promises, library, sources, story detail
  public/media/           web-ready images, films and posters
media-src/                Higgsfield originals, prompts and asset-manifest.json
scripts/build_media.py    rebuilds public/media images and films from the originals
scripts/build-map.mjs     regenerates the land dots from Natural Earth data (world-atlas)
tests/                    unit and end-to-end tests, plus tools/walk.mjs
```

To edit a story, change `impact/scripts/content/stories.js`. Rendering code does not need to change. `npm test` checks that every story cites registered sources, that every metric carries its scope and period, and that every media file exists.

To change a pillar's framing (title, intro, moment), a pin, an arc or a milestone, edit `impact/scripts/content/places.js`.

## Deploy

The build is fully static and self-contained: fonts, images, films, map data and scripts are bundled and served from the same host. No CDN, analytics or third-party runtime calls, except the Viva Engage feed embedded on the Engage page. Asset paths and story links are relative, so the same `dist/` works at a repository subpath or a host root.

- **GitHub Pages, from this branch's root (current setup):** the root `index.html` and `engage.html` forward to the built copy in `docs/`, and `.nojekyll` keeps Pages from rendering the README. After any change run `npm run build:docs` and commit `docs/` with the source.
- **GitHub Pages, automated:** `.github/workflows/pages.yml` builds and deploys on pushes to `main` when Pages source is set to "GitHub Actions".
- **Cloudflare Pages:** build command `npm run build`, output directory `dist`, Node 22 (`NODE_VERSION=22`). No redirects needed because routes use the URL hash.
- **Internal hosting:** copy `dist/` to any static web server.

Note: this repository is currently public. The site sets `noindex`, but anyone with the URL can view a Pages deployment. Choose the hosting and access policy before publishing.

## Third-party code and assets

- Lenis 1.3.27 (MIT), Inter Tight and Fraunces via Fontsource (SIL Open Font License). Map land from Natural Earth via world-atlas (public domain), converted at build time with topojson-client (ISC); neither ships to the browser.
- No WebGL library and no animation library: the map is SVG, the choreography is CSS, IntersectionObserver and a few small handlers.
