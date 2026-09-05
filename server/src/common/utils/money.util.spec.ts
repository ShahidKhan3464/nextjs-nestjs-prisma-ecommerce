import {
  toCents,
  centsToDecimalString,
  centsToDollarNumber,
  decimalStringToCents,
} from './money.util';

describe('money helpers', () => {
  it('converts classic float pitfalls via decimal strings', () => {
    expect(decimalStringToCents('0.10') + decimalStringToCents('0.20')).toBe(
      30,
    );
    expect(centsToDecimalString(30)).toBe('0.30');
  });

  it('converts catalog-style prices exactly', () => {
    expect(toCents('19.99')).toBe(1999);
    expect(toCents('10.01') + toCents('9.98')).toBe(1999);
    expect(centsToDecimalString(1999)).toBe('19.99');
    expect(centsToDollarNumber(1999)).toBe(19.99);
  });

  it('uses Decimal.toFixed when Prisma-like values are passed', () => {
    expect(
      toCents({ toFixed: (digits: number) => (10.01).toFixed(digits) }),
    ).toBe(1001);
  });
});
