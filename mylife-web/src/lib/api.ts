import axios from 'axios';

const TOKEN_KEY = 'mylife_token';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Listeners registrados pelo FamilyGroupProvider
type GroupErrorListener = () => void;
const groupErrorListeners = new Set<GroupErrorListener>();
export function onFamilyGroupError(fn: GroupErrorListener) {
  groupErrorListeners.add(fn);
  return () => groupErrorListeners.delete(fn);
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('mylife_user');
      window.location.href = '/login';
    }
    if (error.response?.status === 422) {
      const msg: string = error.response?.data?.message ?? '';
      if (msg.includes('grupo familiar')) {
        groupErrorListeners.forEach((fn) => fn());
      }
    }
    return Promise.reject(error);
  },
);
