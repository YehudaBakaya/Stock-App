import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Plus, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 192.50 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.30 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 145.20 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.80 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.75 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30 },
  { symbol: 'META', name: 'Meta Platforms', price: 485.20 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 632.10 },
];

export default function AddStockModal({ onClose, onAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredStocks = popularStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setBuyPrice(stock.price.toString());
  };

  const handleSubmit = async () => {
    if (!selectedStock || !shares || !buyPrice) return;
    
    setIsLoading(true);
    await onAdd({
      symbol: selectedStock.symbol,
      shares: parseFloat(shares),
      buyPrice: parseFloat(buyPrice),
      buyDate: new Date().toISOString().split('T')[0]
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg"
      >
        <Card>
          <div className="border-b border-gray-700/50 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg">הוסף מניה לתיק</h3>
              </div>
              <Button variant="ghost" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            {!selectedStock ? (
              <>
                {/* Search */}
                <Input
                  placeholder="חפש מניה..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={Search}
                />

                {/* Stock List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredStocks.map((stock) => (
                    <motion.div
                      key={stock.symbol}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                      onClick={() => handleSelectStock(stock)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{stock.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{stock.symbol}</p>
                          <p className="text-gray-500 text-sm">{stock.name}</p>
                        </div>
                      </div>
                      <p className="text-white font-bold">${stock.price.toFixed(2)}</p>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Selected Stock */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{selectedStock.symbol}</p>
                      <p className="text-gray-400 text-sm">{selectedStock.name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedStock(null)}>
                    שנה
                  </Button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <Input
                    type="number"
                    label="כמות מניות"
                    placeholder="100"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                  />
                  
                  <Input
                    type="number"
                    label="מחיר קנייה ($)"
                    placeholder="0.00"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                  />

                  {shares && buyPrice && (
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">סה״כ השקעה</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          ${(parseFloat(shares) * parseFloat(buyPrice)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!shares || !buyPrice || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'מוסיף...' : 'הוסף לתיק'}
                </Button>
              </>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}