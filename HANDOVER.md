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
- **Five promises:** a numbered list in large type beside a sticky panel. The promise at the reading line is current; its panel shows a tall photograph with the proof set large over the quiet sky at the top: a headline in a few words, the proof sentence, the kind of evidence, the place and the source. Clicking a promise scrolls to it. The five photographs were generated for this page in one editorial documentary style (low October sun, a small red detail in each) and are captioned as illustrative. On narrow screens and without motion the panel gives way to each promise carrying its photograph and proof inline. The thread that an earlier version drew down the list is gone.
- **People:** film, leadership quote, roles and Kayla's path.
- **Training and resources:** a library in the making. Downloadable assets (story deck, five-promises one-pager, the impact story PDFs, an image kit) sit as labelled placeholders until each file is approved, with the Sustainability Report as the one live link. Four role-play scenarios on how to talk about Equinix community impact (a customer, a neighbour, a student, a journalist), each tied to a story on the page and each a placeholder for its Yoodli exercise. An Engage card leads to the Engage page.
- **Engage page (`engage.html`):** the Viva Engage community embedded from Microsoft with the embed code you supplied, with the same header and footer, a short introduction and a fallback link. It is the one place the site reaches outside its own host; sign-in is Microsoft's. Viva Engage only allows itself to be framed from an https page, so the feed shows on GitHub Pages or any https host, and is refused on a plain http preview such as `npm run preview`.
- **Story gallery:** 11 cards in a swipeable rail, with filters, an empty state and copy actions.
- **Sources:** Achieved, Happening now, Committed, plus the source directory.
- **Story dialog:** a modal panel (full screen on mobile) with focus handling, copy actions and sources. The mouse wheel scrolls the open story while the page behind stays put.

## Stepping inside (branch `claude/enter-the-story`)

Research, routes and costs are in `design/enter-the-story.md`. What was built:

- **Enter.** "Step inside" on each stop's card, or a click on any building or its name, glides the live camera to the building's door (a clock-timed 2.6 s approach, so it is the same on slow machines), darkens the page, and cuts to the dive film. The film's first frame is a render of our own model from that exact door view, so the join is soft; over 8 seconds the model dissolves into the real room.
- **Inside.** The room is a 360 panorama (FLUX 3 Image, 2:1, one per stop) on a sphere you can look around in by dragging or with the arrow keys, with a slow drift while you rest. The story arrives as captions placed in the room: the moment, a figure with its scope and source, the Equinix connection, then a card with the full story and Leave. Captions advance on their own every 7 seconds or on Next.
- **Out.** Leave, Escape or the end card plays an exit film back to the door view and the live camera returns to the stop. Where people appear in the room (hospital, lab, training floor, pool, data hall) the exit is its own forward film from Kling, room still to door view, so nobody walks backwards; the homes path, which has no people, uses the dive played in reverse. The story dialog can open from the end card.
- **Rooms:** the hospital reading room, the children's cancer research lab, the data center training floor with the tour group, the Minooka path by the site, the Saint-Denis pool hall, the data hall with recovered-heat pipework. Same light and palette as the promise photographs; all captioned as illustrative.
- **Fallbacks:** without WebGL the room is a still with the captions; with motion off the approach is instant and the films are skipped; on phones the captions sit at the bottom and the room is draggable. Films and panoramas load only when a room is entered.
- **Honest limits:** you cannot walk; you stand in one spot and look. The dive films are a dissolve from the model into the room rather than a true pass through the door (Kling joins the two frames its own way). Walkable rooms need Gaussian-splat worlds from tools outside Higgsfield; noted in the proposal for a later round.

Credits this round: six panoramas at 3, six dive films at 10, five forward exit films at 10, 128 of the 250 allowed. Files: `impact/scripts/room.js`, `impact/styles/room.css`, `impact/scripts/content/rooms.js` (captions), `DOORS` and `approach` in `scene/city.js`, `scripts/pano_tools.py`, `scripts/build_rooms.sh`, `tests/tools/door-views.mjs`.

## The red fabric (branch `claude/red-fabric`)

An experiment you asked for, on its own branch so it can be compared and merged or dropped.

- A length of red satin flies in a slow wind behind the whole page. The cloth is built along a sweeping centreline that rises, dives and turns through space, so the whole length folds over like silk rather than rippling like a ribbon; its width rolls about that line so both faces show, the edges cup toward the face, and small ripples ride on top with a gust that swells and fades. It is sheer: translucent at half opacity so folds that overlap read denser, like chiffon, with the width swelling and narrowing along the length and each edge wandering and fluttering on its own so the silhouette is never a parallel band. Lit softly in the logo red (neutral tone mapping so it stays red rather than salmon) in its own transparent canvas fixed behind the content, and it sways within the viewport as the page scrolls.
- **Toggle:** "Fabric" in the header, remembered in the browser, so you can compare with and without. The cloth fades in once it is ready and fades out when switched off.
- **Legibility:** sections with their own background cover it; where it passes behind the hero and the statement, a soft white veil sits under the text.
- **Motion off:** the cloth holds its pose. **Phones:** off, to save the battery and the small screen.
- It loads after first paint and only when wanted, and stops rendering when the tab is hidden or the toggle is off. It is a second WebGL context beside the community model; on weak machines that is the first thing to switch off.

Files: `impact/scripts/fabric.js`, `impact/styles/fabric.css`, the layer and toggle in `index.html`, wiring in `app.js`.

## Sunlight (branch `claude/season-weather`)

Built on top of the redesign as its own branch. A full season-and-weather layer (leaves, rain, winter, spring, a footer switch) was built first and then cut back at your request to the one thing that worked: the light.

- **A diffused low autumn sun** sits high and to the right of the page, blended into whatever is beneath it (`mix-blend-mode: multiply`), and drifts a few pixels with the cursor and the scroll. It warms the white canvas and the cards without colouring the text.
- **The model is lit the same way:** a lower, warmer key light with longer, softer shadows on the plinth.
- **Motion off and reduced motion:** the light stays, still.

Files: `impact/scripts/weather.js` (`createSunlight`), `impact/styles/weather.css`, the key light in `scene/city.js`, the layer in `index.html`.

## Creative direction

**Visual thesis:** an architect's white model of a town, lit like a product photograph, with the red thread as the only saturated colour. The page around it is quiet so the model and the stories carry the attention.

**Choices worth noting**

- You chose the Apple-like mood, real generated 3D models, the "travels with you" scroll behaviour and a budget of up to 250 further credits.
- The six-stop order follows the chapters (care, discovery, opportunity, community, resources) and ends on the data center, where every thread begins.
- The headline is kept as briefed.
- The data center model reads as a calm two-storey building with rooftop plant, in keeping with the scale-model style, rather than an industrial hall. A more recognisable data center would need a new concept image and conversion (about 12 credits).
- The red is the Equinix logo red `#E91C24` from the supplied brand files, used for the thread, the numbers' marks and small accents. The header carries the Equinix logo; the footer the vertical lockup.
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
| 5 stills | GPT Image 2.5 (high, 3:2) | Soft photographs for the five promises in one shared style (`media-src/promises/style.txt`); retired, kept in reserve | 13.75 |
| 5 stills | GPT Image 2.5 (high, 2:3) | Editorial documentary photographs beside the five promises (`media-src/promises/style-kept.txt`), in use | 13.75 |
| **This round** | | | **176.5 of the 250 allowed** (916 → 739.5 credits) |

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
  - **Sunlight and fabric:** the light layer is in place, blended, and takes no clicks; the fabric flies behind the page, can be switched off and remembered, and stays off on phones.
  - **Stepping inside:** entering the hospital flies to the door, through the film and into the room with the first caption; the room names itself and focus lands on Leave; captions carry figure, scope and source; the end card offers the full story; leaving returns to the stop with focus on the button; the room fits a phone; without WebGL the room is a still.
  - **Sections:** chapter and alias routes land where expected; navigation marks the current section; in the promises the row at the reading line shows its proof over a large photograph and choosing a promise moves to it; on phones every promise shows its photograph and proof inline; the training route lands, its placeholders and live link are labelled, and the Engage page opens with the Viva Engage feed embedded and reaches nothing else; copy works with a fallback when the clipboard is denied; the wheel scrolls the open story; gallery filters work with an empty state and reset; controls are at least 44 px; the copy has no em dashes.
  - **Reduced motion:** no smooth scrolling, films paused, stops still change by control, the toggle works.
  - **Mobile:** no sideways scroll, the journey card fits the screen, stories open full width.
  - **No WebGL:** the still is shown and the controls still work.
- **Screenshots inspected:** hero, the explorer at the overview and several stops, numbers and the promises at two positions at 1440 px; the explorer, a stop and the promises at 390 px; each building from four angles before and after compression; the five promise photographs as a contact sheet.

**Not yet checked**

- **Real-GPU performance:** frame rate, LCP and CLS on real hardware. Software rendering here is not representative. Mitigations: lazy model load, pixel ratio capped at 1.75 (1 on low-core devices), rendering only while visible and while something moves, 5.4 MB of models in total. The music (about 1 MB as Opus, 2 MB as MP3) loads only when the tour is played.
- **Audio on real devices:** the theme's level and loop were checked by ear only through the waveform; listen on speakers and headphones before sharing.
- **Screen readers, Safari, Firefox, tablet widths.**

## Known limitations and next steps

- **Brand assets:** the supplied Equinix logos are in `impact/public/brand/` (vertical lockup in the footer, fortress mark as the favicon). The slim header uses a horizontal arrangement assembled from the supplied vertical file (mark left, wordmark right, shared baseline); replace it with the official horizontal lockup if one exists. The red is now the logo red `#E91C24`. The type remains a placeholder until brand type is supplied.
- **Documentary media:** approved photography of real people and facilities would strengthen every chapter.
- **Data center character:** see Creative direction; a new concept would give a more recognisable building.
- **Model fidelity:** buildings are simplified to about 56,000 triangles each. `scripts/build_city.sh` can raise `--simplify-ratio` for more detail at a larger download; the raw 65 MB models are re-downloadable from each `resultUrl` in the manifest.
- **Mobile hero type:** at phone width the headline wraps to four lines; a shorter second line or a smaller size would tidy it.
- **Higgsfield access:** the CLI sign-in lived in this session's container. Future sessions need to sign in again.
- **Repository visibility:** the repository is public. Uploaded PDFs and the sales slides are kept out of git (`media-src/sources/` is ignored), as are the concept renders and raw models. Decide hosting and access before enabling Pages.
