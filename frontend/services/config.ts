/**
 * Config loader for environment variables
 * Loads from window._env_ (runtime) first, then falls back to import.meta.env (build-time)
 * This allows Docker to inject runtime configuration via env.js
 */

const getRuntimeEnv = (key: string, defaultValue: string = ''): string => {
  // First try window._env_ (set by docker-entrypoint.sh at runtime)
  if (typeof window !== 'undefined' && window._env_ && window._env_[key as keyof typeof window._env_]) {
    return window._env_[key as keyof typeof window._env_] as string;
  }
  // Fall back to build-time env vars
  if ((import.meta as any).env?.[key]) {
    return (import.meta as any).env[key];
  }
  return defaultValue;
};

export const config = {
  // API Configuration - loads from window._env_ first (runtime), then build-time
  apiBaseUrl: getRuntimeEnv('VITE_API_BASE_URL', 'http://localhost:8080/api'),

  // Admin Panel Permissions
  adminUsers: ((import.meta as any).env?.VITE_ADMIN_USERS as string || 'mojo,boss').split(',').map(u => u.trim()),

  // Seller Dashboard Permissions
  deletePermissionUsers: ((import.meta as any).env?.VITE_DELETE_PERMISSION_USERS as string || 'mojo,hajar,safae,ZITLBLAD1').split(',').map(u => u.trim()),

  // Application Thresholds
  fuelLowStockThreshold: parseInt((import.meta as any).env?.VITE_FUEL_LOW_STOCK_THRESHOLD as string || '500'),
  tankLowLevelThresholdPercent: parseInt((import.meta as any).env?.VITE_TANK_LOW_LEVEL_THRESHOLD_PERCENT as string || '15'),

  // Default Email Accounts (parsed from pipe-separated config)
  getDefaultEmailAccounts() {
    const raw = (import.meta as any).env?.VITE_DEFAULT_EMAIL_ACCOUNTS as string ||
      '1:direction@marrakech-agro.com:Direction Générale:bg-indigo-500|2:commercial@marrakech-agro.com:Service Commercial:bg-green-500|3:rh@marrakech-agro.com:Ressources Humaines:bg-pink-500|4:logistique@marrakech-agro.com:Logistique & Transport:bg-orange-500';

    return raw.split('|').map(entry => {
      const [id, email, name, color] = entry.split(':');
      return { id, email, name, color };
    });
  },

  // Check if user is admin
  isAdmin(username: string): boolean {
    return this.adminUsers.includes(username);
  },

  // Check if user can delete items
  canDelete(username: string): boolean {
    return this.deletePermissionUsers.includes(username);
  }
};
