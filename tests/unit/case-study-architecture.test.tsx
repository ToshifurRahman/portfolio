import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';
import { StudyHeader } from '../../src/CaseStudyPage';
import { caseStudies, type CaseStudy } from '../../src/content';

/* Owner, 2026-11-15: on a case study "remove timeline" means the Architecture
   lane lists — Request, Work, Ticket states, On failure under the diagram —
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

const repos: Record<'ticket-pipeline' | 'rannaghor', string> = {
  'ticket-pipeline': 'https://github.com/ToshifurRahman/ticket-pipe',
  rannaghor: 'https://github.com/ToshifurRahman/e-commerce-website',
};

describe('the case studies’ Architecture section', () => {
  for (const slug of ['ticket-pipeline', 'rannaghor']) {
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
    for (const slug of ['ticket-pipeline', 'rannaghor']) {
      const container = renderAt(`/work/${slug}`);
      const figure = container.querySelector('#architecture .flow-panel');
      expect(figure, `${slug} has no flowchart`).not.toBeNull();
      expect(figure!.getAttribute('data-diagram')).toBe(slug);
    }
  });
});

describe('the case studies’ header', () => {
  for (const slug of ['ticket-pipeline', 'rannaghor'] as const) {
    it(`${slug}: has no Timeline entry`, () => {
      /* Owner, 2026-11-17: "remove timeline" now covers the header's meta row as
         well, reversing the 2026-11-15 ruling that kept the line. */
      const container = renderAt(`/work/${slug}`);
      const labels = [...container.querySelectorAll('.meta dt')].map((dt) => dt.textContent);
      expect(labels).not.toContain('Timeline');
      expect(container.querySelector('.meta')!.textContent).not.toContain('Timeline');
    });

    it(`${slug}: renders Source as a highlighted link-button`, () => {
      const container = renderAt(`/work/${slug}`);
      const source = container.querySelector(`.meta a.meta-link[href="${repos[slug]}"]`);
      expect(source, `${slug} has no highlighted Source link`).not.toBeNull();
      expect(source!.textContent).toBe('GitHub');
      expect(source!.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it(`${slug}: links the title to the repo when there is no Live entry`, () => {
      const container = renderAt(`/work/${slug}`);
      const title = container.querySelector('h1.study-title');
      expect(title).not.toBeNull();
      const link = title!.querySelector('a');
      expect(link, `${slug} title is not a link`).not.toBeNull();
      expect(link!.getAttribute('href')).toBe(repos[slug]);
      expect(link!.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link!.textContent).toBe(title!.textContent);
    });
  }

  it('renders a Live button next to Source and points the title at Live', () => {
    const base = caseStudies.find((s) => s.slug === 'ticket-pipeline')!;
    /* A test-only study: no Live URL exists in the source facts, so the real
       content must not gain one. */
    const study: CaseStudy = {
      ...base,
      meta: [
        ...base.meta.filter((m) => m.label !== 'Source' && m.label !== 'Live'),
        { label: 'Live', value: 'ticket.example.com', href: 'https://ticket.example.com' },
        { label: 'Source', value: 'GitHub', href: repos['ticket-pipeline'] },
      ],
    };
    const { container } = render(
      <MemoryRouter>
        <StudyHeader study={study} />
      </MemoryRouter>,
    );

    const links = [...container.querySelectorAll('.meta a.meta-link')];
    expect(links.map((a) => a.textContent)).toEqual(['ticket.example.com', 'GitHub']);
    expect(links.map((a) => a.getAttribute('rel'))).toEqual(['noopener noreferrer', 'noopener noreferrer']);

    const titleLink = container.querySelector('h1.study-title a');
    expect(titleLink).not.toBeNull();
    expect(titleLink!.getAttribute('href')).toBe('https://ticket.example.com');
    expect(titleLink!.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('keeps the title plain when a study has neither Live nor Source', () => {
    const base = caseStudies.find((s) => s.slug === 'ticket-pipeline')!;
    const study: CaseStudy = {
      ...base,
      meta: base.meta.filter((m) => m.label !== 'Live' && m.label !== 'Source'),
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

  it('invents no Live URL in the real content', () => {
    for (const study of caseStudies) {
      expect(study.meta.some((m) => m.label === 'Live'), `${study.slug} gained a Live entry`).toBe(false);
    }
  });
});
