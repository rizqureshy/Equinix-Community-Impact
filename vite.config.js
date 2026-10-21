import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import {
  chaptersHTML,
  explorerHTML,
  collectionHTML,
  sourcesHTML,
  principlesHTML,
} from './impact/scripts/content/render.js';

/** Pre-render content into the HTML so text is readable before scripts or the scene load. */
const prerender = () => ({
  name: 'impact-prerender',
  transformIndexHtml(html) {
    return html
      .replace('<!--@explorer-->', explorerHTML())
      .replace('<!--@chapters-->', chaptersHTML())
      .replace('<!--@principles-->', principlesHTML())
      .replace('<!--@collection-->', collectionHTML())
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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'impact/index.html'),
        studies: resolve(import.meta.dirname, 'impact/studies.html'),
      },
    },
  },
  test: {
    root: '.',
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
  },
});
