import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, X, RefreshCw, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { getStockHistory } from '../../api/api';

const PERIODS = {
  '1D': { outputsize: 24, interval: '1h' },
  '1W': { outputsize: 7,  interval: '1day' },
  '1M': { outputsize: 30, interval: '1day' },
  '3M': { outputsize: 90, interval: '1day' },
  '1Y': { outputsize: 260, interval: '1day' },
};

export default function StockChart({ symbol, currentPrice, change, onClose }) {
  const [period, setPeriod] = useState('1M');

  const { data: history = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['stockHistory', symbol, period],
    queryFn: async () => {
      const { outputsize, interval } = PERIODS[period];
      const res = await getStockHistory(symbol, { outputsize, interval });
      return res.data;
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });

  const chartData = history.map((d) => ({
    date: d.date,
    price: d.price ?? d.close,
  }));

  const firstPrice = chartData[0]?.price;
  const lastPrice = chartData[chartData.length - 1]?.price;
  const isPositive = lastPrice >= (firstPrice ?? lastPrice);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold text-lg">${payload[0].value?.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl">
        <Card>
          <div className="border-b border-gray-700/50 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {isPositive
                    ? <TrendingUp className="w-6 h-6 text-green-400" />
                    : <TrendingDown className="w-6 h-6 text-red-400" />}
                </div>
                <div>
                  <h3 className="text-2xl text-white font-bold">{symbol}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-white">${currentPrice?.toFixed(2)}</span>
                    <span className={`text-sm font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change >= 0 ? '+' : ''}{change?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 mt-4">
              {Object.keys(PERIODS).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {isLoading && (
            <div className="h-80 animate-pulse bg-white/5 rounded-xl" />
          )}

          {isError && (
            <div className="h-80 flex flex-col items-center justify-center gap-3 text-gray-400">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <p className="text-sm">לא ניתן לטעון נתוני גרף</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 ml-1" />
                נסה שוב
              </Button>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => val?.slice(5)}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? '#22c55e' : '#ef4444'}
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
