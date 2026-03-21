import axios from 'axios';

class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

const VITE_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';
const TOKEN_KEY = 'olivemanager_token';
const SESSION_KEY = 'auth_session';

export type AuthRole = 'admin' | 'seller';
export type AuthSession = {
  token: string;
  username: string;
  role: AuthRole;
  vehicleId?: string | null;
};

const api = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

const getToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadAuthSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function clearAuthSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
}

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  try {
    const token = getToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Response interceptor to handle network errors and auth
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      // network error / backend not reachable
      return Promise.reject(new BackendUnavailableError('Backend not reachable'));
    }
    // forward the original error
    return Promise.reject(error);
  }
);

export { api, BackendUnavailableError, getToken, saveAuthSession, loadAuthSession, clearAuthSession, SESSION_KEY, TOKEN_KEY };
