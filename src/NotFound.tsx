import { Link } from 'react-router-dom';
import { Footer } from './Footer';
import { useTitle } from './useTitle';

export function NotFound() {
  useTitle('Page not found');
  return (
    <>
      <main id="main" className="frame grid12 page notfound">
        <h1 className="study-title">Page not found</h1>
        <p className="study-lede">This address does not match any page on the site.</p>
        <p>
          <Link className="more-link" to="/">
            Back to the home page <Arrow />
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}

export function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M2.5 8h11M9 3.5 13.5 8 9 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
