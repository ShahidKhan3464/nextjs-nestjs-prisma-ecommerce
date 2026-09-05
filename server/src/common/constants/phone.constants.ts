/** Shared phone number validation for users, sellers, and checkout. */
export const PHONE_MIN_LENGTH = 7;
export const PHONE_MAX_LENGTH = 30;

export const PHONE_REGEX = /^[+\d][\d\s()-]{6,29}$/;

export const PHONE_VALIDATION_MESSAGE = 'must be a valid phone number';
