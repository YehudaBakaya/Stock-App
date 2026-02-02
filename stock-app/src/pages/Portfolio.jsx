import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, TrendingUp, TrendingDown, PieChart, DollarSign } from "lucide-react";
import Card from "../components/ui/Card";
import CardContent from "../components/ui/CardContent";
import CardHeader from "../components/ui/CardHeader";
import CardTitle from "../components/ui/CardTitle";
import { useQuery } from "@tanstack/react-query";
import { getHoldings, getStockQuote, getStockHistory } from "../api/api";

import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const COLORS = ['#34d399', '#38bdf8', '#fbbf24', '#22c55e', '#f97316', '#06b6d4'];

export default function Portfolio() {
  const [stockPrices, setStockPrices] = useState({});
  const [tradeCapital, setTradeCapital] = useState(0);
  const [performanceView, setPerformanceView] = useState("daily");
  const [performanceData, setPerformanceData] = useState([]);
  const [performanceError, setPerformanceError] = useState("");
  const [performanceLoading, setPerformanceLoading] = useState(false);

  const { data: holdings = [], isLoading } = useQuery({
    queryKey: ["holdings"],
    queryFn: async () => {
      const res = await getHoldings();
      return res.data;
    }
  });

  useEffect(() => {
    const fetchPrices = async () => {
      const prices = {};
      for (const holding of holdings) {
        try {
          const res = await getStockQuote(holding.symbol);
          prices[holding.symbol] = {
            price: res.data.price,
            change: res.data.changePercent
          };
        } catch {
          prices[holding.symbol] = {
            price: holding.buyPrice,
            change: 0
          };
        }
      }
      setStockPrices(prices);
    };

    if (holdings.length > 0) {
      fetchPrices();
    }
  }, [holdings]);

  const holdingsKey = useMemo(() => (
    holdings
      .map((holding) => `${holding.symbol}:${holding.shares}:${holding.portfolioType || 'long'}`)
      .join("|")
  ), [holdings]);

  useEffect(() => {
    let cancelled = false;
    const fetchPerformance = async () => {
      if (holdings.length === 0) {
        setPerformanceData([]);
        return;
      }
      setPerformanceLoading(true);
      setPerformanceError("");
      try {
        const outputsize = performanceView === "daily" ? 120 : 260;
        const histories = await Promise.all(
          holdings.map(async (holding) => {
            try {
              const res = await getStockHistory(holding.symbol, { outputsize });
              return {
                symbol: holding.symbol,
                shares: holding.shares,
                portfolioType: holding.portfolioType || 'long',
                history: Array.isArray(res.data) ? res.data : []
              };
            } catch {
              return {
                symbol: holding.symbol,
                shares: holding.shares,
                portfolioType: holding.portfolioType || 'long',
                history: []
              };
            }
          })
        );

        const spyRes = await getStockHistory('SPY', { outputsize });
        const spyHistory = Array.isArray(spyRes.data) ? spyRes.data : [];

        const baseHistory = (histories.find((item) => item.history.length > 0)?.history || spyHistory);
        if (baseHistory.length === 0) {
          if (!cancelled) {
            setPerformanceData([]);
            setPerformanceLoading(false);
          }
          return;
        }

        const baseDates = baseHistory.map((point) => point.date);
        const aligned = baseDates.map((date) => {
          let value = 0;
          histories.forEach((item) => {
            const history = item.history;
            if (!history.length) {
              return;
            }
            if (item.portfolioType === 'trade') {
              return;
            }
            let lastPrice = history[0].price;
            for (let i = 0; i < history.length; i += 1) {
              if (history[i].date > date) {
                break;
              }
              lastPrice = history[i].price;
            }
            value += item.shares * lastPrice;
          });
          let spyValue = null;
          if (spyHistory.length) {
            let spyPrice = spyHistory[0].price;
            for (let i = 0; i < spyHistory.length; i += 1) {
              if (spyHistory[i].date > date) {
                break;
              }
              spyPrice = spyHistory[i].price;
            }
            spyValue = Math.round(spyPrice);
          }
          return { date, value: Math.round(value), spy: spyValue };
        });

        const basePoint = aligned.find((point) => Number.isFinite(point.value) && Number.isFinite(point.spy));
        const basePortfolio = basePoint?.value || aligned[0]?.value || 1;
        const baseSpy = basePoint?.spy || aligned[0]?.spy || 1;
        const normalized = aligned.map((point) => ({
          date: point.date,
          portfolioReturn: Number.isFinite(point.value) ? ((point.value / basePortfolio) - 1) * 100 : null,
          spyReturn: Number.isFinite(point.spy) ? ((point.spy / baseSpy) - 1) * 100 : null
        }));

        if (performanceView === "monthly") {
          const monthMap = new Map();
          normalized.forEach((point) => {
            const monthKey = point.date.slice(0, 7);
            monthMap.set(monthKey, point);
          });
          const monthly = Array.from(monthMap.entries()).map(([month, point]) => {
            const spyPoint = normalized.find((entry) => entry.date.startsWith(month));
            return {
              date: month,
              portfolioReturn: point?.portfolioReturn ?? null,
              spyReturn: spyPoint?.spyReturn ?? null
            };
          });
          if (!cancelled) {
            setPerformanceData(monthly);
          }
        } else if (performanceView === "ytd") {
          const yearPrefix = `${new Date().getFullYear()}-`;
          const ytd = normalized.filter((point) => point.date.startsWith(yearPrefix));
          if (!cancelled) {
            setPerformanceData(ytd);
          }
        } else {
          if (!cancelled) {
            setPerformanceData(normalized);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setPerformanceError("לא ניתן לחשב ביצועים כרגע");
        }
      } finally {
        if (!cancelled) {
          setPerformanceLoading(false);
        }
      }
    };

    fetchPerformance();
    return () => {
      cancelled = true;
    };
  }, [holdingsKey, performanceView]);

  useEffect(() => {
    const calculateTradeCapital = () => {
      const saved = localStorage.getItem("tradingGoals");
      if (!saved) {
        setTradeCapital(0);
        return;
      }
      try {
        const parsed = JSON.parse(saved);
        const entries = parsed.profitEntries || {};
        const days = entries.days || {};
        const weeks = entries.weeks || {};
        const months = entries.months || {};
        const baseCapital = Number.isFinite(parsed.baseCapital)
          ? parsed.baseCapital
          : Number.isFinite(parsed.currentCapital)
          ? parsed.currentCapital
          : 0;

        const monthMap = new Map();
        Object.entries(days).forEach(([dayKey, value]) => {
          const monthKey = dayKey.slice(0, 7);
          const entry = monthMap.get(monthKey) || { days: 0, weeks: 0, hasWeeks: false };
          entry.days += Number(value) || 0;
          monthMap.set(monthKey, entry);
        });

        Object.entries(weeks).forEach(([weekKey, value]) => {
          const parts = weekKey.split("-");
          const monthKey = `${parts[0]}-${parts[1]}`;
          const entry = monthMap.get(monthKey) || { days: 0, weeks: 0, hasWeeks: false };
          entry.weeks += Number(value) || 0;
          entry.hasWeeks = true;
          monthMap.set(monthKey, entry);
        });

        let total = 0;
        const allMonths = new Set([
          ...Object.keys(months),
          ...monthMap.keys()
        ]);
        allMonths.forEach((monthKey) => {
          if (typeof months[monthKey] === "number") {
            total += months[monthKey];
            return;
          }
          const entry = monthMap.get(monthKey);
          if (!entry) return;
          total += entry.hasWeeks ? entry.weeks : entry.days;
        });

        setTradeCapital(Math.max(baseCapital + total, 0));
      } catch {
        setTradeCapital(0);
      }
    };

    calculateTradeCapital();
    const handler = () => calculateTradeCapital();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const holdingsWithValue = holdings.map((holding) => {
    const currentPrice = stockPrices[holding.symbol]?.price || holding.buyPrice;
    const marketValue = holding.shares * currentPrice;
    const pnl = marketValue - (holding.shares * holding.buyPrice);
    return {
      ...holding,
      currentPrice,
      marketValue,
      unrealizedPnL: pnl
    };
  });

  const totalMarketValue = holdingsWithValue.reduce((sum, h) => sum + h.marketValue, 0);
  const totalUnrealizedPnL = holdingsWithValue.reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const longValue = holdingsWithValue
    .filter((h) => h.portfolioType !== "trade")
    .reduce((sum, h) => sum + h.marketValue, 0);
  const tradeHoldingsValue = holdingsWithValue
    .filter((h) => h.portfolioType === "trade")
    .reduce((sum, h) => sum + h.marketValue, 0);
  const totalEquity = totalMarketValue + tradeCapital;

  const pieData = holdingsWithValue.map((h) => ({
    name: h.symbol,
    value: h.marketValue,
    percentage: totalMarketValue > 0 ? ((h.marketValue / totalMarketValue) * 100).toFixed(1) : "0.0"
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/5 p-3 border border-white/10 rounded-lg text-white text-sm backdrop-blur">
          <p className="font-semibold">{data.name}</p>
          <p>${data.value.toLocaleString()} ({data.percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen app-bg p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-white" />
          <h1 className="text-3xl font-bold font-display text-white">Portfolio</h1>
        </motion.div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          <Card>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">סה״כ הון</p>
                <p className="text-2xl font-bold text-white">${totalEquity.toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 text-emerald-300"/>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">טווח ארוך</p>
                <p className="text-2xl font-bold text-white">${longValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-300"/>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">טריידים (סה״כ הון)</p>
                <p className="text-2xl font-bold text-white">
                  ${tradeCapital.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="w-6 h-6 text-amber-300"/>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">רווח/הפסד</p>
                <p className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toLocaleString()}
                </p>
              </div>
              {totalUnrealizedPnL >= 0 ? <TrendingUp className="w-6 h-6 text-green-500"/> : <TrendingDown className="w-6 h-6 text-red-500"/>}
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        <Card className="mt-6">
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5"/>
            Asset Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={100}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        </Card>

        {/* Performance History */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              היסטוריית ביצועים
            </CardTitle>
            <div className="flex items-center gap-2">
              {["daily", "monthly", "ytd"].map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setPerformanceView(view)}
                  className={`px-3 py-1.5 rounded-full text-xs border ${
                    performanceView === view
                      ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {view === "daily" ? "יומי" : view === "monthly" ? "חודשי" : "מתחילת שנה"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {performanceLoading && (
              <p className="text-slate-400 text-sm">מחשב ביצועים...</p>
            )}
            {performanceError && (
              <p className="text-rose-300 text-sm">{performanceError}</p>
            )}
            {!performanceLoading && !performanceError && performanceData.length === 0 && (
              <p className="text-slate-400 text-sm">אין נתוני היסטוריה כרגע.</p>
            )}
            {!performanceLoading && !performanceError && performanceData.length > 0 && (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3342" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(value) => `${value.toFixed(1)}%`} />
                    <Tooltip />
                    <Line type="monotone" dataKey="portfolioReturn" stroke="#34d399" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="spyReturn" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        {isLoading && (
          <Card>
            <CardContent>
              <p className="text-slate-400 text-sm">טוען נתונים...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
