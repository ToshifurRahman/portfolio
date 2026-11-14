import { existsSync, readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * Preload the latin display font. The face is declared with
 * `font-display: optional`, so the first paint never waits for it; the preload
 * only makes sure the face is there for the paint that follows, and keeps the
 * swap from ever happening (CLS 0.000).
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

/*
 * The whole stylesheet is 17 kB, and as a separate file it is a render-blocking
 * request on the critical path: on a simulated slow connection that alone cost
 * ~150 ms before the first paint. Inlined into the document it costs nothing
 * extra to fetch, so the first paint waits only for the HTML.
 *
 * The case-study view is deliberately NOT split into a lazy chunk: measured
 * here, the extra round trip for the chunk cost the case study ~1.2 s of LCP
 * (0.62 s in one bundle, 1.97 s split), which is far more than the 3.8 kB it
 * saves on the home page.
 */
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return html;
        const file = Object.keys(bundle).find((name) => /\.css$/.test(name));
        const asset = file ? bundle[file] : undefined;
        if (!file || !asset || asset.type !== 'asset') return html;
        const css = String(asset.source);
        delete bundle[file];
        return html
          .replace(new RegExp(`\\s*<link[^>]*href="/${file}"[^>]*>`, 'g'), '')
          .replace('</head>', `    <style>${css}</style>\n  </head>`);
      },
    },
  };
}

/*
 * Serve the pre-rendered documents. `vite preview` answers an extensionless
 * path with the SPA fallback (dist/index.html), so /work/ticket-pipeline would
 * get the home page's markup and an unknown path would get it too. This
 * rewrites a request to the route's own pre-rendered document when the build
 * wrote one, and otherwise to dist/404.html with a 404 status, which is what a
 * host that serves the folder would do. Anything after the path (a hash is not
 * sent; a query is) is kept.
 */
function prerenderedRoutes(): Plugin {
  return {
    name: 'prerendered-routes',
    apply: 'serve',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '/';
        const path = url.split('?')[0];
        const rest = url.slice(path.length);
        if (path === '/' || /\.[a-z0-9]+$/i.test(path)) return next();
        const route = path.replace(/\/$/, '');
        const own = `dist${route}/index.html`;
        if (existsSync(own)) {
          req.url = `${route}/index.html${rest}`;
          return next();
        }
        const notFound = 'dist/404.html';
        if (!existsSync(notFound)) return next();
        /* Answered here rather than by rewriting and calling next(): the static
           middleware that follows sets its own 200, so the status would be
           lost. A real host serves this file with a 404, so preview does too. */
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(readFileSync(notFound));
      });
    },
  };
}

export default defineConfig({ plugins: [react(), preloadFont(), inlineCss(), prerenderedRoutes()] });
