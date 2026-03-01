const axios = require('axios');

const API_KEY = process.env.TWELVEDATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

// סטטוס API אחרון — משמש את /api/status
const lastApiStatus = { source: 'unknown', updatedAt: null };

// מזהה סוג סמל ומטבע
function classifySymbol(symbol) {
  const s = symbol.toUpperCase();
  if (s.includes('/')) return { type: 'crypto', currency: 'USD' };
  if (s.startsWith('TASE:')) return { type: 'tase', currency: 'ILS' };
  return { type: 'stock', currency: 'USD' };
}

async function getQuote(symbol) {
  const key = `quote-${symbol.toUpperCase()}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
  cache.delete(key);

  const { currency } = classifySymbol(symbol);

  try {
    const { data: quote } = await axios.get(`${BASE_URL}/quote`, {
      params: { symbol: symbol.toUpperCase(), apikey: API_KEY }
    });
    if (quote.status === 'error' || quote.code) {
      lastApiStatus.source = 'mock';
      lastApiStatus.updatedAt = Date.now();
      return null;
    }
    lastApiStatus.source = 'real';
    lastApiStatus.updatedAt = Date.now();
    const data = {
      symbol: symbol.toUpperCase(),
      price: parseFloat(quote.price || 0),
      changePercent: parseFloat(quote.percent_change || 0),
      currency
    };
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch {
    lastApiStatus.source = 'mock';
    lastApiStatus.updatedAt = Date.now();
    return null;
  }
}

module.exports = { getQuote, lastApiStatus, classifySymbol };
