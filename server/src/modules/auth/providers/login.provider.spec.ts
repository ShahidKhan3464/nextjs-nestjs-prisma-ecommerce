import { DUMMY_PASSWORD_HASH } from './login.provider';

describe('LoginProvider dummy password hash', () => {
  it('uses bcrypt cost 12 to match real password hashes', () => {
    expect(DUMMY_PASSWORD_HASH.startsWith('$2b$12$')).toBe(true);
  });
});
