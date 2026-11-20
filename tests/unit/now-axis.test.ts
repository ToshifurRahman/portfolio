import { describe, expect, it } from 'vitest';
import { path, pathYears } from '../../src/content';

/* `pathYears` is the continuous span from the first to the last year in the
   data, not only the years a label happens to name. The panel draws alternating
   stations on a chronological spine rather than a proportional year axis; this
   keeps the span itself under test. Owner, 2026-11-17: the graph was
   "disconnected & misguided", and the M.Engg. is 2026 by the owner's ruling. */
describe('the Now year span', () => {
  it('runs 2021 to 2026 with no gap', () => {
    expect(pathYears).toEqual([2021, 2022, 2023, 2024, 2025, 2026]);
  });

  it('derives the span from the stops, so a new year extends it', () => {
    const stated = path.flatMap((stop) => [stop.year, stop.yearEnd]).filter((y): y is number => typeof y === 'number');
    expect(Math.min(...stated)).toBe(pathYears[0]);
    expect(Math.max(...stated)).toBe(pathYears[pathYears.length - 1]);
    expect(pathYears).toHaveLength(Math.max(...stated) - Math.min(...stated) + 1);
  });

  it('places both M.Engg. stops at 2026 and keeps the admission text undated', () => {
    const mengg = path.filter((stop) => stop.label.includes('M.Engg.'));
    expect(mengg.map((stop) => stop.label)).toEqual(['Admitted to M.Engg., CUET', 'M.Engg. in CSE, CUET']);
    expect(mengg.map((stop) => stop.year)).toEqual([2026, 2026]);
    expect(mengg[0].date).toBe('');
    expect(mengg[1].date).toBe('In progress');
    expect(mengg[1].current).toBe(true);
  });

  it('carries both ends of the B.Sc. on one stop', () => {
    const bsc = path.find((stop) => stop.label === 'B.Sc. in CSE, IIUC')!;
    expect(bsc.year).toBe(2021);
    expect(bsc.yearEnd).toBe(2025);
    expect(bsc.date).toBe('Aug 2021');
    expect(bsc.endLabel).toBe('B.Sc. completed');
    expect(bsc.endDate).toBe('Dec 2025');
    /* Stored on one entry: the panel splits it into a start and a completion
       station, and the content list carries no separate completion stop. */
    expect(path.some((stop) => stop.label === 'B.Sc. completed')).toBe(false);
  });
});
