import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Plus, Trash2, Bell, BellOff, Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import {
  getWatchlist, addToWatchlist, removeFromWatchlist,
  getAlerts, createAlert, deleteAlert, toggleAlert,
  getStockQuote, searchStocks
} from '../api/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useLivePrices } from '../context/WebSocketContext';
import { formatPrice, getCurrency } from '../utils/symbolUtils';

export default function Watchlist() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { livePrices, subscribe, unsubscribe } = useLivePrices();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Alert form state
  const [alertSymbol, setAlertSymbol] = useState('');
  const [alertCondition, setAlertCondition] = useState('above');
  const [alertPrice, setAlertPrice] = useState('');

  // Fetch watchlist
  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await getWatchlist();
      return res.data;
    }
  });

  // טעינה ראשונית של מחירים
  const { data: watchlistPrices = {} } = useQuery({
    queryKey: ['watchlistPrices', watchlist.map(w => w.symbol).join(',')],
    queryFn: async () => {
      const prices = {};
      await Promise.allSettled(
        watchlist.map(async (item) => {
          try {
            const res = await getStockQuote(item.symbol);
            prices[item.symbol] = res.data;
          } catch {}
        })
      );
      return prices;
    },
    enabled: watchlist.length > 0,
    // אין refetchInterval — WebSocket מטפל בעדכונים חיים
  });

  // מנוי WebSocket לסמלי ה-Watchlist
  useEffect(() => {
    if (watchlist.length === 0) return;
    const symbols = watchlist.map((w) => w.symbol);
    subscribe(symbols);
    return () => unsubscribe(symbols);
  }, [watchlist]);

  // Fetch alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await getAlerts();
      return res.data;
    }
  });

  // Add to watchlist mutation
  const addWatchlistMutation = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
      setSearchQuery('');
      setSearchResults([]);
      addToast('success', 'נוסף לרשימת המעקב');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'שגיאה בהוספה';
      addToast('error', msg);
    }
  });

  // Remove from watchlist mutation
  const removeWatchlistMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist']);
      addToast('success', 'הוסר מרשימת המעקב');
    },
    onError: () => addToast('error', 'שגיאה בהסרה')
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      setAlertSymbol('');
      setAlertPrice('');
      addToast('success', 'ההתראה נוצרה');
    },
    onError: () => addToast('error', 'שגיאה ביצירת התראה')
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
      addToast('success', 'ההתראה נמחקה');
    },
    onError: () => addToast('error', 'שגיאה במחיקת התראה')
  });

  // Toggle alert mutation
  const toggleAlertMutation = useMutation({
    mutationFn: toggleAlert,
    onSuccess: () => queryClient.invalidateQueries(['alerts']),
    onError: () => addToast('error', 'שגיאה בעדכון התראה')
  });

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await searchStocks(query);
      setSearchResults(res.data?.slice(0, 5) || []);
    } catch {
      setSearchResults([]);
    }
  };

  const handleCreateAlert = (e) => {
    e.preventDefault();
    if (!alertSymbol || !alertPrice) return;
    createAlertMutation.mutate({
      symbol: alertSymbol.toUpperCase(),
      condition: alertCondition,
      targetPrice: parseFloat(alertPrice)
    });
  };

  return (
    <div className="min-h-screen app-bg p-4 md:p-6 pb-24 md:pb-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black font-display bg-gradient-to-r from-white via-emerald-100 to-amber-100 bg-clip-text text-transparent">
            רשימת מעקב
          </h1>
          <p className="text-slate-400 mt-2">עקוב אחרי מניות והגדר התראות מחיר</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Watchlist Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">רשימת מעקב</h2>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="חפש מניה להוספה..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full right-0 left-0 mt-1 bg-[#0f1722] border border-white/10 rounded-xl overflow-hidden z-10">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.symbol}
                        onClick={() => addWatchlistMutation.mutate(stock.symbol)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors text-sm"
                      >
                        <span className="font-medium text-white">{stock.symbol}</span>
                        <span className="text-slate-400 truncate max-w-[60%] text-right">{stock.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Watchlist items */}
              {watchlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                  <Star className="w-10 h-10 text-slate-600" />
                  <p className="text-slate-400 text-sm">רשימת המעקב ריקה</p>
                  <p className="text-slate-500 text-xs">חפש מניה למעלה כדי להוסיף</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlist.map((item) => {
                    const priceData = livePrices[item.symbol] || watchlistPrices[item.symbol];
                    const change = priceData?.changePercent ?? 0;
                    const currency = priceData?.currency || getCurrency(item.symbol);
                    return (
                      <div
                        key={item.symbol}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-400">{item.symbol.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{item.symbol}</p>
                            {priceData && (
                              <p className={`text-xs ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {priceData?.price && (
                            <p className="text-white font-semibold text-sm">{formatPrice(priceData.price, currency)}</p>
                          )}
                          <button
                            onClick={() => removeWatchlistMutation.mutate(item.symbol)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Price Alerts Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-xl">
                  <Bell className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">התראות מחיר</h2>
              </div>

              {/* Create Alert Form */}
              <form onSubmit={handleCreateAlert} className="space-y-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-sm font-medium text-slate-300">צור התראה חדשה</p>
                <input
                  type="text"
                  value={alertSymbol}
                  onChange={(e) => setAlertSymbol(e.target.value.toUpperCase())}
                  placeholder="סמל מניה (AAPL)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertCondition('above')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      alertCondition === 'above'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" /> מעל
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertCondition('below')}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                      alertCondition === 'below'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" /> מתחת
                  </button>
                </div>
                <input
                  type="number"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  placeholder="מחיר יעד ($)"
                  min="0"
                  step="0.01"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm"
                />
                <Button type="submit" className="w-full" disabled={createAlertMutation.isPending}>
                  <Plus className="w-4 h-4 ml-2" />
                  צור התראה
                </Button>
              </form>

              {/* Alerts List */}
              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                  <Bell className="w-10 h-10 text-slate-600" />
                  <p className="text-slate-400 text-sm">אין התראות פעילות</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert._id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        alert.isActive
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/[0.02] border-white/5 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <div>
                          <p className="text-sm font-semibold text-white flex items-center gap-1">
                            {alert.symbol}
                            {alert.condition === 'above'
                              ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                              : <TrendingDown className="w-3 h-3 text-rose-400" />
                            }
                            ${alert.targetPrice}
                          </p>
                          <p className="text-xs text-slate-400">
                            {alert.isActive
                              ? 'פעיל'
                              : `הופעל: ${new Date(alert.triggeredAt).toLocaleDateString('he-IL')}`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAlertMutation.mutate(alert._id)}
                          className="text-slate-400 hover:text-emerald-400 transition-colors"
                          title={alert.isActive ? 'השבת' : 'הפעל מחדש'}
                        >
                          {alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteAlertMutation.mutate(alert._id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
