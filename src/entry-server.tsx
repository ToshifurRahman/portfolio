import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
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
