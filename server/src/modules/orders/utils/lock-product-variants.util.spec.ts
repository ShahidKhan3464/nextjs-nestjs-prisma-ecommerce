import { sortedVariantIds } from './lock-product-variants.util';

describe('sortedVariantIds', () => {
  it('sorts and deduplicates ids for deterministic lock order', () => {
    expect(sortedVariantIds([3, 1, 2, 1, 10])).toEqual([1, 2, 3, 10]);
  });

  it('returns empty for empty input', () => {
    expect(sortedVariantIds([])).toEqual([]);
  });
});
