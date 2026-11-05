import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import {
  journeyHTML,
  heroStatsHTML,
  numbersHTML,
  collectionHTML,
  principlesHTML,
} from './impact/scripts/content/render.js';
import { resourcesHTML, carryHTML } from './impact/scripts/content/resources.js';

/** Pre-render content into the HTML so text is readable before scripts or the scene load. */
const prerender = () => ({
  name: 'impact-prerender',
  transformIndexHtml(html) {
    return html
      .replace('<!--@journey-->', journeyHTML())
      .replace('<!--@hero-stats-->', heroStatsHTML())
      .replace('<!--@numbers-->', numbersHTML())
      .replace('<!--@principles-->', principlesHTML())
      .replace('<!--@collection-->', collectionHTML())
      .replace('<!--@resources-->', resourcesHTML())
      .replace('<!--@carry-->', carryHTML());
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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'impact/index.html'), // the full site is the root on version 3
        engage: resolve(import.meta.dirname, 'impact/engage.html'),
        kiosk: resolve(import.meta.dirname, 'impact/kiosk.html'), // the kiosk (the root on version 2)
        people: resolve(import.meta.dirname, 'impact/prototypes/people.html'),
        promises: resolve(import.meta.dirname, 'impact/prototypes/promises.html'), // the promises drawn as plans
        promisesSketches: resolve(import.meta.dirname, 'impact/prototypes/promises-sketches.html'), // four stages for the promises, as stills
        paper: resolve(import.meta.dirname, 'impact/prototypes/paper.html'), // lighting test: paper on a white table
        table: resolve(import.meta.dirname, 'impact/prototypes/table.html'), // the promises on a white table
        carrySketches: resolve(import.meta.dirname, 'impact/prototypes/carry-sketches.html'), // two stages for Carry the Story on the page, as stills
      },
    },
  },
  test: {
    root: '.',
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
  },
});
