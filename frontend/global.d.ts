/**
 * Global type declarations
 */

declare global {
  interface Window {
    _env_?: {
      VITE_API_BASE_URL?: string;
      VITE_WS_URL?: string;
      VITE_ADMIN_USERS?: string;
      VITE_DELETE_PERMISSION_USERS?: string;
      VITE_DEFAULT_EMAIL_ACCOUNTS?: string;
      VITE_FUEL_LOW_STOCK_THRESHOLD?: string;
      VITE_TANK_LOW_LEVEL_THRESHOLD_PERCENT?: string;
      [key: string]: string | undefined;
    };
  }
}

export {};

