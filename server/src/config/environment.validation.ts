import Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  PORT: Joi.number().default(3000),
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
