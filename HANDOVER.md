# Handover: Infrastructure for human possibility

Prepared 21 October 2026 for Rizwan Qureshy. Third version: a complete redesign on the branch `claude/community-redesign`, replacing the dark cinematic page, the separate 3D explorer and the fly-through film.

## What was built

A single page in `impact/`, built with Vite, Three.js, GSAP ScrollTrigger and Lenis. Light, calm and Apple-like: generous white space, Inter Tight, one saturated colour (Equinix red) for the thread and small accents, amber for recovered heat.

- **Hero:** "Infrastructure for human possibility." rises into place over white, with the lede and two actions. Below it the community appears as a framed product shot that opens to full bleed as you scroll.
- **The community, travelling with you:** a real 3D model of seven buildings (hospital, research centre, learning centre, homes, high street shops, aquatic centre, Equinix data center) on a white plinth. The section pins for about seven screens. The camera travels between six stops (the five chapter places, then the data center); at each stop the model shifts aside and a glass card slides in on the alternating side with the chapter number, the human moment, the lead story summary and a button that opens the full story. The thread for that place draws in red, the aquatic centre's in amber, and at the data center every thread shows at once. Labels float above each building; clicking a label, a building or a dot travels to that stop. The scroll settles on the nearest stop when it rests. The cursor adds a gentle parallax.
- **The technique** follows the reference video ("Stay a little longer"): a live 3D model that reacts to cursor and scroll, reframed per section, rather than a film. Only the technique was taken; the design is our own.
- **Fallbacks:** a rendered still of the community shows until the model is ready and wherever WebGL is unavailable. With reduced motion or "Pause motion" there is no pinning or smooth scrolling; the dots and labels still change the stop and the model shows connections instantly.
- **Statement:** "Equinix is not a visitor in these places…" lights up word by word.
- **Five chapters:** headline, moment, a rounded film, then the story with the connection, the two sets of contributions and the scoped figure, plus links to the other stories in the chapter.
- **In numbers:** four headline figures that count up, each with scope and source.
- **Five promises:** the U.S. Community Principles as a card rail.
- **People:** film, leadership quote, roles and Kayla's path.
- **Story gallery:** 11 cards in a swipeable rail, with filters, an empty state and copy actions.
- **Sources:** Achieved, Happening now, Committed, plus the source directory.
- **Story dialog:** a modal panel (full screen on mobile) with focus handling, copy actions and sources.

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
| Earlier rounds (Scroll word reveal, Horizontal scroll gallery, Drawer) | Statement, story rail and dialog behaviour carried over from version two |

### Higgsfield (CLI, Plus plan, Private workspace)

Generation ran through the Higgsfield CLI after a browser sign-in (the connector can only read the account).

| Batch | Model | Purpose | Credits |
| --- | --- | --- | --- |
| 7 stills | GPT Image 2.5 (high, 1:1, 2k) | Building concept images in one shared style (`media-src/city/style.txt`) | 19.25 |
| 7 models | Tripo H3.1 image to 3D (detailed geometry and texture, PBR) | The seven buildings | 63 |
| 7 models, unused | Tripo H3.1 | Duplicates: the first hospital job's wait hung past its limit and its id was lost; a batch of five creates reported nothing and was re-run, but had in fact been accepted. The results exist in the workspace and were not downloaded | 63 |
| **This round** | | | **145.25 of the 250 allowed** (916 → 770.75 credits) |

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
- **Browser checks (`npm run test:e2e`):** 54 pass in headless Chromium with software WebGL.
  - **Network and errors:** no requests leave the host, no missing assets, no JavaScript errors.
  - **Community:** the headline is usable on arrival; the section pins for a long scroll; the model renders; the still is in place before it; scrolling to a stop frames its place, card and label; dots and labels move between stops; a story opens from a card with its URL and focus handling; Back and Forward work.
  - **Sections:** chapter and alias routes land where expected; navigation marks the current section; copy works with a fallback when the clipboard is denied; gallery filters work with an empty state and reset; controls are at least 44 px; the copy has no em dashes.
  - **Reduced motion:** no smooth scrolling or pinning, films paused, stops still change by control, the toggle works.
  - **Mobile:** no sideways scroll, the journey card fits the screen, stories open full width.
  - **No WebGL:** the still is shown and the controls still work.
- **Screenshots inspected:** hero, product-shot frame, overview, several stops, the data center stop, at 1440 px; hero and a stop at 390 px; each building from four angles before and after compression.

**Not yet checked**

- **Real-GPU performance:** frame rate, LCP and CLS on real hardware. Software rendering here is not representative. Mitigations: lazy model load, pixel ratio capped at 1.75 (1 on low-core devices), rendering only while visible and while something moves, 5.4 MB of models in total.
- **Screen readers, Safari, Firefox, tablet widths.**

## Known limitations and next steps

- **Brand assets:** replace the placeholder wordmark, type and red (`styles/tokens.css`).
- **Documentary media:** approved photography of real people and facilities would strengthen every chapter.
- **Data center character:** see Creative direction; a new concept would give a more recognisable building.
- **Model fidelity:** buildings are simplified to about 56,000 triangles each. `scripts/build_city.sh` can raise `--simplify-ratio` for more detail at a larger download; the raw 65 MB models are re-downloadable from each `resultUrl` in the manifest.
- **Mobile hero type:** at phone width the headline wraps to four lines; a shorter second line or a smaller size would tidy it.
- **Higgsfield access:** the CLI sign-in lived in this session's container. Future sessions need to sign in again.
- **Repository visibility:** the repository is public. Uploaded PDFs and the sales slides are kept out of git (`media-src/sources/` is ignored), as are the concept renders and raw models. Decide hosting and access before enabling Pages.
