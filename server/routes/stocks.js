const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = process.env.TWELVEDATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

// Cache for API responses (simple in-memory cache)
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

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

// Get stock quote
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { exchange } = req.query;
    const cacheKey = `quote-${symbol}`;
    
    // Check cache
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const params = {
      symbol: symbol.toUpperCase(),
      apikey: API_KEY
    };
    if (exchange) {
      params.exchange = exchange;
    }

    const response = await axios.get(`${BASE_URL}/quote`, { params });

    const quote = response.data || {};

    if (quote.status === 'error' || quote.code) {
      const mockData = {
        symbol: symbol.toUpperCase(),
        price: 100 + Math.random() * 100,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 10000000)
      };
      return res.json(mockData);
    }

    const data = {
      symbol: (quote.symbol || symbol).toUpperCase(),
      price: parseFloat(quote.price || 0),
      change: parseFloat(quote.change || 0),
      changePercent: parseFloat(quote.percent_change || 0),
      volume: parseInt(quote.volume || 0),
      high: parseFloat(quote.high || 0),
      low: parseFloat(quote.low || 0),
      open: parseFloat(quote.open || 0),
      previousClose: parseFloat(quote.previous_close || 0)
    };

    setCache(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Get quote error:', err);
    // Return mock data on error
    res.json({
      symbol: req.params.symbol.toUpperCase(),
      price: 100 + Math.random() * 100,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 10000000)
    });
  }
});

// Get stock history
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { exchange, outputsize, interval, allowMock } = req.query;
    const parsedOutputsize = Math.min(Math.max(parseInt(outputsize || 100, 10), 30), 400);
    const allowedIntervals = new Set(['1h', '1day', '1week', '1month']);
    const resolvedInterval = allowedIntervals.has(interval) ? interval : '1day';
    const cacheKey = `history-${symbol}-${resolvedInterval}-${parsedOutputsize}`;
    
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const symbolUpper = symbol.toUpperCase();
    const params = {
      symbol: symbolUpper,
      interval: resolvedInterval,
      outputsize: parsedOutputsize,
      apikey: API_KEY
    };
    if (exchange) {
      params.exchange = exchange;
    }

    let response = await axios.get(`${BASE_URL}/time_series`, { params });
    let timeSeries = response.data || {};

    if ((timeSeries.status === 'error' || !timeSeries.values) && symbolUpper === 'GOOG') {
      response = await axios.get(`${BASE_URL}/time_series`, {
        params: { ...params, symbol: 'GOOGL' }
      });
      timeSeries = response.data || {};
    }

    if (timeSeries.status === 'error' || !timeSeries.values) {
      if (allowMock === '0') {
        return res.status(502).json({
          message: timeSeries.message || timeSeries.code || 'History data unavailable'
        });
      }
      const mockHistory = generateMockHistory(100, 100);
      return res.json(mockHistory);
    }

    const history = timeSeries.values
      .map((item) => ({
        date: item.datetime,
        price: parseFloat(item.close),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        volume: parseInt(item.volume || 0)
      }))
      .reverse();

    setCache(cacheKey, history);
    res.json(history);
  } catch (err) {
    console.error('Get history error:', err);
    if (req.query.allowMock === '0') {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.code ||
        'History data unavailable';
      return res.status(502).json({ message });
    }
    res.json(generateMockHistory(100, 100));
  }
});

// Get top movers
router.get('/movers', async (req, res) => {
  try {
    const cacheKey = 'movers';
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const symbols = [
      'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA',
      'META', 'NFLX', 'AMD', 'BABA', 'DIS', 'INTC'
    ];

    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        const response = await axios.get(`${BASE_URL}/quote`, {
          params: {
            symbol,
            apikey: API_KEY
          }
        });
        const quote = response.data || {};
        return {
          symbol,
          name: symbol,
          price: parseFloat(quote.price || 0),
          change: parseFloat(quote.percent_change || 0)
        };
      })
    );

    const validQuotes = quotes.filter((item) => Number.isFinite(item.change) && Number.isFinite(item.price) && item.price > 0);
    const sorted = validQuotes.sort((a, b) => b.change - a.change);
    const data = {
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse()
    };

    setCache(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Get movers error:', err);
    res.json({
      gainers: [
        { symbol: 'NVDA', name: 'NVIDIA', price: 875.30, change: 8.45 },
        { symbol: 'META', name: 'Meta', price: 485.20, change: 5.21 },
        { symbol: 'AMD', name: 'AMD', price: 168.50, change: 4.32 }
      ],
      losers: [
        { symbol: 'TSLA', name: 'Tesla', price: 245.80, change: -3.49 },
        { symbol: 'BABA', name: 'Alibaba', price: 78.20, change: -2.87 },
        { symbol: 'DIS', name: 'Disney', price: 95.40, change: -1.95 }
      ]
    });
  }
});

// Search stocks
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 1) {
      return res.json([]);
    }

    const cacheKey = `search-${q.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(`${BASE_URL}/symbol_search`, {
      params: {
        symbol: q,
        apikey: API_KEY
      }
    });

    const matches = (response.data.data || []).slice(0, 10).map(match => ({
      symbol: match.symbol,
      name: match.instrument_name,
      type: match.instrument_type,
      region: match.exchange
    }));

    setCache(cacheKey, matches);
    res.json(matches);
  } catch (err) {
    console.error('Search error:', err);
    res.json([]);
  }
});

// Helper functions
function generateMockHistory(basePrice, days) {
  const history = [];
  let price = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * (basePrice * 0.03);
    const open = price;
    const close = Math.max(price + change, basePrice * 0.7);
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.01);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.01);
    price = close;

    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(close.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000)
    });
  }
  
  return history;
}

module.exports = router;
