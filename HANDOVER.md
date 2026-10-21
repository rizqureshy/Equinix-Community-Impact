# Handover: Infrastructure for human possibility

Prepared 21 October 2026 for Rizwan Qureshy. Second version: a dark cinematic redesign following your feedback that the first version missed the mark.

## What was built

A single-page experience in `impact/`, built with Vite, Three.js (WebGLRenderer), GSAP ScrollTrigger and Lenis smooth scrolling. Content is pre-rendered into the HTML at build time.

- **Hero:** a full-screen reel of human moments (care, discovery, opportunity, community, swimmers) crossfading behind giant type: "Infrastructure for human *possibility.*" The title rises into place on load and lifts away as you scroll.
- **Scroll-to-expand flythrough:** the 3D community grows from a framed card to full screen as you scroll ("See what / connection makes possible." slides apart). Then the section stays pinned while scrolling flies the camera to each place: hospital, research centre, learning space, homes, aquatic centre, and finally the data center. Each stop draws its glowing red thread (amber for heat) and shows a caption with the human moment and a link to the story. Step controls and in-scene place buttons jump straight to any stop.
- **Statement:** "Equinix is not a visitor in these places…" lights up word by word as you scroll.
- **Five story posters:** each chapter is a full-screen film with a giant title and the human moment. The story panel then scrolls up over the film, carrying the connection, the two sets of contributions, the scoped figure and the story links.
- **In numbers:** four headline figures that count up, each with its scope and a source link.
- **Five promises:** the U.S. Community Principles as cards that stack as you scroll.
- **People:** a full-screen film with the leadership quote, then roles and Kayla's path.
- **Story gallery:** 11 poster cards in a swipeable rail, with working filters, an empty state and copy actions.
- **Sources:** Achieved, Happening now and Committed, plus a source directory you can expand.
- **Story dialog:** a dark side panel (full screen on mobile) with focus handling, copy actions and sources.

## Creative direction

**Visual thesis:** a film premiere for the communities Equinix serves. Deep warm charcoal, full-bleed golden-light films, huge grotesk type with an italic serif accent, and the red thread as the only saturated colour. The 3D model now sits at dusk, with lit windows and glowing threads.

**Choices worth noting**

- You chose the dark cinematic mood and the scroll-driven flythrough.
- The headline is kept as briefed.
- The Community chapter is built on the U.S. Community Principles (Minooka, grid costs, local procurement), following your steer that Equinix is part of the community it serves.
- Inter Tight (display and text) with Fraunces italic for accents, both bundled locally until approved Equinix type is supplied.
- Equinix red is approximated as `#e31c25`, with brighter variants for glow and for small text on dark backgrounds. All are pending brand review. The wordmark is plain text, and no logo is drawn.
- The three light opening studies from version one were retired with that design.
- **Motion:** scroll choreography only runs with motion on. With reduced motion or "Pause motion", nothing is pinned or scroll-jacked, the flythrough becomes a tour you click through, and films stop.

## Tool contributions

### 21st.dev (connector, paid tier, AI generation available)

Searches across two rounds covered heroes, chapter navigation, drawers, tabs, image reveals, scroll-expansion heroes, stacking cards, horizontal and full-bleed scroll galleries, and scroll word reveal. Components were retrieved and their behaviour rebuilt in plain JavaScript and CSS with GSAP; no React was added.

| Reference | Used for |
| --- | --- |
| Scroll media expansion hero (arunachalam/scroll-expansion-hero) | The flythrough opening: the stage grows from a card to full screen while the split title slides apart |
| Scroll Gallery (soralabs/scroll-gallery) | Full-bleed poster chapters with scroll-driven settle and title over film |
| Stacking Cards (danielpetho/stacking-cards) | The five promises stacking and easing back |
| Scroll word reveal (motiondotdev) | The statement lighting up word by word |
| Horizontal scroll gallery (pulkitxm, motiondotdev) | The swipeable story gallery rail |
| Drawer (ddoemonn/drawer) | Story dialog behaviour: scrim, focus, Escape, focus restore, scroll lock |
| Editorial Image Hero, Kokonut Scroll Index, Segmented Tabs, Mask Reveal | Used in version one; retired in the redesign |

21st.dev hosted generation was not used, so no 21st.dev credits were spent. Only ideas and behaviour were adapted. Confirm reuse terms before copying any component code verbatim.

### Higgsfield (CLI, Plus plan, Private workspace)

The connector in this session could only read the account. Generation ran through the Higgsfield CLI after a browser sign-in.

| Batch | Model | Purpose | Credits |
| --- | --- | --- | --- |
| 2 stills | Seedream 5.0 Pro, Nano Banana 2 | Opening composition study (Seedream selected for light and materials) | 4.5 |
| 7 stills | Seedream 5.0 Pro | Human moments per chapter, people, one regenerated for age accuracy | 17.5 |
| 3 films, 5 s | Kling 3.0 Pro, image to video | Community model drift, pool, engineer walk | 26.25 |
| 1 still | Nano Banana 2 | Neighbourhood path for Community (two Seedream attempts failed on the service, no charge) | 2 |
| 4 films, 5 s | Kling 3.0 Pro, image to video | Living posters for Care, Discovery, Opportunity and Community; also the hero reel | 35 |
| **Total** | | | **85.25 of the 400 budget** |

Every output is recorded in `media-src/asset-manifest.json` with its generation id, model, settings, prompt file, status and use. Web versions (WebP 640 and 1200, H.264 and VP9 films with posters) are in `impact/public/media/` and rebuilt by `scripts/build_media.py`.

**Rejected outputs:**

- Study A-nb2: contained a text label.
- The first opportunity still: the students looked younger than 14.
- `clip-community`: kept in reserve, not placed.

Every generated image and film is captioned as illustrative and AI generated. None depicts a named person, customer or facility.

## Evidence

Sources were checked on 21 October 2026. Your uploaded PDFs were used to confirm blog posts that block automated access. The registry is in `impact/scripts/content/stories.js`.

**Editorial review items**

1. **Pathways to Tech figures disagree across sources.**
   - 1,300+ students across 24 locations since launch (press release, August 2026)
   - 1,000+ students in 32 locations in 2025 (2025 Sustainability Report)
   - 1,800+ students across 32 locations in 2025 (Community Principles)
   - nearly 2,000 students in the two-year pilot (report, blog, equinixtogether)

   The page uses "nearly 2,000 in the two-year pilot". Please confirm the preferred figure.
2. **Fuel cell equivalence differs:** 103,000 cars (equinixtogether article) against 96,000 (Community Principles page). Neither is used on the page.
3. **PA10 technical details** (28°C, 65°C, 15 years free of charge) come from Data Center Knowledge quoting Equinix's heat export lead. They are labelled as secondary reporting. The "1,000+ homes" figure is from the Equinix blog.
4. **Harrison.ai figures** are as reported on the Equinix blog. The blog's diagnostic accuracy claim was deliberately left out, as a clinical outcome that belongs to Harrison.ai.
5. **Named people and quotes:**
   - The quoted people (Scott Crawford, Emilio Caspanello, Noah Nkonge, Peter Ronson, Arquelle Shaw, Raouf Abdel, Brandi Galvin Morandi, Holly Byrne Nugent) are all quoted from published Equinix or press material, with attribution.
   - Kayla's story is from the Equinix Foundation Pathways page.
   - Confirm all of these are approved for internal reuse.
6. **Blocked link checks:** the three blog.equinix.com links return 403 to automated checks. They were confirmed through your PDF captures, and every other link returned 200.
7. **Broken video link:** the old Children's Cancer Institute video URL returns 404, so it is not linked. The current customer story is used instead.

**Distinctions kept throughout:**

- Each story is tagged as "Direct Equinix action", "Infrastructure that enables customer work" or "Community partnership".
- The sources section separates Achieved, Happening now and Committed.
- Renewable energy coverage keeps its published definition.

## Validation

**Checks run**

- **Unit tests (`npm test`):** 17 pass.
  - Content model: required fields, registered sources, metric scope, no em dashes, media files present, no "powering hospitals".
  - Routing, state and sharing.
- **Browser checks (`npm run test:e2e`):** 41 pass in headless Chromium with software WebGL.
  - **Network and errors:** no requests leave the host, no missing assets, no JavaScript errors.
  - **Loading:** the headline is usable before the scene loads.
  - **Scene and tour:** explore routes fly to the right place and caption, step controls and in-scene place buttons move the tour, and chapter routes land on their poster. Smooth scrolling is active with motion on.
  - **Stories:** a story opens from the tour with its URL, focus moves into it, Escape and Back close it with focus restored, and Forward reopens it. Direct links work.
  - **Copy and filters:** copy works with a fallback when the clipboard is denied. Gallery filters work, with an empty state and reset.
  - **Accessibility and layout:** buttons are at least 44 px; place labels are 34 px with a 46 px hit area. Reduced motion turns off smooth scrolling, pinning and looping effects, shows connections instantly, and the tour still works by click. Mobile has no sideways scroll, the tour caption fits the screen, and stories open full width. Without WebGL the illustration is shown and controls still work.
- **Screenshots inspected:** a full scroll tour at 1440 px (hero, expansion, each tour stop, statement, posters, numbers, promises, people, gallery, sources, footer) and at 390 px (hero, expansion, tour, poster, story panel).
- **Colour contrast:** all text tokens are at least 5.6:1 on their dark backgrounds.

**Not yet checked**

- **Real-GPU performance:** LCP, CLS and frame rate on real hardware were not measured. Headless software rendering is not representative. The scene is lazy-loaded after first paint, shadows render once, pixel ratio is capped at 1.5 on desktop and 1 on small or touch screens, and the scene pauses when offscreen or the tab is hidden.
- **Screen readers:** not tested with VoiceOver, NVDA or JAWS.
- **Tablet:** the 768 to 1024 px range was not screenshot-reviewed.
- **Other browsers:** Safari and Firefox not checked.

## Known limitations and next steps

- **Brand assets:** replace the placeholder wordmark, fonts and red with approved Equinix assets when supplied (`styles/tokens.css`).
- **Documentary media:** approved photography of real people and facilities would strengthen every chapter. The page labels all current imagery as illustrative.
- **Scene architecture:** buildings are procedural primitives. A modelled data center would add character.
- **Asset sizes:** the 3D chunk is about 660 KB (180 KB gzipped) and loads after the page is usable. Seven films total about 5 MB and load only near the viewport.
- **Scroll length:** the pinned tour adds about six screens of scrolling. Step controls and the header let visitors jump past it.
- **Higgsfield access:** the CLI sign-in lived in this session's container. Future sessions need to sign in again.
- **Repository visibility:** the repository is public. Uploaded PDFs and the sales slides are kept out of git (`media-src/sources/` is ignored). Decide hosting and access before enabling Pages.
