import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { StudyHeader } from '../../src/CaseStudyPage';
import { caseStudies, type CaseStudy } from '../../src/content';

/* Owner, 2026-11-15: on a case study "remove timeline" means the Architecture
   lane lists (Request, Work, Ticket states, On failure under the diagram),
   because the flowchart shows those things now. The header's Timeline line
   stayed at first; the owner reversed that on 2026-11-17, so it is gone too. */

const renderAt = (route: string) => {
  const { container } = render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
  return container;
};

const repos: Record<'relay' | 'rannaghor', string> = {
  relay: 'https://github.com/ToshifurRahman/relay',
  rannaghor: 'https://github.com/ToshifurRahman/e-commerce-website',
};

describe('the case studies’ Architecture section', () => {
  for (const slug of ['relay', 'rannaghor']) {
    it(`${slug}: renders no architecture lane list`, () => {
      const container = renderAt(`/work/${slug}`);
      const architecture = container.querySelector('#architecture');
      expect(architecture).not.toBeNull();

      /* The lane lists were a figure of labelled nodes; neither the figure nor a
         lane heading survives. */
      expect(architecture!.querySelector('.diagram')).toBeNull();
      expect(architecture!.querySelector('.lane')).toBeNull();
      expect(architecture!.querySelector('.lane-label')).toBeNull();
      /* And the lane labels that only the lists carried are gone. "Every API
         call" is deliberately NOT in this list: it is also the flowchart's own
         sublabel on the security station, which the owner keeps. The assertion
         is about the list, not the words. */
      const text = architecture!.textContent ?? '';
      for (const label of ['Ticket states', 'On failure', 'Shared packages']) {
        expect(text, `${label} still rendered`).not.toContain(label);
      }
    });
  }

  it('still renders the flowchart that replaced them', () => {
    for (const slug of ['relay', 'rannaghor']) {
      const container = renderAt(`/work/${slug}`);
      const figure = container.querySelector('#architecture .flow-panel');
      expect(figure, `${slug} has no flowchart`).not.toBeNull();
      expect(figure!.getAttribute('data-diagram')).toBe(slug);
    }
  });
});

describe('the case studies’ header', () => {
  for (const slug of ['relay', 'rannaghor'] as const) {
    it(`${slug}: has no Timeline entry`, () => {
      /* Owner, 2026-11-17: "remove timeline" now covers the header's meta row as
         well, reversing the 2026-11-15 ruling that kept the line. */
      const container = renderAt(`/work/${slug}`);
      const labels = [...container.querySelectorAll('.meta dt')].map((dt) => dt.textContent);
      expect(labels).not.toContain('Timeline');
      expect(container.querySelector('.meta')!.textContent).not.toContain('Timeline');
    });

    it(`${slug}: renders Source Code as a Skills chip link`, () => {
      /* Owner, 2026-11-17: "remove bg of github & create same design as Skills
         sections button, write Source Code instead of source". The cell is a label
         and a link, and the label now says what the link is. */
      const container = renderAt(`/work/${slug}`);
      const source = container.querySelector(`.meta a.meta-link[href="${repos[slug]}"]`);
      expect(source, `${slug} has no Source Code link`).not.toBeNull();
      expect(source!.textContent).toBe('GitHub');
      expect(source!.getAttribute('rel')).toBe('noopener noreferrer');
      /* Not the filled button: the chip look is asserted on the painted page, in
         tests/e2e/case-study-meta.spec.ts. Here the class says it is not a button. */
      expect(source!.classList.contains('button'), 'the chip is still the filled button').toBe(false);
      const cell = source!.closest('.meta > div')!;
      expect(cell.querySelector('dt')!.textContent).toBe('Source Code');
    });

    it(`${slug}: links the title to Live when it has one, else to the repo`, () => {
      const container = renderAt(`/work/${slug}`);
      const title = container.querySelector('h1.study-title');
      expect(title).not.toBeNull();
      const link = title!.querySelector('a');
      expect(link, `${slug} title is not a link`).not.toBeNull();
      /* Relay's owner confirmed a Live address, so its title goes there; RannaGhor
         has no Live entry and its title goes to the repository. */
      expect(link!.getAttribute('href')).toBe(slug === 'relay' ? 'https://ticket-pipeline.onrender.com' : repos[slug]);
      expect(link!.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link!.textContent).toBe(title!.textContent);
    });
  }

  it('renders a Live chip next to Source Code and points the title at Live', () => {
    const base = caseStudies.find((s) => s.slug === 'rannaghor')!;
    /* A test-only study: RannaGhor has no Live URL in the source facts, so the
       real content must not gain one. */
    const study: CaseStudy = {
      ...base,
      meta: [
        ...base.meta.filter((m) => m.label !== 'Source Code' && m.label !== 'Live'),
        { label: 'Live', value: 'shop.example.com', href: 'https://shop.example.com' },
        { label: 'Source Code', value: 'GitHub', href: repos['rannaghor'] },
      ],
    };
    const { container } = render(
      <MemoryRouter>
        <StudyHeader study={study} />
      </MemoryRouter>,
    );

    const links = [...container.querySelectorAll('.meta a.meta-link')];
    expect(links.map((a) => a.textContent)).toEqual(['shop.example.com', 'GitHub']);
    expect(links.map((a) => a.getAttribute('rel'))).toEqual(['noopener noreferrer', 'noopener noreferrer']);

    const titleLink = container.querySelector('h1.study-title a');
    expect(titleLink).not.toBeNull();
    expect(titleLink!.getAttribute('href')).toBe('https://shop.example.com');
    expect(titleLink!.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps the title plain when a study has neither Live nor Source', () => {
    const base = caseStudies.find((s) => s.slug === 'rannaghor')!;
    const study: CaseStudy = {
      ...base,
      meta: base.meta.filter((m) => m.label !== 'Live' && m.label !== 'Source Code'),
    };
    const { container } = render(
      <MemoryRouter>
        <StudyHeader study={study} />
      </MemoryRouter>,
    );

    const title = container.querySelector('h1.study-title');
    expect(title).not.toBeNull();
    expect(title!.querySelector('a'), 'the title links with no destination').toBeNull();
    expect(container.querySelector('.meta .meta-link'), 'an exit rendered with no href').toBeNull();
  });

  it('gives Relay the confirmed Live address and RannaGhor none', () => {
    /* The owner confirmed Relay's deployed address. RannaGhor has no Live URL in
       its source facts, so the study must not gain one. */
    const relay = caseStudies.find((s) => s.slug === 'relay')!;
    expect(relay.meta.find((m) => m.label === 'Live')).toEqual({
      label: 'Live',
      value: 'ticket-pipeline.onrender.com',
      href: 'https://ticket-pipeline.onrender.com',
    });
    const rannaghor = caseStudies.find((s) => s.slug === 'rannaghor')!;
    expect(rannaghor.meta.some((m) => m.label === 'Live'), 'RannaGhor gained a Live entry').toBe(false);
  });
});
