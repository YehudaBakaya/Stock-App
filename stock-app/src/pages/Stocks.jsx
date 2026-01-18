import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, TrendingDown, Star, BarChart3 } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OrderBook from "../components/trading/OrderBook";
import { getStockQuote, searchStocks } from "../api/api";

const initialStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', marketCap: '3.01T', sector: 'Technology', exchange: 'NYSE' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', marketCap: '3.12T', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', marketCap: '1.84T', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', marketCap: '782B', sector: 'Automotive', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', marketCap: '1.61T', sector: 'E-commerce', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', marketCap: '2.15T', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', marketCap: '1.23T', sector: 'Technology', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', marketCap: '281B', sector: 'Entertainment', exchange: 'NASDAQ' },
];

const formatVolume = (value) => {
  if (value == null || Number.isNaN(value)) return '—';
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
};

export default function Stocks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [trackedStocks, setTrackedStocks] = useState(initialStocks);
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(initialStocks[0]);
  const [sortBy, setSortBy] = useState('symbol');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchQuotes = async () => {
      setLoadError('');
      try {
        const quotes = await Promise.all(
          trackedStocks.map(async (stock) => {
            const res = await getStockQuote(stock.symbol, stock.exchange ? { exchange: stock.exchange } : {});
            const quote = res.data || {};
            const volumeRaw = quote.volume ?? 0;
            return {
              ...stock,
              price: quote.price ?? 0,
              change: quote.change ?? 0,
              changePercent: quote.changePercent ?? 0,
              volume: formatVolume(volumeRaw),
              volumeRaw,
              open: quote.open,
              high: quote.high,
              low: quote.low,
              previousClose: quote.previousClose,
            };
          })
        );

        if (!cancelled) {
          setStocks(quotes);
          setSelectedStock((current) => {
            const updated = quotes.find((s) => s.symbol === current?.symbol);
            return updated || quotes[0];
          });
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError('Failed to load live quotes. Showing cached data.');
          setStocks((prev) => {
            if (prev.length > 0) return prev;
            return trackedStocks.map((stock) => ({
              ...stock,
              price: 0,
              change: 0,
              changePercent: 0,
              volume: '—',
              volumeRaw: 0,
            }));
          });
          setLoading(false);
        }
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [trackedStocks]);

  useEffect(() => {
    let active = true;
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await searchStocks(query);
        if (active) {
          setSearchResults(res.data || []);
        }
      } catch (err) {
        if (active) {
          setSearchResults([]);
        }
      } finally {
        if (active) {
          setSearching(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [searchQuery]);

  const filteredStocks = useMemo(() => {
    return stocks;
  }, [stocks]);

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    switch (sortBy) {
      case 'changePercent':
        return b.changePercent - a.changePercent;
      case 'volume':
        return (b.volumeRaw ?? 0) - (a.volumeRaw ?? 0);
      case 'price':
        return b.price - a.price;
      default:
        return a.symbol.localeCompare(b.symbol);
    }
  });

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    navigate(createPageUrl(`StockDetail?symbol=${stock.symbol}`));
  };

  const handleAddStock = (stock) => {
    const symbol = stock.symbol.toUpperCase();
    setTrackedStocks((prev) => {
      if (prev.some((item) => item.symbol === symbol)) {
        return prev;
      }
      return [
        ...prev,
        {
          symbol,
          name: stock.name || symbol,
          sector: stock.type || 'Other',
          marketCap: stock.region || '—',
          exchange: stock.exchange || stock.region || '',
        },
      ];
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen app-bg p-4 md:p-6 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-display text-white mb-1">
              Stock Market
            </h1>
            <p className="text-slate-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Explore and trade stocks
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
              {searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-[#0f1722] border border-white/10 rounded-xl shadow-xl z-20 max-h-72 overflow-auto">
                  {searching && (
                    <div className="px-4 py-3 text-sm text-slate-400">Searching...</div>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400">No results</div>
                  )}
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      type="button"
                      onClick={() => handleAddStock(result)}
                      className="w-full text-right px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{result.symbol}</p>
                          <p className="text-slate-400 text-xs">{result.name}</p>
                        </div>
                        <span className="text-xs text-slate-500">{result.exchange || result.region}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </motion.div>

        {loadError && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl px-4 py-3 text-sm">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock List */}
          <div className="lg:col-span-2">
            <Card className="p-0">
              {/* Sort Options */}
              <div className="p-4 border-b border-white/10">
                <div className="flex gap-2 text-sm">
                  <Button
                    variant={sortBy === 'symbol' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('symbol')}
                  >
                    Symbol
                  </Button>
                  <Button
                    variant={sortBy === 'changePercent' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('changePercent')}
                  >
                    % Change
                  </Button>
                  <Button
                    variant={sortBy === 'volume' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('volume')}
                  >
                    Volume
                  </Button>
                  <Button
                    variant={sortBy === 'price' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('price')}
                  >
                    Price
                  </Button>
                </div>
              </div>

              {/* Stock List */}
              <div className="divide-y divide-white/10">
                {loading && (
                  <div className="p-6 text-slate-400 text-sm">Loading live market data...</div>
                )}
                {sortedStocks.map((stock, index) => {
                  const displayPrice = stock.previousClose ?? stock.price ?? 0;
                  const livePrice = stock.price ?? displayPrice;
                  const changeValue = stock.previousClose ? livePrice - stock.previousClose : stock.change ?? 0;
                  const changePercentValue = stock.previousClose
                    ? (stock.previousClose ? (changeValue / stock.previousClose) * 100 : 0)
                    : stock.changePercent ?? 0;
                  const isUp = changeValue >= 0;

                  return (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                      selectedStock?.symbol === stock.symbol ? 'bg-white/5 border-l-4 border-emerald-400' : ''
                    }`}
                    onClick={() => handleStockSelect(stock)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-lg">
                              {stock.symbol}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {stock.sector}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Star className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-slate-400">{stock.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Vol: {stock.volume} | Cap: {stock.marketCap}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-white text-xl mb-1">
                          ${displayPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 mb-1">Last close</p>
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isUp ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <div className="text-right">
                            <div className="font-medium">
                              {isUp ? '+' : ''}
                              ${changeValue.toFixed(2)}
                            </div>
                            <div className="text-sm">({changePercentValue.toFixed(2)}%)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Order Book */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <OrderBook symbol={selectedStock?.symbol} currentPrice={selectedStock?.price} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
