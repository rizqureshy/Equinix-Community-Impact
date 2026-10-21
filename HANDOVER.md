# Handover: Infrastructure for human possibility

Prepared 21 October 2026 for Rizwan Qureshy. First complete version, ready for review.

## What was built

A single-page experience in `impact/`, built with Vite, Three.js (WebGLRenderer) and GSAP, with content pre-rendered into the HTML at build time.

- **Opening:** "Infrastructure for human possibility." over a live 3D architectural model of a community. Three human images beside the headline lead into their chapters. The two actions go to the explorer and to the first story.
- **Community explorer:** five topics (Care, Discovery, Opportunity, Community, Responsible growth). Each one moves the camera to its place, draws its red thread from the Equinix data center and shows a sourced preview. The labelled HTML buttons in the scene do the same, and so does clicking a building.
- **Five chapters:** each follows the same beats: a human moment, a reason to care, the connection, the contributions (Equinix and partners, side by side), a scoped figure, then the full story. The scene follows the chapter in view.
- **Story detail:** a modal dialog (side panel on desktop, full screen on mobile) with context, ambition, contributions, outcome, an attributed quote, "The Equinix connection", a conversation starter, copy summary and copy link actions, and sources.
- **Five promises:** the U.S. Community Principles, one proof point each, framing Equinix as part of the community.
- **People:** roles, a published leadership quote, Kayla's path from a tour to a technician role, and an illustrative film.
- **Share:** the collection of 11 stories with working topic and relationship filters, an empty state, and copy actions.
- **Sources:** grouped as Achieved, Happening now and Committed, plus a full source directory.

## Creative direction

**Visual thesis:** an architect's model of a town on a warm oak plinth, in soft window light. Calm, crafted, human-scaled. A single fine red thread is the only saturated colour; recovered heat is amber.

**Opening studies** (reviewable at `/studies.html`):

| Study | Idea | Verdict |
| --- | --- | --- |
| A. Living model with human windows | Model fills the stage; headline in the calm space; three human images lead in | **Chosen.** Clearest, keeps people first without competing with the scene |
| B. Faces first | Large care-team portrait beside the headline | Most emotional, but narrows the opening to one topic and competes with the model |
| C. Thread first | Centred type with a red thread dropping into the model | Elegant but abstract; no people on arrival |

**Choices worth noting**

- The headline is kept as briefed.
- The Community chapter is built on the U.S. Community Principles (Minooka, grid costs, local procurement), following your steer that Equinix is part of the community it serves. Digital inclusion and volunteering are its supporting stories.
- Fraunces (serif) for headlines and Inter Tight for text, bundled locally, until approved Equinix type is supplied.
- Equinix red is approximated as `#e31c25` (lines and accents) and `#b8121b` (text, 5.9:1 contrast). Both are pending brand review. The wordmark is plain text, and no logo is drawn.

## Tool contributions

### 21st.dev (connector, paid tier, AI generation available)

Five searches (editorial hero, chapter navigation, accessible drawer, segmented tabs, image reveal) and five component retrievals. All are React; the behaviour was rewritten in plain JavaScript and CSS, with no React added.

| Reference | Used for |
| --- | --- |
| Editorial Image Hero (felipemenezes098/hero-07) | Hero proportions: tagline, serif headline, short copy, quiet second action |
| Kokonut UI Scroll Index (kokonutd, MIT) | The left "thread rail": ticks per section, a progress line, a label flash on change |
| Drawer (ddoemonn/drawer) | Story dialog behaviour: scrim, focus into the panel, Escape, focus restore, scroll lock (native `<dialog>`) |
| Segmented Tabs (micka_design/tabs-base) | Explorer tabs with a sliding indicator, one tab stop, arrow keys select |
| Mask Reveal (balick/mask-reveal) | Chapter images uncover once in view; switched off with motion off |

21st.dev hosted generation was not used, so no 21st.dev credits were spent. The licence for the four references without stated terms (hero, drawer, tabs, mask reveal) should be confirmed if any of their code is reused verbatim later. Today only ideas and behaviour were adapted.

### Higgsfield (CLI, Plus plan, Private workspace)

The connector in this session could only read the account. Generation ran through the Higgsfield CLI after a browser sign-in.

| Batch | Model | Purpose | Credits |
| --- | --- | --- | --- |
| 2 stills | Seedream 5.0 Pro, Nano Banana 2 | Opening composition study (Seedream selected for light and materials) | 4.5 |
| 7 stills | Seedream 5.0 Pro | Human moments per chapter, people, one regenerated for age accuracy | 17.5 |
| 3 films, 5 s | Kling 3.0 Pro, image to video | Community model drift, pool, engineer walk | 26.25 |
| 1 still | Nano Banana 2 | Neighbourhood path for Community (two Seedream attempts failed on the service, no charge) | 2 |
| **Total** | | | **50.25 of the 400 budget** |

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
- **Browser checks (`npm run test:e2e`):** 35 pass in headless Chromium with software WebGL.
  - **Network and errors:** no requests leave the host, no missing assets, no JavaScript errors.
  - **Loading:** the headline is usable before the scene loads.
  - **Scene and explorer:** labels select destinations, and arrow keys work in the explorer.
  - **Stories:** a story opens with its URL, focus moves into it, Escape and Back close it with focus restored, and Forward reopens it. Direct links work.
  - **Copy and filters:** copy works with a fallback when the clipboard is denied. Filters work, with an empty state and reset.
  - **Accessibility and layout:** controls are at least 44 px. Reduced motion shows connections instantly, and the motion control works. Mobile has no sideways scroll, a compact scene and a full-width story. Without WebGL the illustration is shown and controls still work.
- **Screenshots inspected:**
  - desktop at 1440 px: opening, explorer, chapters, open story, principles, people, share, sources, no-WebGL fallback
  - mobile at 390 px: opening, chapter, open story
- **Colour contrast:** all text tokens are at least 5.0:1 against their backgrounds.

**Not yet checked**

- **Real-GPU performance:** LCP, CLS and frame rate on real hardware were not measured. Headless software rendering is not representative. The scene is lazy-loaded after first paint, shadows render once, pixel ratio is capped at 1.5 on desktop and 1 on small or touch screens, and the scene pauses when offscreen or the tab is hidden.
- **Screen readers:** not tested with VoiceOver, NVDA or JAWS.
- **Tablet:** the 768 to 1024 px range was not screenshot-reviewed.
- **Other browsers:** Safari and Firefox not checked.

## Known limitations and next steps

- **Brand assets:** replace the placeholder wordmark, fonts and red with approved Equinix assets when supplied (`styles/tokens.css`).
- **Documentary media:** approved photography of real people and facilities would strengthen every chapter. The page labels all current imagery as illustrative.
- **Scene architecture:** buildings are procedural primitives. A modelled data center would add character.
- **Asset sizes:** the 3D chunk is 660 KB (179 KB gzipped) and loads after the page is usable.
- **Higgsfield access:** the CLI sign-in lived in this session's container. Future sessions need to sign in again.
- **Repository visibility:** the repository is public. Uploaded PDFs and the sales slides are kept out of git (`media-src/sources/` is ignored). Decide hosting and access before enabling Pages.
