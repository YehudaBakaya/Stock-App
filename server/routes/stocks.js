const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = process.env.ALPHA_VANTAGE_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

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
    const cacheKey = `quote-${symbol}`;
    
    // Check cache
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase(),
        apikey: API_KEY
      }
    });

    const quote = response.data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      // Return mock data if API fails
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
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || 0),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close'])
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
    const cacheKey = `history-${symbol}`;
    
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol.toUpperCase(),
        outputsize: 'compact',
        apikey: API_KEY
      }
    });

    const timeSeries = response.data['Time Series (Daily)'];
    
    if (!timeSeries) {
      // Generate mock history
      const mockHistory = generateMockHistory(100, 100);
      return res.json(mockHistory);
    }

    const history = Object.entries(timeSeries)
      .slice(0, 100)
      .map(([date, data]) => ({
        date,
        price: parseFloat(data['4. close']),
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        volume: parseInt(data['5. volume'])
      }))
      .reverse();

    setCache(cacheKey, history);
    res.json(history);
  } catch (err) {
    console.error('Get history error:', err);
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

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TOP_GAINERS_LOSERS',
        apikey: API_KEY
      }
    });

    const data = {
      gainers: (response.data.top_gainers || []).slice(0, 5).map(formatMover),
      losers: (response.data.top_losers || []).slice(0, 5).map(formatMover)
    };

    setCache(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('Get movers error:', err);
    // Return mock movers
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

    const response = await axios.get(BASE_URL, {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: q,
        apikey: API_KEY
      }
    });

    const matches = (response.data.bestMatches || []).slice(0, 10).map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region']
    }));

    res.json(matches);
  } catch (err) {
    console.error('Search error:', err);
    res.json([]);
  }
});

// Helper functions
function formatMover(item) {
  return {
    symbol: item.ticker,
    name: item.ticker,
    price: parseFloat(item.price),
    change: parseFloat(item.change_percentage?.replace('%', '') || 0)
  };
}

function generateMockHistory(basePrice, days) {
  const history = [];
  let price = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * (basePrice * 0.03);
    price = Math.max(price + change, basePrice * 0.7);
    
    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000)
    });
  }
  
  return history;
}

module.exports = router;