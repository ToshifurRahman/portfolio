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

/* The build pre-renders every route, so the first paint shows the real page
   rather than an empty shell. Hydrating reuses that markup: without SSR
   (plain `vite dev`, or a route the build did not pre-render) it renders. */
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
