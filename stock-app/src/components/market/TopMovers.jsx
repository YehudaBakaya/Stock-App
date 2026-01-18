import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Flame, Snowflake } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { getTopMovers } from '../../api/api';

export default function TopMovers() {
  const { data, isLoading } = useQuery({
    queryKey: ['topMovers'],
    queryFn: async () => {
      const res = await getTopMovers();
      return res.data;
    },
    staleTime: 60000,
    refetchInterval: 60000
  });

  const topGainers = data?.gainers || [];
  const topLosers = data?.losers || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Gainers */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg">מובילי העליות</h3>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="text-sm text-slate-400">טוען מובילים...</div>
          )}
          {!isLoading && topGainers.length === 0 && (
            <div className="text-sm text-slate-400">אין נתונים כרגע</div>
          )}
          {topGainers.map((stock, index) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-bold">{stock.symbol}</p>
                  <p className="text-gray-500 text-xs">{stock.name}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-white font-bold">
                  {Number.isFinite(stock.price) ? `$${stock.price.toFixed(2)}` : '—'}
                </p>
                <Badge variant="success">+{stock.change}%</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Top Losers */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg">
            <Snowflake className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg">מובילי הירידות</h3>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <div className="text-sm text-slate-400">טוען מובילים...</div>
          )}
          {!isLoading && topLosers.length === 0 && (
            <div className="text-sm text-slate-400">אין נתונים כרגע</div>
          )}
          {topLosers.map((stock, index) => (
            <motion.div
              key={stock.symbol}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-bold">{stock.symbol}</p>
                  <p className="text-gray-500 text-xs">{stock.name}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-white font-bold">
                  {Number.isFinite(stock.price) ? `$${stock.price.toFixed(2)}` : '—'}
                </p>
                <Badge variant="danger">{stock.change}%</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
