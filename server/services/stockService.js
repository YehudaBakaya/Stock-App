const axios = require('axios');

const API_KEY = process.env.TWELVEDATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function getQuote(symbol) {
  const key = `quote-${symbol.toUpperCase()}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
  cache.delete(key);

  try {
    const { data: quote } = await axios.get(`${BASE_URL}/quote`, {
      params: { symbol: symbol.toUpperCase(), apikey: API_KEY }
    });
    if (quote.status === 'error' || quote.code) return null;
    const data = {
      symbol: symbol.toUpperCase(),
      price: parseFloat(quote.price || 0),
      changePercent: parseFloat(quote.percent_change || 0)
    };
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch {
    return null;
  }
}

module.exports = { getQuote };
