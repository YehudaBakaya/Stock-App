import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Plus, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { searchStocks, getStockQuote } from '../../api/api';

export default function AddStockModal({ onClose, onAdd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [portfolioType, setPortfolioType] = useState('long');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    let active = true;
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError('');
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);
    setSearchError('');
    const handle = setTimeout(async () => {
      try {
        const res = await searchStocks(query);
        if (active) {
          setSearchResults(res.data || []);
        }
      } catch (err) {
        if (active) {
          setSearchResults([]);
          setSearchError('Search failed. Try again.');
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [searchQuery]);

  const handleSelectStock = async (stock) => {
    setSelectedStock(stock);
    try {
      const res = await getStockQuote(stock.symbol);
      const price = res.data?.price;
      if (price) {
        setBuyPrice(price.toString());
      }
    } catch {
      setBuyPrice('');
    }
  };

  const handleSubmit = async () => {
    if (!selectedStock || !shares || !buyPrice) return;
    
    setIsLoading(true);
    await onAdd({
      symbol: selectedStock.symbol,
      shares: parseFloat(shares),
      buyPrice: parseFloat(buyPrice),
      buyDate: new Date().toISOString().split('T')[0],
      portfolioType
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
          <div className="border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-lg shadow-lg shadow-emerald-500/20">
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
                  {isSearching && (
                    <div className="text-sm text-slate-400">מחפש מניות...</div>
                  )}
                  {searchError && (
                    <div className="text-sm text-rose-300">{searchError}</div>
                  )}
                  {!isSearching && !searchError && searchResults.length === 0 && (
                    <div className="text-sm text-slate-400">אין תוצאות</div>
                  )}
                  {searchResults.map((stock) => (
                    <motion.div
                      key={stock.symbol}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors border border-white/10"
                    onClick={() => handleSelectStock(stock)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="text-white font-bold text-sm">{stock.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{stock.symbol}</p>
                        <p className="text-slate-500 text-sm">{stock.name}</p>
                      </div>
                    </div>
                    <p className="text-white font-bold">
                      {stock.exchange || stock.region || ''}
                    </p>
                  </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Selected Stock */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/15 to-amber-500/10 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{selectedStock.symbol}</p>
                      <p className="text-slate-400 text-sm">{selectedStock.name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedStock(null)}>
                    שנה
                  </Button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPortfolioType('long')}
                      className={`px-3 py-2 rounded-full border ${
                        portfolioType === 'long'
                          ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      טווח ארוך
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortfolioType('trade')}
                      className={`px-3 py-2 rounded-full border ${
                        portfolioType === 'trade'
                          ? 'border-amber-300/50 bg-amber-400/10 text-amber-200'
                          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      טריידים
                    </button>
                  </div>
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
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">סה״כ השקעה</span>
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
