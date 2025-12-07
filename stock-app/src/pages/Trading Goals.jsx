import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, TrendingUp, Calendar, Zap, DollarSign, Award, Rocket } from "lucide-react";
import Card from "../components/ui/Card";
import CardContent from "../components/ui/CardContent";
import CardHeader from "../components/ui/CardHeader";
import CardTitle from "../components/ui/CardTitle";
import Label from "../components/ui/Label";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Progress from "../components/ui/Progress"; // אם יש לך קומפוננטה

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function TradingGoals() {
  const [currentCapital, setCurrentCapital] = useState(10000);
  const [targetCapital, setTargetCapital] = useState(50000);
  const [weeklyReturn, setWeeklyReturn] = useState(5);
  const [projectionData, setProjectionData] = useState([]);

  useEffect(() => {
    calculateProjection();
  }, [currentCapital, targetCapital, weeklyReturn]);

  const calculateProjection = () => {
    if (weeklyReturn <= 0 || currentCapital <= 0 || targetCapital <= currentCapital) {
      setProjectionData([]);
      return;
    }

    const data = [];
    let capital = currentCapital;
    let week = 0;
    const multiplier = 1 + (weeklyReturn / 100);

    data.push({ week: 0, capital: currentCapital });

    while (capital < targetCapital && week < 104) { // Max 2 years
      week++;
      capital = capital * multiplier;
      data.push({ week, capital: Math.round(capital) });
    }

    setProjectionData(data);
  };

  const weeksToGoal = projectionData.length > 0 ? projectionData[projectionData.length - 1].week : 0;
  const monthsToGoal = (weeksToGoal / 4).toFixed(1);
  const yearsToGoal = (weeksToGoal / 52).toFixed(1);
  const progressPercent = currentCapital > 0 ? Math.min((currentCapital / targetCapital) * 100, 100) : 0;
  const totalReturnNeeded = ((targetCapital - currentCapital) / currentCapital * 100).toFixed(1);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-bold">שבוע {data.payload.week}</p>
          <p className="text-green-400 text-sm">${data.value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4 md:p-6 pb-24 md:pb-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-2">
            יעדי טריידינג 🎯
          </h1>
          <p className="text-gray-400 text-lg">
            תכנן את המסע שלך להצלחה פינסית
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardHeader className="border-b border-gray-700/50">
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                הגדר את היעדים שלך
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-gray-300 mb-2 block">הון נוכחי ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="number"
                      value={currentCapital}
                      onChange={(e) => setCurrentCapital(parseFloat(e.target.value) || 0)}
                      className="pr-10 bg-gray-800 border-gray-700 text-white text-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">יעד הון ($)</Label>
                  <div className="relative">
                    <Target className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="number"
                      value={targetCapital}
                      onChange={(e) => setTargetCapital(parseFloat(e.target.value) || 0)}
                      className="pr-10 bg-gray-800 border-gray-700 text-white text-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-300 mb-2 block">רווח שבועי ממוצע (%)</Label>
                  <div className="relative">
                    <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="number"
                      step="0.1"
                      value={weeklyReturn}
                      onChange={(e) => setWeeklyReturn(parseFloat(e.target.value) || 0)}
                      className="pr-10 bg-gray-800 border-gray-700 text-white text-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">שבועות ליעד</p>
                  <p className="text-4xl font-black text-white">{weeksToGoal}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">חודשים ליעד</p>
                  <p className="text-4xl font-black text-white">{monthsToGoal}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">רווח נדרש</p>
                  <p className="text-3xl font-black text-green-400">+{totalReturnNeeded}%</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">התקדמות</p>
                  <p className="text-3xl font-black text-yellow-400">{progressPercent.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Rocket className="w-6 h-6 text-purple-400" />
                    <div>
                      <p className="text-white font-bold text-lg">מסלול ההצלחה שלך</p>
                      <p className="text-gray-400 text-sm">
                        ${currentCapital.toLocaleString()} → ${targetCapital.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">נותרו</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      ${(targetCapital - currentCapital).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={progressPercent} className="h-6" />
                  <div 
                    className="absolute left-0 top-0 h-6 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projection Chart */}
        {projectionData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
              <CardHeader className="border-b border-gray-700/50">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  תחזית צמיחה
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
                      <defs>
                        <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis 
                        dataKey="week" 
                        stroke="#6b7280"
                        label={{ value: 'שבוע', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="capital"
                        stroke="#a855f7"
                        strokeWidth={3}
                        fill="url(#capitalGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">💡 טיפים להצלחה</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      רווח של {weeklyReturn}% בשבוע זה אתגר - התחל ביעדים מציאותיים
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      שמור על ניהול סיכונים קפדני - אל תסכן יותר מ-1-2% לעסקה
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                      עקביות חשובה יותר מרווחים גדולים חד-פעמיים
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                      תעד כל עסקה ולמד מהטעויות שלך
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}