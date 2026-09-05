import Joi from 'joi';

const WEAK_JWT_SECRETS = [
  'secret',
  'your-secret',
  'your-secret-key',
  'change-me',
  'changeme',
  'jwt-secret',
  'jwt_secret',
  'supersecret',
  'password',
  'test-secret',
  'testsecret',
  'access-secret',
  'refresh-secret',
  'reset-secret',
  'replace_with_a_long_random_secret',
];

const jwtSecretSchema = Joi.string()
  .required()
  .min(32)
  .invalid(...WEAK_JWT_SECRETS)
  .custom((value: string, helpers) => {
    const lower = value.toLowerCase();
    if (
      /replace_with|change.?me|your.?secret|example|placeholder|dummy|test.?secret/.test(
        lower,
      )
    ) {
      return helpers.error('any.invalid');
    }
    if (/^(.)\1+$/.test(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  });

export default Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().uri().required(),
    otherwise: Joi.string().uri().optional(),
  }),
  DATABASE_URL: Joi.string().required(),
  UPLOADS_ROOT: Joi.string().optional().allow(''),
  API_VERSION: Joi.string().default('v1'),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(1).required(),
    otherwise: Joi.string().optional().allow(''),
  }),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  JWT_ACCESS_SECRET: jwtSecretSchema,
  JWT_REFRESH_SECRET: jwtSecretSchema,
  JWT_RESET_SECRET: jwtSecretSchema,
  MAIL_HOST: Joi.string().required(),
  SMTP_USERNAME: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  MAIL_SECURE: Joi.boolean().default(false),
  ADMIN_EMAIL: Joi.string().email().optional(),
  JWT_ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: Joi.string().default('7d'),
  ADMIN_NAME: Joi.string().min(5).max(30).optional(),
  ADMIN_PHONE: Joi.string().min(10).max(15).optional(),
  ADMIN_PASSWORD: Joi.string().min(8).max(30).optional(),
  MAIL_PORT: Joi.number().integer().min(1).max(65535).default(2525),
  SEED_DEMO_DATA: Joi.boolean().truthy('true').falsy('false').default(false),
  ALLOW_ADMIN_SEED: Joi.boolean().truthy('true').falsy('false').default(false),
});
