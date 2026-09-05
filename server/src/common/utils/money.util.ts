/** Integer-cent helpers so checkout/refund math never accumulates IEEE-754 dollars. */

const CENTS_PER_DOLLAR = 100;

export function decimalStringToCents(value: string): number {
  const trimmed = value.trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) {
    throw new Error(`Invalid decimal money value: ${value}`);
  }

  const sign = match[1] === '-' ? -1 : 1;
  const dollars = Number(match[2]);
  const cents = Number((match[3] ?? '00').padEnd(2, '0').slice(0, 2));
  return sign * (dollars * CENTS_PER_DOLLAR + cents);
}

/**
 * Convert a Prisma Decimal, numeric string, or dollar number into integer cents.
 * Prefer Decimal/string inputs so catalog prices are not rounded through floats.
 */
function hasToFixed(
  value: object,
): value is { toFixed: (digits: number) => string } {
  return (
    'toFixed' in value &&
    typeof (value as { toFixed?: unknown }).toFixed === 'function'
  );
}

export function toCents(value: unknown): number {
  if (value !== null && typeof value === 'object' && hasToFixed(value)) {
    return decimalStringToCents(value.toFixed(2));
  }

  if (typeof value === 'string') {
    return decimalStringToCents(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return decimalStringToCents(value.toFixed(2));
  }

  throw new Error('Invalid money amount');
}

export function centsToDecimalString(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error('Cents must be an integer');
  }

  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / CENTS_PER_DOLLAR);
  const remainder = abs % CENTS_PER_DOLLAR;
  return `${sign}${dollars}.${remainder.toString().padStart(2, '0')}`;
}

export function centsToDollarNumber(cents: number): number {
  return Number(centsToDecimalString(cents));
}
