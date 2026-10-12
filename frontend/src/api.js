import axios from 'axios';

// Задаем базовый URL:
// 1. Если явно задан VITE_API_URL (например, для внешнего бэкенда), берем его.
// 2. В режиме локальной разработки (npm run dev) берем http://localhost:8000.
// 3. В продакшене (на Vercel, где фронт и бэк на одном домене) используем относительный путь /api.
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL()
});

export default api;

