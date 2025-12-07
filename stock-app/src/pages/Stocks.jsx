import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, TrendingDown, Star, BarChart3 } from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import OrderBook from "../components/trading/OrderBook";

const mockStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 192.50, change: 2.30, changePercent: 1.21, volume: '2.3M', marketCap: '3.01T', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.30, change: -3.50, changePercent: -0.82, volume: '1.8M', marketCap: '3.12T', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 145.20, change: 3.10, changePercent: 2.18, volume: '1.5M', marketCap: '1.84T', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80, change: -8.90, changePercent: -3.49, volume: '4.2M', marketCap: '782B', sector: 'Automotive' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.75, change: 1.85, changePercent: 1.20, volume: '2.1M', marketCap: '1.61T', sector: 'E-commerce' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change: 12.50, changePercent: 1.45, volume: '3.2M', marketCap: '2.15T', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 485.20, change: -5.80, changePercent: -1.18, volume: '1.9M', marketCap: '1.23T', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 632.10, change: 8.75, changePercent: 1.40, volume: '890K', marketCap: '281B', sector: 'Entertainment' },
];

export default function Stocks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(mockStocks[0]);
  const [sortBy, setSortBy] = useState('symbol');
  const navigate = useNavigate();

  const filteredStocks = mockStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    switch (sortBy) {
      case 'changePercent':
        return b.changePercent - a.changePercent;
      case 'volume':
        return parseFloat(b.volume) - parseFloat(a.volume);
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">
              Stock Market
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Explore and trade stocks
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock List */}
          <div className="lg:col-span-2">
            <Card className="p-0">
              {/* Sort Options */}
              <div className="p-4 border-b border-border">
                <div className="flex gap-2 text-sm">
                  <Button
                    variant={sortBy === 'symbol' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('symbol')}
                  >
                    Symbol
                  </Button>
                  <Button
                    variant={sortBy === 'changePercent' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('changePercent')}
                  >
                    % Change
                  </Button>
                  <Button
                    variant={sortBy === 'volume' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('volume')}
                  >
                    Volume
                  </Button>
                  <Button
                    variant={sortBy === 'price' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSortBy('price')}
                  >
                    Price
                  </Button>
                </div>
              </div>

              {/* Stock List */}
              <div className="divide-y divide-border">
                {sortedStocks.map((stock, index) => (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      selectedStock?.symbol === stock.symbol ? 'bg-muted/50 border-l-4 border-primary' : ''
                    }`}
                    onClick={() => handleStockSelect(stock)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-foreground text-lg">
                              {stock.symbol}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {stock.sector}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Star className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{stock.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Vol: {stock.volume} | Cap: {stock.marketCap}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-foreground text-xl mb-1">
                          ${stock.price.toFixed(2)}
                        </p>
                        <div
                          className={`flex items-center justify-end gap-1 ${
                            stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {stock.change >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <div className="text-right">
                            <div className="font-medium">
                              {stock.change >= 0 ? '+' : ''}
                              ${stock.change.toFixed(2)}
                            </div>
                            <div className="text-sm">({stock.changePercent.toFixed(2)}%)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
