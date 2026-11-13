import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it } from 'vitest';
import { certificates, education, experience, owner } from '../../src/content';
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
  it('renders the four sections in R1 order, each a labelled section with an h2', () => {
    const { container } = renderSections();
    const ids = ['experience', 'education', 'achievements', 'certificates'];

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

  it('shows the CV experience with the CV download at the top', () => {
    renderSections();
    const section = document.getElementById('experience') as HTMLElement;

    for (const role of experience) {
      expect(within(section).getByRole('heading', { name: role.title })).toBeTruthy();
      expect(within(section).getByText(role.organization)).toBeTruthy();
      expect(within(section).getByText(role.period)).toBeTruthy();
      for (const bullet of role.bullets) expect(within(section).getByText(bullet)).toBeTruthy();
    }

    const download = within(section).getByRole('link', { name: /download cv/i });
    expect(download.getAttribute('href')).toBe(owner.cv);
    expect(download.hasAttribute('download')).toBe(true);
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

  it('renders one card per certificate with a lazy preview image', () => {
    renderSections();
    const section = document.getElementById('certificates') as HTMLElement;

    for (const cert of certificates) {
      const image = within(section).getByAltText(cert.alt) as HTMLImageElement;
      expect(image.getAttribute('src')).toBe(cert.preview);
      expect(image.getAttribute('loading')).toBe('lazy');
      expect(image.getAttribute('decoding')).toBe('async');
      expect(image.getAttribute('width')).toBe(String(cert.width));
      expect(image.getAttribute('height')).toBe(String(cert.height));
    }

    expect(within(section).getAllByRole('button')).toHaveLength(certificates.length);
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

    await user.click(within(dialog).getByRole('button', { name: /close/i }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(card);
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
