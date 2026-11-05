import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import {
  journeyHTML,
  heroStatsHTML,
  numbersHTML,
  collectionHTML,
  principlesHTML,
} from './impact/scripts/content/render.js';
import { resourcesHTML } from './impact/scripts/content/resources.js';

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
      .replace('<!--@resources-->', resourcesHTML());
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
      },
    },
  },
  test: {
    root: '.',
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
  },
});
