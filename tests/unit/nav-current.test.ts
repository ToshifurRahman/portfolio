import { describe, expect, it } from 'vitest';
import { currentSectionAt } from '../../src/nav';

const tops = [
  { id: 'work', top: -900 },
  { id: 'experience', top: -300 },
  { id: 'skills', top: 200 },
  { id: 'contact', top: 600 },
];

describe('currentSectionAt', () => {
  it('marks the last section that has passed the reading line', () => {
    expect(currentSectionAt(tops, 88, false)).toBe('experience');
  });

  it('marks nothing above the first section, and the last at the bottom', () => {
    expect(currentSectionAt(tops, 88, true)).toBe('contact');
    expect(currentSectionAt(tops.map((t) => ({ ...t, top: 400 })), 88, false)).toBeNull();
  });

  it('marks the last section at the page bottom, however tall it is', () => {
    expect(currentSectionAt(tops, 88, true)).toBe('contact');
  });

  it('has nothing to mark before the sections exist', () => {
    expect(currentSectionAt([], 88, false)).toBeNull();
  });
});
