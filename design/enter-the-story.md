# Enter the story: going inside the community

Design proposal for branch `claude/enter-the-story`. Research done 22 October 2026. Nothing is built yet; this is for sign-off.

## What you asked for

The community model should be cinematic and detailed, and clicking a building should take you inside: a real-feeling space where the story plays, and then you come back out, the way the YouTube explorations do.

## What is possible today, and what is not

I checked every model Higgsfield offers (image, video and 3D catalogues) and the current state of browser 3D.

| Route | What it gives | Verdict |
| --- | --- | --- |
| **Generated 360 panoramas** (an interior you look around in) | A wide image wrapped on a sphere in Three.js; mouse and touch look around; feels like standing in the room | **Yes.** Higgsfield has no panorama model, but its image models accept 2:1 and 21:9 frames and can be prompted for an equirectangular panorama. Needs one test to confirm seams. 2 to 3 credits a room |
| **Dive-in and come-out films** (the transition from the model into the room) | A short clip whose first frame is a render of our own model at the building's door and whose last frame is the room. Cut from live 3D to film with no visible join | **Yes.** Kling 3.0 Omni (Frames) takes a first and last frame: 10 credits for 8 s silent, pro. Coming out is the same clip played backwards, free |
| **Walkable 3D interiors** (true free movement inside) | A Gaussian splat or mesh of the room | **Not from Higgsfield.** Its image-to-3D models make objects, not rooms; an interior comes out as a diorama. True room splats need World Labs Marble or Tencent HY-World 2.0, both outside our tools and budget, and splats weigh 20 to 60 MB a room. Not for this round |
| **Longer story films inside** | 8 to 15 s cinematic shots of the room with people and the story's moment | **Yes**, same Kling model from the room still; 10 credits a shot |

So the honest shape of it: you fly in on film, you stand in the room and look around, the story plays around you, and you fly back out on film. It is not free walking, and it will not feel like a game; it will feel like a very good documentary that you are standing inside.

## The experience, stop by stop

1. **The model, as now.** You click the hospital (or pick it from the bar).
2. **Approach.** The live camera glides to the hospital entrance, the labels fade, the music softens. This is our Three.js scene, so it is smooth and interactive to the last frame.
3. **Through the door.** At the door we cut to the dive film. Its first frame is a render of the exact view the camera reached, so the cut is invisible; the film carries you through the entrance and into the room over 8 seconds. The page darkens the rest of the site behind it.
4. **Inside.** The film lands on the room and hands over to the panorama: the same view, now a sphere you can look around in. The story arrives as captions and figures placed in the room (the connection, the people, the sourced number), one at a time, with the lead story's "Open the full story" at the end. A quiet room tone plays.
5. **Out.** "Leave" (or Escape, or scrolling) plays the dive film backwards, lands on the model's render frame, and the live camera takes over and pulls back to the overview. The labels and music return.

Each of the six stops has its own room: the hospital reading room where a scan opens; the research lab; the learning centre's training floor with the tour group; the Minooka path from the homes; the aquatic centre pool hall; the data center hall. The rooms share one visual language with the photographs already on the page: low October light, white and oak, one red detail.

## Making the model itself more cinematic

Independent of going inside, three things lift the model:

- Raise the building detail: the models are simplified to about 56,000 triangles each; 150,000 keeps far more window and roof detail for about 2 MB more per building.
- A contact-shadow pass and a touch of depth of field at the stops.
- Approach moves (the glide to the door) designed per building so the door is the natural endpoint.

## Fallbacks

- No WebGL, reduced motion, or phones: the click opens the room panorama as a still with the captions, no film. Everything is still reachable.
- A slow connection: the film is fetched when you reach the stop, not before; the panorama first.

## Cost and time

Credits, Higgsfield, per room: panorama 3, dive film 10, one interior story shot 10, one alternative take allowed 10: about 33. Six rooms: about 200, plus a test spike first.

Budget check: the 250 you allowed for the redesign has 73.5 left. This needs its own allowance. I suggest **a spike of about 25 credits on one room (the hospital) before any batch**, so you see the real thing, then up to **220 for the rest** if you like it.

Build time after the spike: about three days of work for all six rooms, the transitions, fallbacks, checks and docs.

## Questions before I start

1. Spike first on the hospital, then decide? (Recommended.)
2. Which interior for the hospital: the reading room where a radiologist opens a scan (ties to 3verest), or a ward corridor?
3. Should the story inside be captions placed in the room (quiet, Apple-like) or a narrated voice (Higgsfield has text-to-speech; about 1 credit a line)?
4. The budget: the spike, and the ceiling for the batch.
