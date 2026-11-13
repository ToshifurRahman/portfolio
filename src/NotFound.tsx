import { Link } from 'react-router-dom';
import { Footer } from './Footer';
import { useTitle } from './useTitle';

export function NotFound() {
  useTitle('Page not found');
  return (
    <>
      <main id="main" className="page notfound">
        <h1 className="display">No such state</h1>
        <p className="lede">This address does not match any page on the site.</p>
        <p>
          <Link className="action" to="/">
            Back to the start <Arrow />
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}

export function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 24 12" width="24" height="12" aria-hidden="true" focusable="false">
      <path d="M0 6h21M16 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
