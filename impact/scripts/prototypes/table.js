// Prototype page for the promises on a white table: the same module and markup the site runs, on its own page.
import '@fontsource-variable/inter-tight';
import { createPaperTable } from '../paper-table.js';

window.__table = createPaperTable(document.querySelector('#promises'), { media: '../media/' });
