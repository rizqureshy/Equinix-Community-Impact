# Equinix: Infrastructure for human possibility

An internal, visual-first experience for Equinix CRO colleagues. A clean, Apple-like page where a community connected by Equinix is a live 3D model you explore, or let play as a tour with music: six stops, each with its red thread (amber for recovered heat) and a sourced story about care, discovery, opportunity, community and responsible growth.

This is a prototype. The community is an illustrative composite; its buildings, images and films are AI generated and labelled as such. Facts come from the linked Equinix sources. See [HANDOVER.md](HANDOVER.md) for creative decisions, tool use, provenance, validation and open editorial items.

## Run locally

Requires Node.js 22 or later.

```bash
npm install
npm run dev          # http://localhost:5173 with live reload
npm run build        # static site in dist/
npm run preview      # serve dist/ at http://localhost:4173
```

Use the "Pause motion" control, or the system reduced-motion setting, to see the static version: no smooth scrolling, the camera cutting between stops instead of travelling, no leaves or rain. The season and weather switch is in the footer; the page opens in the season the date suggests.

## Test

```bash
npm test                          # unit tests: content model, routing, state, sharing
npm run build && npm run test:e2e # browser checks against the production build
node tests/e2e/shot.mjs <url> <out.png> [width] [height] [waitMs] ["scroll=<y> full"]   # screenshot helper
node tests/tools/glb-view.mjs <model.glb> <out.png>                                    # render a building model from four angles
node tests/tools/city-still.mjs <url> impact/public/media/city                          # the community still (from the live scene)
node tests/tools/city-crops.mjs <url> impact/public/media                               # the five crops behind the promises
```

The browser checks block every request that leaves the local host, then exercise the community journey, stories, history, copy actions, filters, reduced motion, mobile and a no-WebGL browser.

## Structure

```text
impact/                   Vite root: the experience
  index.html              the page; content is pre-rendered into it at build time
  styles/                 tokens.css, base.css, sections.css, weather.css
  scripts/
    app.js                wiring: community explorer and tour (with music), scroll choreography (GSAP ScrollTrigger + Lenis), routing, story dialog, gallery, copy
    state.js              single state model (topic, section, scene focus, story)
    router.js             hash routes: #/community, #/chapter/<topic>, #/story/<id>, #/promises and others
    weather.js            season and weather: light wash, leaves, rain, the footer switch
    story-dialog.js       toast, copy actions, story dialog and motion toggle
    clipboard.js          copy with graceful fallback
    content/stories.js    stories, sources, principles (edit content here)
    content/render.js     HTML for the journey cards, chapters, story detail, gallery, promises ledger, numbers, sources
    scene/city.js         the community model: loads the building GLBs, plinth, threads, camera stops, labels, interaction
  public/media/           web-ready images, films, posters, the building models (media/city/*.glb) and the tour theme (media/audio)
media-src/                Higgsfield originals, prompts and asset-manifest.json
  city/                   building concept prompts and generation records (renders and raw GLBs are re-downloadable, not committed)
  promises/               prompts and originals for the five promise photographs
  audio/                  prompt and generation record for the tour theme
scripts/build_media.py    rebuilds public/media images and films from the originals
scripts/build_city.sh     compresses raw building GLBs for the web (meshopt geometry, WebP textures)
scripts/city_manifest.py  records the building pipeline in the asset manifest
tests/                    unit and end-to-end tests, plus tools/glb-view.mjs
```

To edit a story, change `impact/scripts/content/stories.js`. Rendering code does not need to change. `npm test` checks that every story cites registered sources, that every metric carries its scope and period, and that every media file exists.

To change the community layout, edit `PLACES` (position, footprint, rotation) and `VIEWS` (camera stops) in `impact/scripts/scene/city.js`. The journey order comes from the topics in `stories.js`.

### Regenerating a building

1. Write the subject line in `media-src/city/<name>.txt`; the shared style lives in `style.txt`.
2. Generate the concept image (GPT Image 2.5, 1:1, high) and convert it with Tripo H3.1 image-to-3D through the Higgsfield CLI. Save the job JSON beside the prompt as `<name>.json` and `<name>.3d.json` and download the GLB as `<name>.glb`.
3. `scripts/build_city.sh <name>` writes the web version, and `python3 scripts/city_manifest.py` updates the manifest.

## Deploy

The build is fully static and self-contained: Three.js, GSAP, fonts, images, films and models are bundled and served from the same host. No CDN, analytics or third-party runtime calls. Asset paths and story links are relative, so the same `dist/` works at a repository subpath or a host root.

- **GitHub Pages, simplest:** a ready-built copy lives in `docs/`. In the repository settings, open Pages, choose "Deploy from a branch", pick the branch and the `/docs` folder. Rebuild it after any change with `npm run build:docs` and commit the result.
- **GitHub Pages, automated:** `.github/workflows/pages.yml` builds and deploys on pushes to `main` when Pages source is set to "GitHub Actions". Either way the site lives at `https://<owner>.github.io/Equinix-Community-Impact/`.
- **Cloudflare Pages:** build command `npm run build`, output directory `dist`, Node 22 (`NODE_VERSION=22`). No redirects needed because routes use the URL hash.
- **Internal hosting:** copy `dist/` to any static web server.

Note: this repository is currently public. The site sets `noindex`, but anyone with the URL can view a Pages deployment. Choose the hosting and access policy before publishing.

## Third-party code and assets

- Three.js 0.186.1 (MIT), GSAP 3.15.0 with ScrollTrigger (GreenSock standard license, free for this use), Lenis 1.3.27 (MIT), glTF Transform (MIT, build time only), Inter Tight via Fontsource (SIL Open Font License).
- Interface patterns adapted from 21st.dev references, rewritten in plain JavaScript and CSS. See HANDOVER.md for the list.
- The scroll technique (a live 3D model that moves with scroll and cursor, framed per section) follows the approach shown in the "Stay a little longer" reference video; no code from it was used.
