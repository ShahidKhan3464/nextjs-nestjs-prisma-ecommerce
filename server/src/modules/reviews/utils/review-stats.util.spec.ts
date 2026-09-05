import { calculateAverageRating } from './review-stats.util';

describe('calculateAverageRating', () => {
  it('returns 0 when there are no reviews', () => {
    expect(calculateAverageRating(0, 0)).toBe(0);
  });

  it('rounds to one decimal place', () => {
    expect(calculateAverageRating(14, 3)).toBe(4.7);
    expect(calculateAverageRating(5, 1)).toBe(5);
    expect(calculateAverageRating(9, 2)).toBe(4.5);
  });
});
