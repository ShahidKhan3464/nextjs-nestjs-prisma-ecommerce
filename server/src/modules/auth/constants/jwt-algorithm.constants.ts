export const JWT_ALGORITHM = 'HS256' as const;

export const JWT_VERIFY_ALGORITHMS = [JWT_ALGORITHM] as const;

export function jwtSignOptions(secret: string, expiresIn: string) {
  return {
    secret,
    expiresIn,
    algorithm: JWT_ALGORITHM,
  };
}

export function jwtVerifyOptions(secret: string) {
  return {
    secret,
    algorithms: [...JWT_VERIFY_ALGORITHMS],
  };
}
