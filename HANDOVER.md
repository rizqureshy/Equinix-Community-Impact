# Handover: Infrastructure for human possibility

Prepared 21 October 2026 for Rizwan Qureshy. Third version: a complete redesign on the branch `claude/community-redesign`, replacing the dark cinematic page, the separate 3D explorer and the fly-through film. Updated the same day with your edits: the community became an independent explorer with a playing tour and music, the promises gained photographs, the numbers were reset, and the story dialog scrolls with the wheel.

## What was built

A single page in `impact/`, built with Vite, Three.js, GSAP ScrollTrigger and Lenis. Light, calm and Apple-like: generous white space, Inter Tight, one saturated colour (Equinix red) for the thread and small accents, amber for recovered heat.

- **Hero:** "Infrastructure for human possibility." rises into place over white, with the lede and two actions. Below it the community appears as a framed product shot that opens to full bleed as you scroll.
- **The community, yours to explore:** a real 3D model of seven buildings (hospital, research centre, learning centre, homes, high street shops, aquatic centre, Equinix data center) on a white plinth, framed as a product shot in the flow of the page. It no longer depends on scrolling. Six stops are chosen with the dots, the previous and next arrows, the arrow keys, a label or a click on a building; the camera travels to each with a slow, cinematic ease, the model shifts aside and a glass card slides in on the alternating side with the chapter number, the human moment, the lead story summary and a button that opens the full story. The thread for that place draws in red, the aquatic centre's in amber, and at the data center every thread shows at once. The cursor adds a gentle parallax. From the overview, three headline figures sit as quiet pills.
- **Play the tour:** the Play control (in the bar and on the opening card) visits the stops one after another, about nine seconds each, with a slow orbit at each stop and a calm corporate theme (piano, strings, soft pad) that fades in and out. Any choice pauses the tour; so does scrolling away or hiding the tab. A mute control is remembered between visits. Music only starts from a click, never on its own.
- **The technique** follows the reference video ("Stay a little longer"): a live 3D model that reacts to cursor and input, reframed per stop, rather than a film. Only the technique was taken; the design is our own.
- **Fallbacks:** a rendered still of the community shows until the model is ready and wherever WebGL is unavailable. With reduced motion or "Pause motion" the camera cuts between stops instead of travelling, there is no orbit, and the controls still work.
- **Statement:** "Equinix is not a visitor in these places…" lights up word by word.
- **Five chapters:** headline, moment, a rounded film, then the story with the connection, the two sets of contributions and the scoped figure, plus links to the other stories in the chapter.
- **In numbers:** four headline figures that count up, each with scope and source. The prefix and suffix (the $, M and +) sit as smaller red marks so the numerals never overflow, and a short thread draws across each tile as it arrives, carrying a travelling bead (amber for heat).
- **Five promises, as a ledger:** the U.S. Community Principles as a numbered list in large type with the red thread drawing down the gutter; the promise at the reading line opens to its full sentence and lights its node. A sticky panel beside it shows the proof: the kind of evidence, the place, the sentence itself and the source link, set as a record card over a crop of our own community model (rendered from the scene, no credits). Clicking a promise scrolls to it. On narrow screens and without motion it is a plain list with every proof inline. The five photographs made earlier were retired as too generic; they remain in `media-src/promises/`.
- **People:** film, leadership quote, roles and Kayla's path.
- **Story gallery:** 11 cards in a swipeable rail, with filters, an empty state and copy actions.
- **Sources:** Achieved, Happening now, Committed, plus the source directory.
- **Story dialog:** a modal panel (full screen on mobile) with focus handling, copy actions and sources. The mouse wheel scrolls the open story while the page behind stays put.

## Creative direction

**Visual thesis:** an architect's white model of a town, lit like a product photograph, with the red thread as the only saturated colour. The page around it is quiet so the model and the stories carry the attention.

**Choices worth noting**

- You chose the Apple-like mood, real generated 3D models, the "travels with you" scroll behaviour and a budget of up to 250 further credits.
- The six-stop order follows the chapters (care, discovery, opportunity, community, resources) and ends on the data center, where every thread begins.
- The headline is kept as briefed.
- The data center model reads as a calm two-storey building with rooftop plant, in keeping with the scale-model style, rather than an industrial hall. A more recognisable data center would need a new concept image and conversion (about 12 credits).
- Equinix red is approximated as `#e31c25`. The wordmark is plain text, and no logo is drawn. Replace with approved brand assets when supplied.
- **Motion:** scroll choreography only runs with motion on. The model pauses when it is off screen or the tab is hidden.

## Tool contributions

### 21st.dev (connector, paid tier)

Searches this round covered scroll-driven 3D showcases and sticky feature sections. Two references were retrieved and read; their behaviour was adapted in plain JavaScript, no React or component code was copied.

| Reference | Used for |
| --- | --- |
| Sticky Content Wrapper (hyperiux) | The stepped, snapping pinned section: stop positions, settle-on-rest, content entering beside the subject |
| Sticky Scroll Reveal (aceternity) | Nearest-breakpoint step detection |
| Features With Panel (scrollxui), Scroll animated timeline (ibrandify), Editorial service list (ibrandify) | The promises ledger: sticky proof panel, drawn thread, numbered editorial rows (searched this round; behaviour rebuilt, no code copied) |
| Earlier rounds (Scroll word reveal, Horizontal scroll gallery, Drawer) | Statement, story rail and dialog behaviour carried over from version two |

### Higgsfield (CLI, Plus plan, Private workspace)

Generation ran through the Higgsfield CLI after a browser sign-in (the connector can only read the account).

| Batch | Model | Purpose | Credits |
| --- | --- | --- | --- |
| 7 stills | GPT Image 2.5 (high, 1:1, 2k) | Building concept images in one shared style (`media-src/city/style.txt`) | 19.25 |
| 7 models | Tripo H3.1 image to 3D (detailed geometry and texture, PBR) | The seven buildings | 63 |
| 7 models, unused | Tripo H3.1 | Duplicates: the first hospital job's wait hung past its limit and its id was lost; a batch of five creates reported nothing and was re-run, but had in fact been accepted. The results exist in the workspace and were not downloaded | 63 |
| 1 track, 120 s | Sonilo Music | The calm corporate theme for the tour (`media-src/audio/community-theme.txt`), normalised and faded for the web as Opus and MP3 | 3.75 |
| 5 stills | GPT Image 2.5 (high, 3:2) | Soft photographs for the five promises in one shared style (`media-src/promises/style.txt`); retired the same day in favour of crops of the model, kept in reserve | 13.75 |
| **This round** | | | **162.75 of the 250 allowed** (916 → 753.25 credits) |

Earlier rounds spent 212 credits on the stills and films that remain in use (chapter and people films, story images). Every output is recorded in `media-src/asset-manifest.json` (the `city` section for this round) with its generation id, model, settings, prompt file, status and use.

**The building pipeline:** concept image → Tripo image-to-3D (about 1.9 million triangles, 65 MB each) → `scripts/build_city.sh` (meshopt geometry at 3% of the triangles, WebP textures at 1024 px) → about 0.8 MB per building, 5.4 MB for the town. The models load lazily when the community nears the viewport. `tests/tools/glb-view.mjs` renders any model from four angles for review.

Every generated image, film and model is captioned as illustrative and AI generated. None depicts a named person, customer or facility.

## Evidence

Content and sources are unchanged from version two; they were checked on 21 October 2026. The registry is in `impact/scripts/content/stories.js`.

**Editorial review items** (carried over)

1. **Pathways to Tech figures disagree across sources** (1,300+ since launch; 1,000+ in 2025; 1,800+ in 2025; nearly 2,000 in the two-year pilot). The page uses "nearly 2,000 in the two-year pilot". Please confirm the preferred figure.
2. **Fuel cell equivalence differs:** 103,000 cars against 96,000. Neither is used.
3. **PA10 technical details** come from Data Center Knowledge quoting Equinix's heat export lead and are labelled as secondary reporting.
4. **Harrison.ai:** the blog's diagnostic accuracy claim was deliberately left out.
5. **Named people and quotes** are from published Equinix or press material, with attribution; confirm approval for internal reuse.
6. **Blocked link checks:** three blog.equinix.com links return 403 to automated checks and were confirmed through your PDF captures.
7. **Broken video link:** the old Children's Cancer Institute video URL returns 404 and is not linked.

**Distinctions kept throughout:** relationship tags on every story; Achieved, Happening now and Committed in the sources; renewable energy coverage keeps its published definition; no em dashes in page copy; no "powering hospitals".

## Validation

**Checks run**

- **Unit tests (`npm test`):** 17 pass (content model, routing including the old link aliases, state, sharing).
- **Browser checks (`npm run test:e2e`):** 62 pass in headless Chromium with software WebGL.
  - **Network and errors:** no requests leave the host, no missing assets, no JavaScript errors.
  - **Community:** the headline is usable on arrival; the explorer sits in the page flow with its own controls; the model renders; the still is in place before it; moving to a stop frames its place, card and label; dots, arrows, labels and the keyboard move between stops; previous from the first stop returns to the overview; the tour starts, moves on and plays music, mute is remembered, and choosing a place pauses it; a story opens from a card with its URL and focus handling; Back and Forward work.
  - **Sections:** chapter and alias routes land where expected; navigation marks the current section; in the promises ledger the row at the reading line shows its proof, the thread draws with the scroll and choosing a promise moves to it; on phones every proof shows inline; copy works with a fallback when the clipboard is denied; the wheel scrolls the open story; gallery filters work with an empty state and reset; controls are at least 44 px; the copy has no em dashes.
  - **Reduced motion:** no smooth scrolling, films paused, stops still change by control, the toggle works.
  - **Mobile:** no sideways scroll, the journey card fits the screen, stories open full width.
  - **No WebGL:** the still is shown and the controls still work.
- **Screenshots inspected:** hero, the explorer at the overview and several stops, numbers and the promises ledger at two positions at 1440 px; the explorer, a stop and the promises at 390 px; each building from four angles before and after compression; the five promise photographs as a contact sheet.

**Not yet checked**

- **Real-GPU performance:** frame rate, LCP and CLS on real hardware. Software rendering here is not representative. Mitigations: lazy model load, pixel ratio capped at 1.75 (1 on low-core devices), rendering only while visible and while something moves, 5.4 MB of models in total. The music (about 1 MB as Opus, 2 MB as MP3) loads only when the tour is played.
- **Audio on real devices:** the theme's level and loop were checked by ear only through the waveform; listen on speakers and headphones before sharing.
- **Screen readers, Safari, Firefox, tablet widths.**

## Known limitations and next steps

- **Brand assets:** replace the placeholder wordmark, type and red (`styles/tokens.css`).
- **Documentary media:** approved photography of real people and facilities would strengthen every chapter.
- **Data center character:** see Creative direction; a new concept would give a more recognisable building.
- **Model fidelity:** buildings are simplified to about 56,000 triangles each. `scripts/build_city.sh` can raise `--simplify-ratio` for more detail at a larger download; the raw 65 MB models are re-downloadable from each `resultUrl` in the manifest.
- **Mobile hero type:** at phone width the headline wraps to four lines; a shorter second line or a smaller size would tidy it.
- **Higgsfield access:** the CLI sign-in lived in this session's container. Future sessions need to sign in again.
- **Repository visibility:** the repository is public. Uploaded PDFs and the sales slides are kept out of git (`media-src/sources/` is ignored), as are the concept renders and raw models. Decide hosting and access before enabling Pages.
