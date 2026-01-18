import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import Card from '../ui/Card';

const COLORS = [
  '#34d399', '#38bdf8', '#fbbf24', '#22c55e', '#06b6d4',
  '#f97316', '#10b981', '#0ea5e9', '#facc15', '#14b8a6',
  '#0284c7', '#84cc16'
];

export default function PortfolioPieChart({ holdings, stockPrices }) {
  const portfolioData = holdings.map((holding, index) => {
    const currentPrice = stockPrices[holding.symbol]?.price || holding.buyPrice;
    const value = holding.shares * currentPrice;
    return {
      name: holding.symbol,
      value: value,
      shares: holding.shares,
      currentPrice,
      buyPrice: holding.buyPrice,
      pnl: ((currentPrice - holding.buyPrice) / holding.buyPrice * 100).toFixed(2)
    };
  });

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = parseFloat(data.pnl) >= 0;
      return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-2xl">
          <p className="font-bold text-white text-lg mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-200">
              <span className="text-slate-400">שווי:</span> ${data.value.toLocaleString()}
            </p>
            <p className="text-slate-200">
              <span className="text-slate-400">מניות:</span> {data.shares}
            </p>
            <p className="text-slate-200">
              <span className="text-slate-400">מחיר נוכחי:</span> ${data.currentPrice.toFixed(2)}
            </p>
            <p className={isPositive ? 'text-green-400' : 'text-red-400'}>
              <span className="text-slate-400">רווח/הפסד:</span> {isPositive ? '+' : ''}{data.pnl}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (holdings.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <DollarSign className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">אין מניות בתיק</p>
          <p className="text-slate-500 text-sm mt-2">הוסף מניות כדי לראות את הפיזור שלך</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-lg shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg">פיזור התיק שלי</h3>
          </div>
          <div className="text-left">
            <p className="text-slate-400 text-sm">שווי כולל</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              ${totalValue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {COLORS.map((color, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={portfolioData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={3}
              dataKey="value"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={2}
            >
              {portfolioData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#gradient-${index % COLORS.length})`}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {portfolioData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-slate-200 text-sm font-medium">{item.name}</span>
            <span className="text-slate-500 text-xs mr-auto">
              {((item.value / totalValue) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
