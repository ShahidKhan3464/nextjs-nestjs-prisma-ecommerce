import Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().optional(),
  API_VERSION: Joi.string().default('v1'),
  STRIPE_SECRET_KEY: Joi.string().required(),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_SYNCHRONIZE: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false),
  DATABASE_AUTO_LOAD_ENTITIES: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(true),
  JWT_SECRET: Joi.string()
    .required()
    .min(16)
    .invalid(
      'secret',
      'your-secret',
      'your-secret-key',
      'change-me',
      'jwt-secret',
      'supersecret',
    ),
  JWT_ACCESS_TOKEN_TTL: Joi.string().default('2d'),
  JWT_REFRESH_TOKEN_TTL: Joi.string().default('7d'),
  MAIL_HOST: Joi.string().required(),
  SMTP_USERNAME: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_PORT: Joi.number().integer().min(1).max(65535).default(2525),
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_NAME: Joi.string().min(5).max(30).optional(),
  ADMIN_PHONE: Joi.string().min(10).max(15).optional(),
  ADMIN_PASSWORD: Joi.string().min(8).max(30).optional(),
  SEED_DEMO_DATA: Joi.boolean().truthy('true').falsy('false').default(false),
});
