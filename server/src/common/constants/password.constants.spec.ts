import { PASSWORD_COMPLEXITY_REGEX } from './password.constants';

describe('PASSWORD_COMPLEXITY_REGEX', () => {
  it('accepts a password that meets the full policy', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1!')).toBe(true);
  });

  it('accepts an 8-character password that meets the policy', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('Abcd123!')).toBe(true);
  });

  it('rejects when a matching substring is surrounded by disallowed characters', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1!.')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test(' Password1!')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1! extra')).toBe(false);
  });

  it('rejects a password missing a required character class', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('password1!')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test('PASSWORD1!')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password!')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1')).toBe(false);
  });

  it('rejects a policy-compliant password with a trailing line terminator', () => {
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1!\n')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1!\r')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1!\r\n')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1!\u2028')).toBe(false);
    expect(PASSWORD_COMPLEXITY_REGEX.test('Password1!\u2029')).toBe(false);
  });
});
