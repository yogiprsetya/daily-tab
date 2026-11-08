import { describe, expect, it } from 'vitest';
import { formatDay, localIsoDate, msUntilNextMidnight } from './today';

describe('formatDay', () => {
  it('formats weekday and day-month-year in English', () => {
    expect(formatDay(new Date(2026, 10, 8, 9, 30))).toEqual({
      weekday: 'Sunday',
      date: '8 November 2026',
    });
  });
});

describe('localIsoDate', () => {
  it('uses local calendar fields, zero-padded', () => {
    expect(localIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('msUntilNextMidnight', () => {
  it('counts down to the next local midnight', () => {
    expect(msUntilNextMidnight(new Date(2026, 10, 8, 23, 59, 30))).toBe(30_000);
  });

  it('returns a full day right at midnight', () => {
    expect(msUntilNextMidnight(new Date(2026, 10, 8, 0, 0, 0))).toBe(
      24 * 60 * 60 * 1000
    );
  });
});
