import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import { App } from './App';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

/* The build pre-renders every route and stamps #root with the route it was
   rendered for. Hydrate only when that is the address being shown: a document
   served for an address it was not rendered for (a route added after the
   build) is rendered over instead, so React never hydrates markup it did not
   produce. The 404 document is rendered for any unknown address, so it always
   matches. Without a stamp (plain `vite dev`) it renders. */

/* A document is also reachable at its own file path (/index.html,
   /work/x/index.html), which is the path a host serves the file from. That is
   the same page, so the address is normalised to the route before anything
   reads it: the router matches the route, the stamp matches the route, and the
   visitor's address bar loses the duplicate file path. Without this the route
   matched nothing, React rendered <NotFound /> over the document served for
   /index.html, and a crawler linking the file path saw a soft 404 for a page
   that exists. Query and hash are kept. */
const fileRoute = location.pathname.replace(/(^|\/)index\.html$/, '$1').replace(/(.)\/$/, '$1');
if (fileRoute !== location.pathname) {
  history.replaceState(history.state, '', `${fileRoute}${location.search}${location.hash}`);
}

const rendered = root.dataset.route;
const here = location.pathname.replace(/\/$/, '') || '/';
const matches = rendered === here || rendered === '/404';

if (root.firstElementChild && matches) hydrateRoot(root, app);
else createRoot(root).render(app);
