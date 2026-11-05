// Prototype page for the promises section: the same module the site runs, on its own page.
import '@fontsource-variable/inter-tight';
import { createPromises } from '../promises.js';

window.__promises = createPromises(document.querySelector('#promises'), { media: '../media/' });
