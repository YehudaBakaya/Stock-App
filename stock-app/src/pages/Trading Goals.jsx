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
  const presetReturns = [2, 5, 8, 12];
  const [calendarView, setCalendarView] = useState("day");
  const [activeMonth, setActiveMonth] = useState(new Date());
  const [profitEntries, setProfitEntries] = useState({ days: {}, weeks: {}, months: {} });
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [profitModalMode, setProfitModalMode] = useState("day");
  const [profitModalValue, setProfitModalValue] = useState("");
  const [profitModalDay, setProfitModalDay] = useState(1);
  const [profitModalWeek, setProfitModalWeek] = useState(1);

  useEffect(() => {
    calculateProjection();
  }, [currentCapital, targetCapital, weeklyReturn]);

  useEffect(() => {
    const saved = localStorage.getItem("tradingGoals");
    if (!saved) {
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed.currentCapital === "number") {
        setCurrentCapital(parsed.currentCapital);
      }
      if (typeof parsed.targetCapital === "number") {
        setTargetCapital(parsed.targetCapital);
      }
      if (typeof parsed.weeklyReturn === "number") {
        setWeeklyReturn(parsed.weeklyReturn);
      }
      if (typeof parsed.calendarView === "string") {
        setCalendarView(parsed.calendarView);
      }
      if (parsed.profitEntries && typeof parsed.profitEntries === "object") {
        setProfitEntries({
          days: parsed.profitEntries.days || {},
          weeks: parsed.profitEntries.weeks || {},
          months: parsed.profitEntries.months || {},
        });
      }
    } catch {
      localStorage.removeItem("tradingGoals");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "tradingGoals",
      JSON.stringify({
        currentCapital,
        targetCapital,
        weeklyReturn,
        calendarView,
        profitEntries,
      })
    );
  }, [currentCapital, targetCapital, weeklyReturn, calendarView, profitEntries]);

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
  const totalReturnNeeded = currentCapital > 0
    ? (((targetCapital - currentCapital) / currentCapital) * 100).toFixed(1)
    : "0.0";
  const goalDelta = Math.max(targetCapital - currentCapital, 0);
  const isValidGoal = weeklyReturn > 0 && currentCapital > 0 && targetCapital > currentCapital;

  const milestones = [0.25, 0.5, 0.75, 1].map((step) => ({
    step,
    amount: Math.round(currentCapital + (targetCapital - currentCapital) * step),
  }));

  const nextMilestone = milestones.find((milestone) => milestone.amount > currentCapital) || milestones[milestones.length - 1];
  const formatCurrency = (value) => `$${Math.round(value).toLocaleString()}`;
  const formatSignedCurrency = (value) => {
    if (value === 0) {
      return "$0";
    }
    return `${value > 0 ? "+" : "-"}$${Math.abs(Math.round(value)).toLocaleString()}`;
  };

  const activeYear = activeMonth.getFullYear();
  const activeMonthIndex = activeMonth.getMonth();
  const monthStart = new Date(activeYear, activeMonthIndex, 1);
  const monthEnd = new Date(activeYear, activeMonthIndex + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const startWeekday = monthStart.getDay();
  const weekdays = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
  const monthKey = `${activeYear}-${String(activeMonthIndex + 1).padStart(2, "0")}`;
  const getDayKey = (day) => `${monthKey}-${String(day).padStart(2, "0")}`;
  const getWeekKey = (week) => `${monthKey}-W${week}`;

  const dailyResults = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const storedProfit = profitEntries.days[getDayKey(day)];
    const profit = typeof storedProfit === "number" ? storedProfit : 0;
    return {
      day,
      profit,
      profitable: profit > 0,
    };
  });

  const monthTotalComputed = dailyResults.reduce((acc, item) => acc + item.profit, 0);
  const monthOverride = profitEntries.months[monthKey];
  const monthTotal = typeof monthOverride === "number" ? monthOverride : monthTotalComputed;
  const winningDays = dailyResults.filter((item) => item.profit > 0).length;
  const losingDays = dailyResults.filter((item) => item.profit < 0).length;
  const averageDaily = daysInMonth > 0 ? monthTotal / daysInMonth : 0;

  const weeklyResults = [];
  let weekProfit = 0;
  dailyResults.forEach((item, index) => {
    weekProfit += item.profit;
    const calendarIndex = startWeekday + index;
    if ((calendarIndex + 1) % 7 === 0 || index === dailyResults.length - 1) {
      const weekNumber = weeklyResults.length + 1;
      const weekOverride = profitEntries.weeks[getWeekKey(weekNumber)];
      weeklyResults.push({
        week: weekNumber,
        profit: typeof weekOverride === "number" ? weekOverride : weekProfit,
      });
      weekProfit = 0;
    }
  });

  const openProfitModal = (mode, details = {}) => {
    setProfitModalMode(mode);
    if (mode === "day") {
      const day = details.day || 1;
      setProfitModalDay(day);
      const stored = profitEntries.days[getDayKey(day)];
      setProfitModalValue(typeof stored === "number" ? stored : "");
    }
    if (mode === "week") {
      const week = details.week || 1;
      setProfitModalWeek(week);
      const stored = profitEntries.weeks[getWeekKey(week)];
      setProfitModalValue(typeof stored === "number" ? stored : "");
    }
    if (mode === "month") {
      const stored = profitEntries.months[monthKey];
      setProfitModalValue(typeof stored === "number" ? stored : "");
    }
    setIsProfitModalOpen(true);
  };

  const handleProfitSave = () => {
    const parsedValue = parseFloat(profitModalValue);
    if (Number.isNaN(parsedValue)) {
      setIsProfitModalOpen(false);
      return;
    }
    setProfitEntries((prev) => {
      if (profitModalMode === "day") {
        return {
          ...prev,
          days: { ...prev.days, [getDayKey(profitModalDay)]: parsedValue },
        };
      }
      if (profitModalMode === "week") {
        return {
          ...prev,
          weeks: { ...prev.weeks, [getWeekKey(profitModalWeek)]: parsedValue },
        };
      }
      return {
        ...prev,
        months: { ...prev.months, [monthKey]: parsedValue },
      };
    });
    setIsProfitModalOpen(false);
  };

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
    <div className="min-h-screen app-bg p-4 md:p-6 pb-24 md:pb-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-2xl mb-4 shadow-lg shadow-emerald-500/20">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-display bg-gradient-to-r from-white via-emerald-100 to-amber-100 bg-clip-text text-transparent mb-2">
            יעדי טריידינג 🎯
          </h1>
          <p className="text-slate-400 text-lg">
            תכנן את המסע שלך להצלחה פינסית
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300" />
                הגדר את היעדים שלך
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-slate-200 mb-2 block">הון נוכחי ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="number"
                      value={currentCapital}
                      onChange={(e) => setCurrentCapital(parseFloat(e.target.value) || 0)}
                      className="pr-10 text-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-200 mb-2 block">יעד הון ($)</Label>
                  <div className="relative">
                    <Target className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="number"
                      value={targetCapital}
                      onChange={(e) => setTargetCapital(parseFloat(e.target.value) || 0)}
                      className="pr-10 text-xl font-bold"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-200 mb-2 block">רווח שבועי ממוצע (%)</Label>
                  <div className="relative">
                    <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="number"
                      step="0.1"
                      value={weeklyReturn}
                      onChange={(e) => setWeeklyReturn(parseFloat(e.target.value) || 0)}
                      className="pr-10 text-xl font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-slate-400 text-sm">פריסטים מהירים:</span>
                {presetReturns.map((preset) => (
                  <Button
                    key={preset}
                    variant={weeklyReturn === preset ? "primary" : "secondary"}
                    size="sm"
                    className="rounded-full px-4 py-1.5 text-sm"
                    onClick={() => setWeeklyReturn(preset)}
                  >
                    {preset}%
                  </Button>
                ))}
                {!isValidGoal && (
                  <span className="text-amber-300 text-sm">
                    יעד חייב להיות גבוה מההון הנוכחי והרווח חיובי.
                  </span>
                )}
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
          <Card className="bg-gradient-to-br from-emerald-500/15 to-amber-500/10 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">שבועות ליעד</p>
                  <p className="text-4xl font-black text-white">{weeksToGoal}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-sky-500/15 to-cyan-500/10 border-sky-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">חודשים ליעד</p>
                  <p className="text-4xl font-black text-white">{monthsToGoal}</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-cyan-400 to-sky-300 rounded-2xl shadow-lg shadow-cyan-500/20">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/15 to-emerald-400/10 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">רווח נדרש</p>
                  <p className="text-3xl font-black text-green-400">+{totalReturnNeeded}%</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">התקדמות</p>
                  <p className="text-3xl font-black text-amber-300">{progressPercent.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-lg shadow-amber-500/20">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-300" />
                אבני דרך בדרך ליעד
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.step}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      currentCapital >= milestone.amount
                        ? "border-emerald-400/40 bg-emerald-500/10"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <p className="text-sm text-slate-400">יעד {milestone.step * 100}%</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(milestone.amount)}</p>
                    {currentCapital >= milestone.amount && (
                      <p className="text-emerald-300 text-xs mt-2">הושלם</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">היעד הבא שלך</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(nextMilestone.amount)}</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500/20 to-amber-500/10 border border-emerald-500/20 px-4 py-3">
                  <p className="text-xs text-slate-400">מרחק ליעד הבא</p>
                  <p className="text-lg font-bold text-amber-200">
                    {formatCurrency(Math.max(nextMilestone.amount - currentCapital, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profit Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-300" />
                יומן רווחיות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">סיכום חודשי</p>
                  <p
                    className={`text-2xl font-black ${
                      monthTotal > 0
                        ? "text-emerald-300"
                        : monthTotal < 0
                        ? "text-rose-300"
                        : "text-slate-200"
                    }`}
                  >
                    {formatSignedCurrency(monthTotal)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {winningDays}/{daysInMonth} ימים ירוקים · {losingDays} אדומים · ממוצע יומי {formatSignedCurrency(averageDaily)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {["day", "week", "month"].map((view) => (
                    <Button
                      key={view}
                      size="sm"
                      variant={calendarView === view ? "primary" : "outline"}
                      className="rounded-full px-4 py-1.5 text-sm"
                      onClick={() => {
                        setCalendarView(view);
                        openProfitModal(view);
                      }}
                    >
                      {view === "day" ? "יום" : view === "week" ? "שבוע" : "חודש"}
                    </Button>
                  ))}
                </div>
              </div>

              {calendarView === "day" && (
                <div>
                  <div className="grid grid-cols-7 text-xs text-slate-400 mb-3">
                    {weekdays.map((label) => (
                      <span key={label} className="text-center">{label}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: startWeekday }).map((_, index) => (
                      <div key={`empty-${index}`} className="h-16 rounded-xl border border-white/5 bg-white/5" />
                    ))}
                    {dailyResults.map((item) => (
                      <div
                        key={item.day}
                        onClick={() => openProfitModal("day", { day: item.day })}
                        className={`h-16 rounded-xl border px-2 py-2 text-xs cursor-pointer ${
                          item.profit > 0
                            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                            : item.profit < 0
                            ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
                            : "border-white/10 bg-white/5 text-slate-300"
                        }`}
                      >
                        <div className="text-slate-300 font-semibold">{item.day}</div>
                        <div className="text-xs font-bold">
                          {formatSignedCurrency(item.profit)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {calendarView === "week" && (
                <div className="grid gap-3">
                  {weeklyResults.map((week) => (
                    <div
                      key={week.week}
                      onClick={() => openProfitModal("week", { week: week.week })}
                      className={`rounded-2xl border px-4 py-3 flex items-center justify-between cursor-pointer ${
                        week.profit > 0
                          ? "border-emerald-400/40 bg-emerald-500/10"
                          : week.profit < 0
                          ? "border-rose-400/30 bg-rose-500/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div>
                        <p className="text-sm text-slate-400">שבוע {week.week}</p>
                        <p className="text-lg font-bold text-white">
                          {week.profit > 0 ? "רווח" : week.profit < 0 ? "הפסד" : "אפס"}
                        </p>
                      </div>
                      <p
                        className={`text-xl font-black ${
                          week.profit > 0
                            ? "text-emerald-300"
                            : week.profit < 0
                            ? "text-rose-300"
                            : "text-slate-200"
                        }`}
                      >
                        {formatSignedCurrency(week.profit)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {calendarView === "month" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer"
                    onClick={() => openProfitModal("month")}
                  >
                    <p className="text-sm text-slate-400">סך הכל החודש</p>
                    <p
                      className={`text-2xl font-black ${
                        monthTotal > 0
                          ? "text-emerald-300"
                          : monthTotal < 0
                          ? "text-rose-300"
                          : "text-slate-200"
                      }`}
                    >
                      {formatSignedCurrency(monthTotal)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">ימים ירוקים</p>
                    <p className="text-2xl font-black text-white">{winningDays}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">ממוצע יומי</p>
                    <p className={`text-2xl font-black ${averageDaily >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {formatSignedCurrency(averageDaily)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {isProfitModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsProfitModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card>
                <div className="border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-lg shadow-lg shadow-emerald-500/20">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-white font-bold text-lg">
                        {profitModalMode === "day"
                          ? "עדכון יום"
                          : profitModalMode === "week"
                          ? "עדכון שבוע"
                          : "עדכון חודש"}
                      </h3>
                    </div>
                    <Button variant="ghost" onClick={() => setIsProfitModalOpen(false)}>
                      סגור
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  {profitModalMode === "day" && (
                    <div>
                      <Label className="text-slate-200 mb-2 block">יום בחודש</Label>
                      <Input
                        type="number"
                        value={profitModalDay}
                        min={1}
                        max={daysInMonth}
                        onChange={(event) => setProfitModalDay(parseInt(event.target.value, 10) || 1)}
                      />
                    </div>
                  )}

                  {profitModalMode === "week" && (
                    <div>
                      <Label className="text-slate-200 mb-2 block">שבוע</Label>
                      <Input
                        type="number"
                        value={profitModalWeek}
                        min={1}
                        max={weeklyResults.length}
                        onChange={(event) => setProfitModalWeek(parseInt(event.target.value, 10) || 1)}
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-slate-200 mb-2 block">רווח / הפסד ($)</Label>
                    <Input
                      type="number"
                      value={profitModalValue}
                      placeholder="0"
                      onChange={(event) => setProfitModalValue(event.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsProfitModalOpen(false)}>
                      ביטול
                    </Button>
                    <Button onClick={handleProfitSave}>שמירה</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Rocket className="w-6 h-6 text-emerald-300" />
                    <div>
                      <p className="text-white font-bold text-lg">מסלול ההצלחה שלך</p>
                      <p className="text-slate-400 text-sm">
                        {formatCurrency(currentCapital)} → {formatCurrency(targetCapital)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">נותרו</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-emerald-200 to-amber-200 bg-clip-text text-transparent">
                      {formatCurrency(goalDelta)}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={progressPercent} className="h-6" />
                  <div 
                    className="absolute left-0 top-0 h-6 bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 rounded-full transition-all duration-500"
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
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                  תחזית צמיחה
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
                      <defs>
                        <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.1} />
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
                        stroke="#34d399"
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
          <Card className="bg-gradient-to-br from-sky-500/10 to-emerald-500/10 border-sky-500/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-cyan-400 to-emerald-300 rounded-xl shadow-lg shadow-cyan-500/20">
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
                      <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      שמור על ניהול סיכונים קפדני - אל תסכן יותר מ-1-2% לעסקה
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      עקביות חשובה יותר מרווחים גדולים חד-פעמיים
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
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
