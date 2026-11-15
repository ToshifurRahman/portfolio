import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { achievements, certificates, education, experience, owner } from '../../src/content';
import { CvSections } from '../../src/sections';

/* jsdom has no <dialog> implementation, so provide the two methods the
   component calls and keep the open attribute and close event in step. */
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

const renderSections = () =>
  render(
    <MemoryRouter>
      <CvSections />
    </MemoryRouter>,
  );

describe('CvSections', () => {
  it('renders the three sections in page order, each a labelled section with an h2', () => {
    const { container } = renderSections();
    const ids = ['experience', 'education', 'achievements'];

    expect([...container.querySelectorAll('section')].map((s) => s.id)).toEqual(ids);

    for (const id of ids) {
      const section = container.querySelector(`section#${id}`);
      expect(section, id).not.toBeNull();
      expect(section!.getAttribute('aria-labelledby')).toBe(`${id}-title`);
      const heading = section!.querySelector(`h2#${id}-title`);
      expect(heading, id).not.toBeNull();
      expect(heading!.textContent!.trim().length).toBeGreaterThan(0);
    }
  });

  it('shows the CV experience word for word', () => {
    renderSections();
    const section = document.getElementById('experience') as HTMLElement;

    for (const role of experience) {
      expect(within(section).getByRole('heading', { name: role.title })).toBeTruthy();
      expect(within(section).getByText(role.organization)).toBeTruthy();
      expect(within(section).getByText(role.period)).toBeTruthy();
      for (const bullet of role.bullets) expect(within(section).getByText(bullet)).toBeTruthy();
    }
  });

  it('shows both degrees and the achievements in text order', () => {
    renderSections();
    const edu = document.getElementById('education') as HTMLElement;
    for (const entry of education) {
      expect(within(edu).getByText(entry.degree)).toBeTruthy();
      expect(within(edu).getByText(entry.institution)).toBeTruthy();
    }

    const ach = document.getElementById('achievements') as HTMLElement;
    const text = ach.textContent ?? '';
    expect(text).toMatch(/max rating 1290/);
    expect(text).toMatch(/max rating 1461/);
    expect(text).toMatch(/1st Runner-up/);
    expect(text).toMatch(/Best Mentor Award/);
    expect(text.indexOf('Codeforces')).toBeLessThan(text.indexOf('1st Runner-up'));
  });

  it('gives each achievement one line: title, place, year, no paragraph', () => {
    /* Owner, 23:03: Achievements "feels like too many texts to read", answered
       as the readout plus one line per item. Every word of the line is split
       from the sentence the item already had. */
    renderSections();
    const ach = document.getElementById('achievements') as HTMLElement;
    const lines = [...ach.querySelectorAll('.achievement-line')];
    expect(lines).toHaveLength(achievements.filter((a) => !a.record).length);
    for (const line of lines) {
      expect(line.querySelector('.achievement-title')?.textContent).toBeTruthy();
      expect(line.querySelector('.achievement-year')?.textContent).toBeTruthy();
      /* A line, not a paragraph: no sentence-ending full stop of its own. */
      expect(line.textContent).not.toMatch(/\.$/);
    }
    /* The long sentences are gone from the list itself. */
    const listText = ach.querySelector('.achievements')?.textContent ?? '';
    for (const entry of achievements.filter((a) => !a.record)) {
      expect(listText).not.toContain(entry.text);
    }
  });

  /* Owner: "In achievements, highlight oj rating, problem solving, contests."
     The four figures are the facts already in the first achievement's sentence,
     split into fields; the test pins each one to that sentence, so splitting
     the entry cannot quietly change a number. */
  it('leads with the problem-solving record, splitting the first achievement', () => {
    renderSections();
    const readout = document.querySelector('#achievements .readout-figures');
    expect(readout).not.toBeNull();
    const values = [...readout!.querySelectorAll('.proof-value')].map((el) => el.textContent);
    const labels = [...readout!.querySelectorAll('.proof-label')].map((el) => el.textContent);
    expect(values).toEqual(['1290', '1461', '1,600+', '100+']);
    expect(labels).toEqual([
      'Codeforces max rating, Pupil',
      'CodeChef max rating',
      'problems solved',
      'contests entered',
    ]);

    /* Every figure is in the sentence it came from, and no fact is new. */
    const source = achievements[0].text.replace(/,/g, '');
    for (const fact of ['1290', '1461', '1600+', '100+']) {
      expect(source, fact).toContain(fact);
    }
    expect(achievements[0].record).toBeTruthy();
    expect(achievements[0].record!.map((r) => r.value).join(' ')).toBe('1290 1461 1,600+ 100+');
  });

  it('keeps both profile links beside the figures', () => {
    renderSections();
    const readout = document.querySelector('#achievements .readout-figures')!;
    const links = [...readout.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual([
      'https://codeforces.com/profile/ToshifurRahman',
      'https://www.codechef.com/users/tasin_021',
    ]);
  });

  it('shows the first achievement once, in the readout, and the rest as the list', () => {
    renderSections();
    const readout = document.querySelector('#achievements .readout-figures')!;
    expect(readout.textContent).toContain(achievements[0].text);
    /* Since 23:03 each of the rest is one line, not its full sentence, so the
       test checks the line's own title and year rather than the paragraph. */
    const listed = [...document.querySelectorAll('.achievements li')].map((li) => li.textContent ?? '');
    expect(listed).toHaveLength(achievements.length - 1);
    for (const entry of achievements.slice(1)) {
      expect(entry.title, `${entry.text} has no short title`).toBeTruthy();
      expect(listed.some((t) => t.includes(entry.title!)), entry.text).toBe(true);
    }
    /* The record sentence appears once on the page, not twice. */
    const page = document.getElementById('achievements')!.textContent ?? '';
    expect(page.split(achievements[0].text).length - 1).toBe(1);
  });

  it('lists one row per certificate inside Achievements, named by its own text', () => {
    renderSections();
    const section = document.getElementById('certificates') as HTMLElement;
    expect(section.closest('section')?.id).toBe('achievements');

    /* Each row shows a small preview that loads lazily and is decorative:
       the row's text names the certificate. */
    const thumbs = [...section.querySelectorAll('img')];
    expect(thumbs).toHaveLength(certificates.length);
    for (const img of thumbs) {
      expect(img.getAttribute('alt')).toBe('');
      expect(img.getAttribute('loading')).toBe('lazy');
    }

    const buttons = within(section).getAllByRole('button');
    expect(buttons).toHaveLength(certificates.length);
    for (const [i, cert] of certificates.entries()) {
      const name = buttons[i].textContent ?? '';
      expect(name).toContain(cert.title);
      expect(name).toContain(cert.issuer);
    }

    /* Nothing announces a certificate twice. */
    for (const cert of certificates) {
      expect(within(section).queryAllByAltText(cert.alt)).toHaveLength(0);
    }
  });

  it('opens a certificate in a modal dialog labelled by its title, then closes it', async () => {
    const user = userEvent.setup();
    renderSections();
    const cert = certificates[0];
    const section = document.getElementById('certificates') as HTMLElement;

    const card = within(section).getByRole('button', { name: new RegExp(cert.title) });
    await user.click(card);

    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId!)?.textContent).toBe(cert.title);
    expect(dialog.hasAttribute('open')).toBe(true);

    expect(within(dialog).getByRole('link', { name: /open original/i }).getAttribute('href')).toBe(cert.file);

    /* The dialog's text names the certificate, so its image is decorative. */
    const dialogImage = dialog.querySelector('img') as HTMLImageElement;
    expect(dialogImage.getAttribute('alt')).toBe('');

    await user.click(within(dialog).getByRole('button', { name: /close/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(card);
  });

  it('opens every original in a new tab with noopener, image files included', async () => {
    const user = userEvent.setup();
    renderSections();
    const section = document.getElementById('certificates') as HTMLElement;

    for (const cert of certificates) {
      const card = within(section).getByRole('button', { name: new RegExp(cert.title) });
      await user.click(card);

      const dialog = screen.getByRole('dialog');
      const original = within(dialog).getByRole('link', { name: /open original/i });
      expect(original.getAttribute('target'), cert.file).toBe('_blank');
      expect(original.getAttribute('rel'), cert.file).toBe('noopener');

      await user.click(within(dialog).getByRole('button', { name: /close/i }));
    }
  });

  it('returns focus to the card when Escape closes the dialog', async () => {
    const user = userEvent.setup();
    renderSections();
    const cert = certificates[3];
    const section = document.getElementById('certificates') as HTMLElement;
    const card = within(section).getByRole('button', { name: new RegExp(cert.title) });

    await user.click(card);
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(true);

    /* jsdom does not implement Escape for a native dialog; firing cancel then
       close mirrors what the browser does, and the component reacts to close. */
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    fireEvent(dialog, new Event('close'));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(card);
  });
});
