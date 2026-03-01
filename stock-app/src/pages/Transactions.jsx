import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import { getTransactions } from '../api/api';
import Card from '../components/ui/Card';

export default function Transactions() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await getTransactions();
      return res.data;
    }
  });

  return (
    <div className="min-h-screen app-bg p-4 md:p-6 pb-24 md:pb-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black font-display bg-gradient-to-r from-white via-emerald-100 to-amber-100 bg-clip-text text-transparent">
            היסטוריית עסקאות
          </h1>
          <p className="text-slate-400 mt-2">כל פעולות הקנייה והמכירה שלך</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl animate-pulse">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-24" />
                      <div className="h-3 bg-white/10 rounded w-16" />
                    </div>
                    <div className="h-4 bg-white/10 rounded w-16" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                  <History className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">אין עסקאות עדיין</p>
                  <p className="text-slate-400 text-sm mt-1">עסקאות יופיעו כאן לאחר הוספה או מכירה של מניות</p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 border-b border-white/10">
                        <th className="text-right pb-3 pr-3 font-medium">תאריך</th>
                        <th className="text-right pb-3 font-medium">סמל</th>
                        <th className="text-right pb-3 font-medium">סוג</th>
                        <th className="text-right pb-3 font-medium">מניות</th>
                        <th className="text-right pb-3 font-medium">מחיר</th>
                        <th className="text-right pb-3 font-medium">סה"כ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx) => (
                        <tr key={tx._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pr-3 text-slate-400">
                            {new Date(tx.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                          </td>
                          <td className="py-3 font-semibold text-white">{tx.symbol}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                              tx.type === 'buy'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {tx.type === 'buy'
                                ? <TrendingUp className="w-3 h-3" />
                                : <TrendingDown className="w-3 h-3" />
                              }
                              {tx.type === 'buy' ? 'קנייה' : 'מכירה'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-200">{tx.shares}</td>
                          <td className="py-3 text-slate-200">${tx.price?.toFixed(2)}</td>
                          <td className="py-3 font-semibold text-white">${(tx.shares * tx.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx._id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        tx.type === 'buy' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                      }`}>
                        {tx.type === 'buy'
                          ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                          : <TrendingDown className="w-4 h-4 text-rose-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{tx.symbol}</p>
                          <span className={`text-xs font-medium ${tx.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.type === 'buy' ? 'קנייה' : 'מכירה'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {tx.shares} מניות × ${tx.price?.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-white">${(tx.shares * tx.price).toFixed(2)}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(tx.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
