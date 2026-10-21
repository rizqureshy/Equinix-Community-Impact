// Scroll-scrubbed camera flight: one continuous film stitched from clips.
// Scroll position maps to film time; nothing plays on its own.
//
// Approach adapted from the scroll-world skill by cyw (MIT,
// https://github.com/oso95/scroll-world): clips are fetched whole as Blobs so
// they are always seekable, seeks are coalesced while the decoder is busy, and
// neighbouring clips cross-fade over a short scroll distance at each seam.

/**
 * @param {HTMLElement} stage   sticky full-screen element that holds the videos
 * @param {object} opts
 * @param {{src:string, poster:string, weight:number}[]} opts.segments  in film order
 * @param {(state:{index:number, local:number, progress:number}) => void} [opts.onFrame]
 * @param {number} [opts.crossfade]  fraction of a segment's scroll used to dissolve at seams
 */
export function createScrub(stage, { segments, onFrame, crossfade = 0.06 }) {
  const total = segments.reduce((sum, s) => sum + s.weight, 0);
  const starts = [];
  segments.reduce((at, s) => (starts.push(at / total), at + s.weight), 0);

  const layers = segments.map((s, i) => {
    const v = document.createElement('video');
    v.className = 'flight-clip';
    v.muted = true;
    v.playsInline = true;
    v.preload = 'none';
    v.poster = s.poster;
    v.setAttribute('aria-hidden', 'true');
    v.style.zIndex = String(i + 1);
    stage.appendChild(v);
    return { video: v, src: s.src, loaded: false, loading: null, want: 0 };
  });

  /** Fetch a clip as a Blob so seeking never depends on HTTP range support. */
  function load(i) {
    const layer = layers[i];
    if (!layer || layer.loaded || layer.loading) return layer?.loading;
    layer.loading = fetch(layer.src)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`${r.status} ${layer.src}`))))
      .then((blob) => {
        layer.video.src = URL.createObjectURL(blob);
        layer.loaded = true;
        return new Promise((res) => layer.video.addEventListener('loadeddata', res, { once: true }));
      })
      .then(() => seek(layer))
      .catch((e) => console.warn('Flight clip unavailable', e));
    return layer.loading;
  }

  /** Coalesced seek: never queue a new time while the decoder is still seeking. */
  function seek(layer) {
    const v = layer.video;
    if (!layer.loaded || !v.duration) return;
    const t = Math.min(v.duration - 0.04, Math.max(0, layer.want * v.duration));
    if (v.seeking || Math.abs(v.currentTime - t) < 1 / 60) return;
    v.currentTime = t;
  }
  layers.forEach((l) => l.video.addEventListener('seeked', () => seek(l)));

  let last = { index: -1, local: 0, progress: 0 };
  /** Render the film at a global progress between 0 and 1. */
  function render(progress) {
    const p = Math.min(1, Math.max(0, progress));
    let index = segments.length - 1;
    for (let i = 0; i < starts.length; i++) if (p < (starts[i + 1] ?? 2)) { index = i; break; }
    const span = segments[index].weight / total;
    const local = Math.min(1, Math.max(0, (p - starts[index]) / span));

    // Load the current clip and its neighbours; the poster covers until then.
    load(index);
    load(index + 1);
    if (index > 0) load(index - 1);

    layers.forEach((layer, i) => {
      let opacity = 0;
      if (i === index) opacity = 1;
      // Dissolve into the next clip over the last stretch of this one.
      if (i === index + 1 && local > 1 - crossfade) opacity = (local - (1 - crossfade)) / crossfade;
      layer.video.style.opacity = String(opacity);
      layer.video.style.visibility = opacity > 0 ? 'visible' : 'hidden';
      layer.want = i < index ? 1 : i > index ? 0 : local;
      if (opacity > 0 || Math.abs(i - index) === 1) seek(layer);
    });

    last = { index, local, progress: p };
    onFrame?.(last);
  }

  return {
    render,
    /** Global progress at which a segment starts. */
    startOf: (i) => starts[i],
    get state() {
      return last;
    },
    preload: () => load(0),
    dispose() {
      layers.forEach((l) => {
        if (l.video.src.startsWith('blob:')) URL.revokeObjectURL(l.video.src);
        l.video.remove();
      });
    },
  };
}
