const axios = require('axios');

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 דקות — נתוני פרופיל משתנים לאט

const cache = new Map();

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.ts < CACHE_TTL) return item.data;
  cache.delete(key);
  return null;
}

async function getCompanyProfile(symbol) {
  if (!FINNHUB_KEY) return null;
  const key = `profile-${symbol}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${BASE_URL}/stock/profile2`, {
      params: { symbol, token: FINNHUB_KEY }
    });
    if (!data.ticker) return null;
    const result = {
      name: data.name,
      ticker: data.ticker,
      logo: data.logo,
      exchange: data.exchange,
      industry: data.finnhubIndustry,
      country: data.country,
      website: data.weburl,
      marketCap: data.marketCapitalization,
    };
    cache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}

async function getAnalystRatings(symbol) {
  if (!FINNHUB_KEY) return null;
  const key = `ratings-${symbol}`;
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const { data } = await axios.get(`${BASE_URL}/stock/recommendation`, {
      params: { symbol, token: FINNHUB_KEY }
    });
    const latest = data[0];
    if (!latest) return null;
    const result = {
      period: latest.period,
      buy: latest.buy,
      hold: latest.hold,
      sell: latest.sell,
      strongBuy: latest.strongBuy,
      strongSell: latest.strongSell,
    };
    cache.set(key, { data: result, ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}

module.exports = { getCompanyProfile, getAnalystRatings };
