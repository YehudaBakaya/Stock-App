import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, TrendingUp, Wallet, Activity, Send, Briefcase, Download } from 'lucide-react';
import { getHoldings, addHolding, deleteHolding, getTelegramSettings, saveTelegramSettings, deleteTelegramSettings, getStockQuote } from '../api/api';
import { exportHoldingsToCSV } from '../utils/export';
import { useToast } from '../context/ToastContext';
import { HoldingRowSkeleton } from '../components/ui/Skeleton';
import { useLivePrices } from '../context/WebSocketContext';

import PortfolioPieChart from '../components/portfolio/PortfolioPieChart';
import HoldingsList from '../components/portfolio/HoldingsList';
import StockChart from '../components/portfolio/StockChart';
import AddStockModal from '../components/portfolio/AddStockModal';
import MarketNews from '../components/market/MarketNews';
import TopMovers from '../components/market/TopMovers';
import TelegramSettings from '../components/telegram/TelegramSettings';
import BrokerConnections from '../components/portfolio/BrokerConnections';
import InstallPrompt from '../components/ui/InstallPrompt';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { livePrices, subscribe, unsubscribe } = useLivePrices();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [showTelegramSettings, setShowTelegramSettings] = useState(false);
  const [stockPrices, setStockPrices] = useState({});
  const [portfolioFilter, setPortfolioFilter] = useState('all');

  // Fetch holdings
  const { data: holdings = [], isLoading, refetch } = useQuery({
    queryKey: ['holdings'],
    queryFn: async () => {
      const res = await getHoldings();
      return res.data;
    }
  });

  // Fetch telegram settings
  const { data: telegramSettings } = useQuery({
    queryKey: ['telegramSettings'],
    queryFn: async () => {
      const res = await getTelegramSettings();
      return res.data;
    }
  });

  // Add holding mutation
  const addMutation = useMutation({
    mutationFn: addHolding,
    onSuccess: () => {
      queryClient.invalidateQueries(['holdings']);
      setShowAddModal(false);
      addToast('success', 'המניה נוספה לתיק');
    },
    onError: () => addToast('error', 'שגיאה בהוספת המניה'),
  });

  // Delete holding mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, sellPrice }) => deleteHolding(id, sellPrice),
    onSuccess: () => {
      queryClient.invalidateQueries(['holdings']);
      addToast('success', 'המניה הוסרה מהתיק');
    },
    onError: () => addToast('error', 'שגיאה במחיקת המניה'),
  });

  // Save telegram settings mutation
  const saveTelegramMutation = useMutation({
    mutationFn: saveTelegramSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['telegramSettings']);
      addToast('success', 'הגדרות טלגרם נשמרו');
    },
    onError: () => addToast('error', 'שגיאה בשמירת הגדרות טלגרם'),
  });

  // Delete telegram settings mutation
  const deleteTelegramMutation = useMutation({
    mutationFn: deleteTelegramSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['telegramSettings']);
      setShowTelegramSettings(false);
      addToast('success', 'טלגרם נותק');
    },
    onError: () => addToast('error', 'שגיאה בניתוק טלגרם'),
  });


  // טעינת מחירים ראשונית + מנוי WebSocket
  useEffect(() => {
    if (holdings.length === 0) return;

    const symbols = holdings.map((h) => h.symbol);
    subscribe(symbols);

    // טעינה ראשונית (fallback לפני שה-WebSocket מתחבר)
    const fetchPrices = async () => {
      const prices = {};
      for (const holding of holdings) {
        try {
          const res = await getStockQuote(holding.symbol);
          prices[holding.symbol] = {
            price: res.data.price,
            change: res.data.changePercent,
            currency: res.data.currency || 'USD'
          };
        } catch {
          prices[holding.symbol] = {
            price: holding.buyPrice * (1 + (Math.random() - 0.5) * 0.1),
            change: (Math.random() - 0.5) * 10,
            currency: 'USD'
          };
        }
      }
      setStockPrices(prices);
    };
    fetchPrices();

    return () => unsubscribe(symbols);
  }, [holdings]);

  // מיזוג מחירי WebSocket (חיים) עם מחירי fallback
  const prices = { ...stockPrices };
  Object.entries(livePrices).forEach(([sym, data]) => {
    prices[sym] = { price: data.price, change: data.changePercent, currency: data.currency };
  });

  // Calculate portfolio stats
  const totalValue = holdings.reduce((sum, holding) => {
    const price = prices[holding.symbol]?.price || holding.buyPrice;
    return sum + (holding.shares * price);
  }, 0);

  const totalCost = holdings.reduce((sum, holding) => {
    return sum + (holding.shares * holding.buyPrice);
  }, 0);

  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? ((totalPnL / totalCost) * 100) : 0;

  const filteredHoldings = holdings.filter((holding) => {
    if (portfolioFilter === 'all') return true;
    return holding.portfolioType === portfolioFilter;
  });

  const filteredValue = filteredHoldings.reduce((sum, holding) => {
    const price = prices[holding.symbol]?.price || holding.buyPrice;
    return sum + (holding.shares * price);
  }, 0);

  const topHoldings = [...filteredHoldings]
    .map((holding) => {
      const price = prices[holding.symbol]?.price || holding.buyPrice;
      return {
        symbol: holding.symbol,
        value: holding.shares * price
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const dailyPnL = filteredHoldings.reduce((sum, holding) => {
    const price = prices[holding.symbol]?.price || holding.buyPrice;
    const change = prices[holding.symbol]?.change || 0;
    return sum + (holding.shares * price * (change / 100));
  }, 0);

  return (
    <div className="min-h-screen app-bg p-4 md:p-6 pb-24 md:pb-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-black font-display bg-gradient-to-r from-white via-emerald-100 to-amber-100 bg-clip-text text-transparent">
              שלום! 👋
            </h1>
            <p className="text-slate-400 mt-2 text-lg">הנה סקירה של התיק שלך היום</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
              רענן
            </Button>
            {holdings.length > 0 && (
              <Button variant="outline" onClick={() => exportHoldingsToCSV(holdings, stockPrices)}>
                <Download className="w-4 h-4 ml-2" />
                ייצוא CSV
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowTelegramSettings(!showTelegramSettings)}>
              <Send className="w-4 h-4 ml-2" />
              טלגרם
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף מניה
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card gradient="purple">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">שווי תיק</p>
                <p className="text-3xl font-black text-white">${totalValue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-2xl shadow-lg shadow-emerald-500/20">
                <Wallet className="w-8 h-8 text-white" />
              </div>
            </div>
          </Card>

          <Card gradient={totalPnL >= 0 ? 'green' : 'red'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">רווח/הפסד כולל</p>
                <p className={`text-3xl font-black ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(0)}$
                </p>
                <p className={`text-sm ${totalPnL >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                  ({totalPnLPercent.toFixed(2)}%)
                </p>
              </div>
              <div className={`p-4 rounded-2xl ${totalPnL >= 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-300 shadow-lg shadow-emerald-500/20' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </Card>

          <Card gradient="blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">מספר מניות</p>
                <p className="text-3xl font-black text-white">{holdings.length}</p>
                <p className="text-cyan-300/70 text-sm">נכסים בתיק</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-cyan-400 to-sky-300 rounded-2xl shadow-lg shadow-cyan-500/20">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Telegram Settings (Collapsible) */}
        <AnimatePresence>
          {showTelegramSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <TelegramSettings
                settings={telegramSettings}
                onSave={(data) => saveTelegramMutation.mutate(data)}
                onDelete={() => deleteTelegramMutation.mutate()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <InstallPrompt />

        {/* Portfolio Filters + Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">סינון תיק</p>
                <div className="flex items-center gap-2 mt-2">
                  {[
                    { id: 'all', label: 'הכל' },
                    { id: 'long', label: 'טווח ארוך' },
                    { id: 'trade', label: 'טריידים' }
                  ].map((item) => (
                    <Button
                      key={item.id}
                      size="sm"
                      variant={portfolioFilter === item.id ? 'primary' : 'outline'}
                      onClick={() => setPortfolioFilter(item.id)}
                      className="rounded-full"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">שווי מסונן</p>
                <p className="text-lg font-bold text-white">${filteredValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">סטטוס תיק</p>
                <p className="text-2xl font-black text-white">{filteredHoldings.length}</p>
                <p className="text-xs text-slate-500">מספר אחזקות מסונן</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">שווי מסונן</p>
                <p className="text-lg font-bold text-white">${filteredValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">ריכוזיות</p>
                {topHoldings.length === 0 && (
                  <p className="text-slate-500 text-sm">אין נתונים</p>
                )}
                {topHoldings.length > 0 && (
                  <div className="space-y-1 text-sm">
                    {topHoldings.map((item) => (
                      <div key={item.symbol} className="flex items-center justify-between text-slate-200">
                        <span>{item.symbol}</span>
                        <span className="text-slate-400">${item.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">Top 3</p>
                <p className="text-lg font-bold text-white">{topHoldings.length}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Main Content Grid — empty state */}
        {!isLoading && holdings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <Card>
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">התיק שלך ריק</p>
                  <p className="text-slate-400 text-sm mt-1">הוסף את המניה הראשונה שלך כדי להתחיל לעקוב</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף מניה ראשונה
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <PortfolioPieChart holdings={filteredHoldings} stockPrices={prices} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <MarketNews />
          </motion.div>
        </div>

        {/* Holdings List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <HoldingRowSkeleton key={i} />)}
            </div>
          ) : (
            <HoldingsList
              holdings={filteredHoldings}
              stockPrices={prices}
              onDelete={(id) => {
                const h = holdings.find(x => x._id === id);
                const sellPrice = h ? prices[h.symbol]?.price : undefined;
                deleteMutation.mutate({ id, sellPrice });
              }}
              onShowChart={(symbol, price, change) => setSelectedChart({ symbol, price, change })}
            />
          )}
        </motion.div>

        {/* Top Movers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TopMovers />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <BrokerConnections />
        </motion.div>


        {/* Modals */}
        <AnimatePresence>
          {showAddModal && (
            <AddStockModal
              onClose={() => setShowAddModal(false)}
              onAdd={(data) => addMutation.mutate(data)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedChart && (
            <StockChart
              symbol={selectedChart.symbol}
              currentPrice={selectedChart.price}
              change={selectedChart.change}
              onClose={() => setSelectedChart(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
