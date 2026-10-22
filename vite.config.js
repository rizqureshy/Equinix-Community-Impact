import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import {
  pillarRowHTML,
  placesListHTML,
  pillarTabsHTML,
  pillarsHTML,
  timelineHTML,
  numbersHTML,
  metersHTML,
  promisesHTML,
  libraryHTML,
  sourcesHTML,
} from './impact/scripts/content/render.js';

/** Pre-render content into the HTML so text is readable before scripts load. */
const prerender = () => ({
  name: 'impact-prerender',
  transformIndexHtml(html) {
    return html
      .replace('<!--@pillar-row-->', pillarRowHTML())
      .replace('<!--@places-->', placesListHTML())
      .replace('<!--@pillar-tabs-->', pillarTabsHTML())
      .replace('<!--@pillars-->', pillarsHTML())
      .replace('<!--@timeline-->', timelineHTML())
      .replace('<!--@numbers-->', numbersHTML())
      .replace('<!--@meters-->', metersHTML())
      .replace('<!--@promises-->', promisesHTML())
      .replace('<!--@library-->', libraryHTML())
      .replace('<!--@sources-->', sourcesHTML());
  },
});

export default defineConfig({
  root: 'impact',
  // Relative base keeps assets and story links working at a repository
  // subpath (GitHub Pages) and at a host root (Cloudflare Pages).
  base: './',
  plugins: [prerender()],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'impact/index.html'),
        engage: resolve(import.meta.dirname, 'impact/engage.html'),
      },
    },
  },
  test: {
    root: '.',
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
  },
});
