import axios from 'axios';

// Задаем базовый URL. Если VITE_API_URL задан (на проде), используем его, иначе локальный сервер.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
});

export default api;

