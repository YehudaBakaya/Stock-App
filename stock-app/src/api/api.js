import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

// Portfolio
export const getHoldings = () => api.get('/portfolio');
export const addHolding = (data) => api.post('/portfolio', data);
export const deleteHolding = (id) => api.delete(`/portfolio/${id}`);

// Stocks
export const getStockQuote = (symbol, params = {}) => api.get(`/stocks/quote/${symbol}`, { params });
export const getStockHistory = (symbol, params = {}) => api.get(`/stocks/history/${symbol}`, { params });
export const getTopMovers = () => api.get('/stocks/movers');
export const searchStocks = (query) => api.get('/stocks/search', { params: { q: query } });

// News
export const getMarketNews = (params = {}) => api.get('/news', { params });

// Telegram
export const getTelegramSettings = () => api.get('/telegram');
export const saveTelegramSettings = (data) => api.post('/telegram', data);
export const sendTelegramTest = () => api.post('/telegram/test');

export default api;
