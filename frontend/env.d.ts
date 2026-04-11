/**
 * Runtime environment configuration
 *
 * This file is generated at runtime by docker-entrypoint.sh
 * It sets window._env_ with environment variables from the Docker container.
 *
 * Example generated content:
 * window._env_ = {
 *   VITE_API_BASE_URL: "http://example.com:8080/api",
 *   VITE_ADMIN_USERS: "mojo,boss",
 *   ...
 * };
 */

declare global {
  interface Window {
    _env_?: {
      VITE_API_BASE_URL?: string;
      [key: string]: string | undefined;
    };
  }
}

export {};

