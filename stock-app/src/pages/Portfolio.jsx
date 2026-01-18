import React, { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, TrendingUp, TrendingDown, PieChart, DollarSign } from "lucide-react";
import Card from "../components/ui/Card";
import CardContent from "../components/ui/CardContent";
import CardHeader from "../components/ui/CardHeader";
import CardTitle from "../components/ui/CardTitle";

import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

const mockHoldings = [
  { symbol: 'AAPL', name: 'Apple Inc.', shares: 50, avgCost: 165.50, currentPrice: 192.50, marketValue: 9625, unrealizedPnL: 1350, pnLPercent: 16.3, sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', shares: 25, avgCost: 380.00, currentPrice: 420.30, marketValue: 10507.50, unrealizedPnL: 1007.50, pnLPercent: 10.6, sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', shares: 30, avgCost: 140.00, currentPrice: 145.20, marketValue: 4356, unrealizedPnL: 156, pnLPercent: 3.7, sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', shares: 15, avgCost: 280.00, currentPrice: 245.80, marketValue: 3687, unrealizedPnL: -513, pnLPercent: -12.2, sector: 'Automotive' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', shares: 35, avgCost: 160.00, currentPrice: 155.75, marketValue: 5451.25, unrealizedPnL: -148.75, pnLPercent: -2.7, sector: 'E-commerce' },
];

const COLORS = ['#34d399', '#38bdf8', '#fbbf24', '#22c55e', '#f97316', '#06b6d4'];

export default function Portfolio() {
  const [holdings] = useState(mockHoldings);

  const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalUnrealizedPnL = holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const cashBalance = 15000;
  const totalEquity = totalMarketValue + cashBalance;

  const pieData = holdings.map(h => ({
    name: h.symbol,
    value: h.marketValue,
    percentage: ((h.marketValue / totalMarketValue) * 100).toFixed(1)
  })).concat({
    name: 'Cash',
    value: cashBalance,
    percentage: ((cashBalance / totalEquity) * 100).toFixed(1)
  });

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
          <Card>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">Total Equity</p>
                <p className="text-2xl font-bold text-white">${totalEquity.toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 text-emerald-300"/>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">Market Value</p>
                <p className="text-2xl font-bold text-white">${totalMarketValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-300"/>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">Unrealized P&L</p>
                <p className={`text-2xl font-bold ${totalUnrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toLocaleString()}
                </p>
              </div>
              {totalUnrealizedPnL >= 0 ? <TrendingUp className="w-6 h-6 text-green-500"/> : <TrendingDown className="w-6 h-6 text-red-500"/>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-400">Cash Balance</p>
                <p className="text-2xl font-bold text-white">${cashBalance.toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 text-amber-300"/>
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
      </div>
    </div>
  );
}
