/** EJS template basenames (under integrations/mail/templates). */
export const MAIL_TEMPLATES = {
  WELCOME: 'welcome',
  RESET_PASSWORD: 'reset-password',
  ORDER_CONFIRMATION: 'order-confirmation',
  ORDER_STATUS_UPDATE: 'order-status-update',
} as const;

export const MAIL_SUBJECTS = {
  WELCOME: 'Welcome to Our Store',
  RESET_PASSWORD: 'Password Reset Request',
  orderConfirmation: (orderNumber: string) =>
    `Order confirmed — ${orderNumber}`,
  orderStatusUpdate: (orderNumber: string, statusLabel: string) =>
    `Order ${orderNumber} — ${statusLabel}`,
} as const;

export const MAIL_DEFAULT_FROM = '"No Reply" <noreply@example.com>';
