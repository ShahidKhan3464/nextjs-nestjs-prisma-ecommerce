import jwt from 'jsonwebtoken';
import {
  JWT_ALGORITHM,
  JWT_VERIFY_ALGORITHMS,
} from './jwt-algorithm.constants';

const SECRET = 'unit-test-access-secret-value-32ch';

describe('JWT algorithm pinning', () => {
  it('signs and verifies HS256 tokens', () => {
    const token = jwt.sign({ typ: 'access' }, SECRET, {
      algorithm: JWT_ALGORITHM,
    });
    const payload = jwt.verify(token, SECRET, {
      algorithms: [...JWT_VERIFY_ALGORITHMS],
    });
    expect(typeof payload).toBe('object');
  });

  it('rejects tokens signed with an unsupported algorithm', () => {
    const token = jwt.sign({ typ: 'access' }, SECRET, {
      algorithm: 'HS384',
    });

    expect(() =>
      jwt.verify(token, SECRET, { algorithms: [...JWT_VERIFY_ALGORITHMS] }),
    ).toThrow(/algorithm/i);
  });
});
