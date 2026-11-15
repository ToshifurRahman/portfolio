import { owner } from './content';

/*
 * The year is the build's, not the clock's. The build pre-renders every page,
 * so a footer that read the clock would disagree with the document the moment
 * the year turned: React would throw a hydration mismatch on every page and
 * replace the pre-rendered markup. `__BUILD_YEAR__` is replaced at build time
 * (vite.config.ts) and is the same string in the document and in the bundle.
 */
declare const __BUILD_YEAR__: string | undefined;

const year = typeof __BUILD_YEAR__ === 'string' ? __BUILD_YEAR__ : String(new Date().getFullYear());

export function Footer() {
  return (
    <footer className="frame ruled footer">
      <p>
        © {year} {owner.name}
      </p>
      <a className="text-button" href="#main">
        Back to top
      </a>
    </footer>
  );
}
