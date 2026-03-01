import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return `${origin}/api`;
  }
  return 'http://localhost:5001/api';
};

const API_URL = getApiUrl();

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('tradingGoals');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const refreshToken = () => api.post('/auth/refresh');

// Portfolio
export const getHoldings = () => api.get('/portfolio');
export const addHolding = (data) => api.post('/portfolio', data);
export const deleteHolding = (id, sellPrice) => api.delete(`/portfolio/${id}`, { data: { sellPrice } });

// Watchlist
export const getWatchlist = () => api.get('/watchlist');
export const addToWatchlist = (symbol) => api.post('/watchlist', { symbol });
export const removeFromWatchlist = (symbol) => api.delete(`/watchlist/${symbol}`);

// Transactions
export const getTransactions = () => api.get('/transactions');

// Alerts
export const getAlerts = () => api.get('/alerts');
export const createAlert = (data) => api.post('/alerts', data);
export const deleteAlert = (id) => api.delete(`/alerts/${id}`);
export const toggleAlert = (id) => api.patch(`/alerts/${id}/toggle`);

// Stocks
export const getStockQuote = (symbol, params = {}) => api.get(`/stocks/quote/${encodeURIComponent(symbol)}`, { params });
export const getStockHistory = (symbol, params = {}) => api.get(`/stocks/history/${encodeURIComponent(symbol)}`, { params });
export const getTopMovers = () => api.get('/stocks/movers');
export const searchStocks = (query) => api.get('/stocks/search', { params: { q: query } });
export const getCompanyProfile = (symbol) => api.get(`/stocks/profile/${encodeURIComponent(symbol)}`);
export const getAnalystRatings = (symbol) => api.get(`/stocks/ratings/${encodeURIComponent(symbol)}`);

// API Status
export const getApiStatus = () => api.get('/status');

// News
export const getMarketNews = (params = {}) => api.get('/news', { params });

// Telegram
export const getTelegramSettings = () => api.get('/telegram');
export const saveTelegramSettings = (data) => api.post('/telegram', data);
export const sendTelegramTest = () => api.post('/telegram/test');

// Trading Goals
export const getTradingGoals = () => api.get('/trading-goals');
export const saveTradingGoals = (data) => api.post('/trading-goals', data);

export const getBrokerConnections = () => api.get('/brokers');
export const saveBrokerConnection = (data) => api.post('/brokers', data);

export default api;
