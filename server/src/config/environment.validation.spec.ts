import validation from './environment.validation';

const base = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://localhost:5432/test',
  STRIPE_SECRET_KEY: 'sk_test_x',
  MAIL_HOST: 'smtp.example.com',
  SMTP_USERNAME: 'user',
  SMTP_PASSWORD: 'pass',
};

const strong = 'aB3dE5fG7hI9jK1lM2nO3pQ4rS5tU6vW7x';

describe('environment JWT secret validation', () => {
  it('requires separate 32+ character secrets', () => {
    const { error } = validation.validate({
      ...base,
      JWT_ACCESS_SECRET: strong,
      JWT_REFRESH_SECRET: `${strong}r`,
      JWT_RESET_SECRET: `${strong}s`,
    });
    expect(error).toBeUndefined();
  });

  it('rejects short and example secrets', () => {
    expect(
      validation.validate({
        ...base,
        JWT_ACCESS_SECRET: 'too-short',
        JWT_REFRESH_SECRET: strong,
        JWT_RESET_SECRET: strong,
      }).error,
    ).toBeDefined();

    expect(
      validation.validate({
        ...base,
        JWT_ACCESS_SECRET: 'replace_with_a_long_random_secret!!',
        JWT_REFRESH_SECRET: strong,
        JWT_RESET_SECRET: strong,
      }).error,
    ).toBeDefined();
  });
});
