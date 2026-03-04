import axios from 'axios';

class BackendUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendUnavailableError';
  }
}

const VITE_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  try {
    const token = window.localStorage.getItem('olivemanager_token');
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

export { api, BackendUnavailableError };
