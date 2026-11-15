import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { caseStudies, owner, siteOrigin } from './content';
import { App } from './App';

/*
 * The shell every route is pre-rendered from. Kept out of main.tsx so the
 * client bundle never pulls in react-dom/server.
 */
export function render(url: string) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
}

/* The route metadata the pre-render needs for each document's head. Exported
   from here rather than importing content.js separately: the server build is a
   single bundle, so content.ts has no file of its own to import. */
export { caseStudies, owner, siteOrigin };
