/** Shared password strength rules for register / change / reset. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 30;

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character';
