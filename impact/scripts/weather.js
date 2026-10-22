// Sunlight: a diffused low autumn sun over the page, blended into whatever
// sits beneath it, drifting a few pixels with the cursor and the scroll.
// Nothing else moves. With motion off the light stays, still.

/**
 * @param {object} opts
 * @param {HTMLElement} opts.light    fixed layer that carries the sun wash
 * @param {() => boolean} opts.motion whether motion is on
 */
export function createSunlight({ light, motion }) {
  let lx = 0;
  let ly = 0;
  function place() {
    light.style.setProperty('--lx', `${lx.toFixed(1)}px`);
    light.style.setProperty('--ly', `${ly.toFixed(1)}px`);
  }
  addEventListener(
    'pointermove',
    (e) => {
      if (!motion()) return;
      lx = (e.clientX / innerWidth - 0.5) * 24;
      ly = (e.clientY / innerHeight - 0.5) * 16;
      place();
    },
    { passive: true },
  );
  addEventListener(
    'scroll',
    () => {
      if (!motion()) return;
      light.style.setProperty('--ls', `${(-scrollY * 0.03).toFixed(1)}px`);
    },
    { passive: true },
  );
  return {
    /** Called when motion is switched on or off. */
    motionChanged() {
      if (!motion()) {
        light.style.removeProperty('--lx');
        light.style.removeProperty('--ly');
        light.style.removeProperty('--ls');
      }
    },
  };
}
