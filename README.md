# Equinix: Infrastructure for human possibility

An internal, visual-first experience for Equinix CRO colleagues. One living 3D community, connected by an Equinix red thread, where each connection opens a sourced story about care, discovery, opportunity, community and responsible growth.

This is a prototype. The community is an illustrative composite and every image or film is AI generated and labelled as such. Facts come from the linked Equinix sources. See [HANDOVER.md](HANDOVER.md) for creative decisions, tool use, provenance, validation and open editorial items.

## Run locally

Requires Node.js 22 or later.

```bash
npm install
npm run dev          # http://localhost:5173 with live reload
npm run build        # static site in dist/
npm run preview      # serve dist/ at http://localhost:4173
```

The 3D community is at `/explore.html`; add `?scene=off` there to see it without WebGL. Use the "Pause motion" control, or the system reduced-motion setting, to see the static version without pinning or smooth scrolling.

## Test

```bash
npm test                          # unit tests: content model, routing, state, sharing
npm run build && npm run test:e2e # 52 browser checks against the production build
node tests/e2e/shot.mjs <url> <out.png> [width] [height] [waitMs]   # screenshot helper
```

The browser checks block every request that leaves the local host, then exercise the scene, explorer, stories, history, copy actions, filters, reduced motion, mobile and a no-WebGL browser.

## Structure

```text
impact/                   Vite root: the experience
  index.html              the scroll story; content is pre-rendered into it at build time
  explore.html            the separate 3D community tour
  styles/                 tokens.css, base.css, sections.css
  scripts/
    app.js                wiring: state, routing, scroll choreography (GSAP ScrollTrigger + Lenis), story dialog, gallery, copy
    state.js              single state model (topic, section, scene focus, story)
    router.js             hash routes: #/chapter/<topic>, #/story/<id>, #/people and others
    explore.js            the 3D community page: scene, tour, story dialog
    story-dialog.js       shared toast, copy actions, story dialog and motion toggle
    clipboard.js          copy with graceful fallback
    content/stories.js    stories, sources, principles (edit content here)
    content/render.js     HTML for posters, flythrough captions, story detail, gallery, promises, numbers, sources
    scene/community.js    procedural community geometry and materials
    scene/threads.js      red and amber connection threads
    scene/scene.js        renderer, lighting, camera choreography, labels, interaction
  public/media/           web-ready images, films and posters
media-src/                Higgsfield originals, prompts and asset-manifest.json
scripts/build_media.py    rebuilds public/media from the originals
tests/                    unit and end-to-end tests
```

To edit a story, change `impact/scripts/content/stories.js`. Rendering code does not need to change. `npm test` checks that every story cites registered sources, that every metric carries its scope and period, and that every media file exists.

## Deploy

The build is fully static and self-contained: Three.js, GSAP, fonts, images and films are bundled and served from the same host. No CDN, analytics or third-party runtime calls. Asset paths and story links are relative, so the same `dist/` works at a repository subpath or a host root.

- **GitHub Pages, simplest:** a ready-built copy lives in `docs/`. In the repository settings, open Pages, choose "Deploy from a branch", pick the branch and the `/docs` folder. Rebuild it after any change with `npm run build:docs` and commit the result.
- **GitHub Pages, automated:** `.github/workflows/pages.yml` builds and deploys on pushes to `main` when Pages source is set to "GitHub Actions". Either way the site lives at `https://<owner>.github.io/Equinix-Community-Impact/`.
- **Cloudflare Pages:** build command `npm run build`, output directory `dist`, Node 22 (`NODE_VERSION=22`). No redirects needed because routes use the URL hash.
- **Internal hosting:** copy `dist/` to any static web server.

Note: this repository is currently public. The site sets `noindex`, but anyone with the URL can view a Pages deployment. Choose the hosting and access policy before publishing.

## Third-party code and assets

- Three.js 0.186.1 (MIT), GSAP 3.15.0 with ScrollTrigger (GreenSock standard license, free for this use), Lenis 1.3.27 (MIT), Inter Tight and Fraunces via Fontsource (SIL Open Font License).
- Interface patterns adapted from 21st.dev references, rewritten in plain JavaScript and CSS. See HANDOVER.md for the list. 
