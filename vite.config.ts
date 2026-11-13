import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * Preload the latin display font so the first paint already has the metrics
 * the page is laid out for; without it the swap from the fallback font moved
 * the home page by 0.15 CLS.
 */
function preloadFont(): Plugin {
  let latin = '';
  return {
    name: 'preload-latin-font',
    apply: 'build',
    generateBundle(_, bundle) {
      latin = Object.keys(bundle).find((file) => /archivo-latin-wdth-normal.*\.woff2$/.test(file)) ?? '';
    },
    transformIndexHtml(html) {
      if (!latin) return html;
      return {
        html,
        tags: [
          {
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${latin}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
            },
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

export default defineConfig({ plugins: [react(), preloadFont()] });
