import { Route, Routes } from 'react-router-dom';
import { Home } from './Home';
import { CaseStudyPage } from './CaseStudyPage';
import { NotFound } from './NotFound';
import { Navbar } from './Navbar';

export function App() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work/:slug" element={<CaseStudyPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
