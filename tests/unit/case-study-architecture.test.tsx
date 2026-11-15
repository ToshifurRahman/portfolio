import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/App';

/* Owner, 2026-11-15: on a case study "remove timeline" means the Architecture
   lane lists — Request, Work, Ticket states, On failure under the diagram — while
   the header's Timeline line stays. The flowchart shows those things now, so the
   lists are said twice if they stay. */

const renderAt = (route: string) => {
  const { container } = render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
  return container;
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

  it('keeps the header’s Timeline line', () => {
    /* "Remove timeline" is about the lane lists; the meta row is the study's own
       dates and stays. */
    const container = renderAt('/work/ticket-pipeline');
    const meta = container.querySelector('.meta');
    expect(meta).not.toBeNull();
    expect(meta!.textContent).toContain('Timeline');
  });

  it('still renders the flowchart that replaced them', () => {
    for (const slug of ['ticket-pipeline', 'rannaghor']) {
      const container = renderAt(`/work/${slug}`);
      const figure = container.querySelector('#architecture .flow-panel');
      expect(figure, `${slug} has no flowchart`).not.toBeNull();
      expect(figure!.getAttribute('data-diagram')).toBe(slug);
    }
  });
});
