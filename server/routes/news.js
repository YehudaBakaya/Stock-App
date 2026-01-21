const express = require('express');
const axios = require('axios');

const router = express.Router();

const API_KEY = process.env.MARKETAUX_API_KEY;
const BASE_URL = 'https://api.marketaux.com/v1/news/all';

const cache = new Map();
const CACHE_TTL = 60000;

const getCached = (key) => {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

router.get('/', async (req, res) => {
  try {
    const symbols = req.query.symbols;
    const cacheKey = `news-${symbols || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const params = {
      api_token: API_KEY,
      filter_entities: true,
      language: 'en',
      limit: 10,
    };
    if (symbols) {
      params.symbols = symbols;
    }

    const response = await axios.get(BASE_URL, { params });
    const data = (response.data && response.data.data) || [];

    const isMarketNews = (item) => {
      const title = (item.title || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const topics = (item.topics || []).map((topic) => topic.toLowerCase());
      const keywords = ['market', 'markets', 'stock', 'stocks', 'finance', 'economy', 'equities', 'nasdaq', 'nyse', 'wall street'];
      return (
        keywords.some((word) => title.includes(word)) ||
        keywords.some((word) => category.includes(word)) ||
        topics.some((topic) => keywords.some((word) => topic.includes(word)))
      );
    };

    const normalizeItem = (item) => ({
      id: item.uuid || item.id,
      title: item.title,
      source: (item.source && item.source.name) || item.source || item.source_name || 'Market',
      time: item.published_at,
      category: item.category || (item.topics && item.topics[0]) || 'Market',
      url: item.url,
    });

    const normalizedAll = data.map(normalizeItem);
    const filteredMarket = data.filter(isMarketNews).map(normalizeItem);
    const baseList = filteredMarket.length > 0 ? filteredMarket : normalizedAll;

    const timestamps = baseList
      .map((item) => new Date(item.time).getTime())
      .filter((value) => Number.isFinite(value));
    const latest = timestamps.length > 0 ? Math.max(...timestamps) : null;
    const cutoff = latest ? latest - 7 * 24 * 60 * 60 * 1000 : null;

    const normalized = cutoff
      ? baseList.filter((item) => {
          const time = new Date(item.time).getTime();
          return Number.isFinite(time) && time >= cutoff;
        })
      : baseList;

    setCache(cacheKey, normalized);
    res.json(normalized);
  } catch (err) {
    console.error('Marketaux news error:', err);
    res.json([]);
  }
});

module.exports = router;
