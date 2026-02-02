import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Trash2, BarChart3 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function HoldingsList({ holdings, stockPrices, onDelete, onShowChart }) {
  if (holdings.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="border-b border-gray-700/50 pb-4 mb-6">
        <h3 className="text-white font-bold text-lg">המניות שלי</h3>
      </div>

      <div className="space-y-4">
        {holdings.map((holding, index) => {
          const currentPrice = stockPrices[holding.symbol]?.price || holding.buyPrice;
          const change = stockPrices[holding.symbol]?.change || 0;
          const value = holding.shares * currentPrice;
          const cost = holding.shares * holding.buyPrice;
          const pnl = value - cost;
          const pnlPercent = ((currentPrice - holding.buyPrice) / holding.buyPrice * 100);
          const isPositive = pnl >= 0;

          return (
            <motion.div
              key={holding._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 rounded-xl p-4 hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Stock Info */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    {isPositive ? 
                      <TrendingUp className="w-6 h-6 text-green-400" /> : 
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    }
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{holding.symbol}</h4>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <span>{holding.shares} מניות</span>
                      <Badge variant={holding.portfolioType === 'trade' ? 'warning' : 'success'}>
                        {holding.portfolioType === 'trade' ? 'טריידים' : 'טווח ארוך'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Price Info */}
                <div className="text-center">
                  <p className="text-gray-500 text-xs">מחיר נוכחי</p>
                  <p className="text-white font-bold">${currentPrice.toFixed(2)}</p>
                  <Badge variant={change >= 0 ? 'success' : 'danger'}>
                    {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                  </Badge>
                </div>

                {/* Value */}
                <div className="text-center">
                  <p className="text-gray-500 text-xs">שווי</p>
                  <p className="text-white font-bold">${value.toLocaleString()}</p>
                </div>

                {/* P&L */}
                <div className="text-center">
                  <p className="text-gray-500 text-xs">רווח/הפסד</p>
                  <p className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{pnl.toFixed(0)}$
                  </p>
                  <p className={`text-xs ${isPositive ? 'text-green-400/70' : 'text-red-400/70'}`}>
                    ({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onShowChart(holding.symbol, currentPrice, change)}
                    aria-label={`הצג גרף עבור ${holding.symbol}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(holding._id)}
                    className="hover:text-red-400"
                    aria-label={`מחק ${holding.symbol}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
