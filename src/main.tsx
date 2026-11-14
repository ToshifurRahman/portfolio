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
const rendered = root.dataset.route;
const here = location.pathname.replace(/\/$/, '') || '/';
const matches = rendered === here || rendered === '/404';

if (root.firstElementChild && matches) hydrateRoot(root, app);
else createRoot(root).render(app);
