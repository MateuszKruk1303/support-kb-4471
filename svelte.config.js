// Build setup added next to the kb export, so the pages render the way the desk sees them.
// The export itself (src/) is unchanged; this file only wires Markdown pages, layouts and #lib.
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import { fileURLToPath } from 'node:url';

const runbook = fileURLToPath(new URL('./src/lib/layouts/runbook.svelte', import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.svx'],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: ['.svx'],
      layout: { runbook },
    }),
  ],
  kit: {
    adapter: adapter({ pages: 'rendered', assets: 'rendered', strict: true }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['/kb'] },
    // Styles inline, so each rendered .html file in build/ shows the page as the desk sees it on its own.
    inlineStyleThreshold: Infinity,
  },
};

export default config;
