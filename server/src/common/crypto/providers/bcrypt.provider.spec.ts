import { genSalt } from 'bcrypt';
import { BCRYPT_COST, BcryptProvider } from './bcrypt.provider';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('BcryptProvider', () => {
  it('hashes new passwords with cost 12', async () => {
    const provider = new BcryptProvider();
    await expect(provider.hash('new-password')).resolves.toBe('hashed');
    expect(genSalt).toHaveBeenCalledWith(BCRYPT_COST);
    expect(BCRYPT_COST).toBe(12);
  });
});
