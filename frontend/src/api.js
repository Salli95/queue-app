import axios from 'axios';

// Задаем базовый URL. Если работаем локально с бэкендом, то 8000 порт.
const api = axios.create({
  baseURL: 'http://localhost:8000'
});

export default api;

