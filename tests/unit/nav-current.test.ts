import { describe, expect, it } from 'vitest';
import { currentSectionAt } from '../../src/nav';

const tops = [
  { id: 'about', top: -900 },
  { id: 'work', top: -300 },
  { id: 'skills', top: 200 },
  { id: 'contact', top: 600 },
];

describe('currentSectionAt', () => {
  it('marks the last section that has passed the reading line', () => {
    expect(currentSectionAt(tops, 88, false)).toBe('work');
  });

  it('marks the first section at the top of the page', () => {
    expect(currentSectionAt(tops, 88, true)).toBe('contact');
    expect(currentSectionAt(tops.map((t) => ({ ...t, top: 400 })), 88, false)).toBe('about');
  });

  it('marks the last section at the page bottom, however tall it is', () => {
    expect(currentSectionAt(tops, 88, true)).toBe('contact');
  });

  it('has nothing to mark before the sections exist', () => {
    expect(currentSectionAt([], 88, false)).toBeNull();
  });
});
