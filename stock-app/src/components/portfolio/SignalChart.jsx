import { useEffect, useMemo, useRef, useState } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { TrendingUp } from 'lucide-react';
import { getStockHistory } from '../../api/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const intervalOptions = [
  { id: '1h', label: 'שעתי' },
  { id: '1day', label: 'יומי' },
  { id: '1month', label: 'חודשי' }
];

export default function SignalChart({ holdings = [] }) {
  const [symbolInput, setSymbolInput] = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');
  const [interval, setInterval] = useState('1day');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const priceLinesRef = useRef([]);
  const markersRef = useRef(null);

  const displayPrice = chartData.length ? chartData[chartData.length - 1].price : null;

  const holdingsSymbols = useMemo(() => {
    const symbols = holdings.map((holding) => holding.symbol).filter(Boolean);
    return Array.from(new Set(symbols)).sort();
  }, [holdings]);

  useEffect(() => {
    if (!activeSymbol && holdingsSymbols.length > 0) {
      const nextSymbol = holdingsSymbols[0];
      setSymbolInput(nextSymbol);
      setActiveSymbol(nextSymbol);
    }
    if (!activeSymbol && holdingsSymbols.length === 0) {
      setSymbolInput('SPY');
      setActiveSymbol('SPY');
    }
  }, [activeSymbol, holdingsSymbols]);

  const trend = useMemo(() => {
    if (chartData.length < 10) return null;
    const closes = chartData.map((item) => Number(item.price)).filter(Number.isFinite);
    if (!closes.length) return null;
    const shortWindow = closes.slice(-10);
    const longWindow = closes.slice(-30);
    const shortMa = shortWindow.reduce((sum, value) => sum + value, 0) / Math.max(shortWindow.length, 1);
    const longMa = longWindow.reduce((sum, value) => sum + value, 0) / Math.max(longWindow.length, 1);
    if (shortMa > longMa) return 'UP';
    if (shortMa < longMa) return 'DOWN';
    return 'SIDE';
  }, [chartData]);

  const signal = useMemo(() => {
    if (chartData.length < 12) return null;
    const last = chartData[chartData.length - 1];
    const lookback = chartData.slice(-Math.min(50, chartData.length));

    const highs = lookback.map((item) => Number(item.high ?? item.price)).filter(Number.isFinite);
    const lows = lookback.map((item) => Number(item.low ?? item.price)).filter(Number.isFinite);
    const lastClose = Number(last.price);

    if (!highs.length || !lows.length || !Number.isFinite(lastClose)) return null;

    const resistance = Math.max(...highs);
    const support = Math.min(...lows);
    const longEntry = resistance;
    const shortEntry = support;

    if (lastClose > resistance) {
      const entry = lastClose;
      const stop = support;
      const exit = entry + (entry - stop) * 2;
      return {
        side: 'LONG',
        entry,
        stop,
        exit,
        support,
        resistance,
        longEntry,
        shortEntry,
        trend
      };
    }
    if (lastClose < support) {
      const entry = lastClose;
      const stop = resistance;
      const exit = entry - (stop - entry) * 2;
      return {
        side: 'SHORT',
        entry,
        stop,
        exit,
        support,
        resistance,
        longEntry,
        shortEntry,
        trend
      };
    }
    return { side: 'NEUTRAL', support, resistance, longEntry, shortEntry, trend };
  }, [chartData]);

  const computeRsi = (values, period = 14) => {
    if (values.length < period + 1) return [];
    const rsis = new Array(values.length).fill(null);
    let gainSum = 0;
    let lossSum = 0;
    for (let i = 1; i <= period; i += 1) {
      const change = values[i] - values[i - 1];
      gainSum += Math.max(change, 0);
      lossSum += Math.max(-change, 0);
    }
    let avgGain = gainSum / period;
    let avgLoss = lossSum / period;
    rsis[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    for (let i = period + 1; i < values.length; i += 1) {
      const change = values[i] - values[i - 1];
      const gain = Math.max(change, 0);
      const loss = Math.max(-change, 0);
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      rsis[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    return rsis;
  };

  const getPatternWindow = (range) => {
    if (range === '1h') {
      return { recentWindow: 400, maxAge: 40, minDistance: 6 };
    }
    if (range === '1month') {
      return { recentWindow: 120, maxAge: 12, minDistance: 6 };
    }
    return { recentWindow: 200, maxAge: 30, minDistance: 8 };
  };

  const doubleBottom = useMemo(() => {
    if (chartData.length < 40) return null;
    const lows = chartData.map((item) => Number(item.low ?? item.price));
    const highs = chartData.map((item) => Number(item.high ?? item.price));
    const closes = chartData.map((item) => Number(item.price));
    const rsis = computeRsi(closes);

    const { recentWindow, maxAge, minDistance } = getPatternWindow(interval);
    const recentStart = Math.max(lows.length - recentWindow, 0);
    const pivots = [];
    for (let i = Math.max(2, recentStart); i < lows.length - 2; i += 1) {
      const current = lows[i];
      if (!Number.isFinite(current)) continue;
      if (current <= lows[i - 1] && current <= lows[i + 1] && current <= lows[i - 2] && current <= lows[i + 2]) {
        pivots.push(i);
      }
    }

    if (pivots.length < 2) return null;
    const tolerance = 0.02;
    const reboundPct = 0.05;
    const rsiDelta = 3;

    for (let j = pivots.length - 1; j > 0; j -= 1) {
      const low2 = pivots[j];
      const low1 = pivots[j - 1];
      if (lows.length - 1 - low2 > maxAge) continue;
      if (low2 - low1 < minDistance) continue;
      const price1 = lows[low1];
      const price2 = lows[low2];
      if (!Number.isFinite(price1) || !Number.isFinite(price2)) continue;
      const avg = (price1 + price2) / 2;
      const diff = Math.abs(price1 - price2) / Math.max(avg, 1);
      if (diff > tolerance) continue;
      const peak = Math.max(...highs.slice(low1 + 1, low2));
      if (!Number.isFinite(peak)) continue;
      const rebound = (peak - Math.max(price1, price2)) / Math.max(price1, price2);
      const reboundOk = rebound >= reboundPct;
      const rsi1 = rsis[low1];
      const rsi2 = rsis[low2];
      const bullishDiv = Number.isFinite(rsi1) && Number.isFinite(rsi2)
        ? rsi2 > rsi1 + rsiDelta
        : false;
      return {
        low1,
        low2,
        bullishDiv,
        potential: !(reboundOk && bullishDiv)
      };
    }

    return null;
  }, [chartData]);

  const doubleTop = useMemo(() => {
    if (chartData.length < 40) return null;
    const highs = chartData.map((item) => Number(item.high ?? item.price));
    const lows = chartData.map((item) => Number(item.low ?? item.price));
    const closes = chartData.map((item) => Number(item.price));
    const rsis = computeRsi(closes);

    const { recentWindow, maxAge, minDistance } = getPatternWindow(interval);
    const recentStart = Math.max(highs.length - recentWindow, 0);
    const pivots = [];
    for (let i = Math.max(2, recentStart); i < highs.length - 2; i += 1) {
      const current = highs[i];
      if (!Number.isFinite(current)) continue;
      if (current >= highs[i - 1] && current >= highs[i + 1] && current >= highs[i - 2] && current >= highs[i + 2]) {
        pivots.push(i);
      }
    }

    if (pivots.length < 2) return null;
    const tolerance = 0.02;
    const dipPct = 0.05;
    const rsiDelta = 3;

    for (let j = pivots.length - 1; j > 0; j -= 1) {
      const high2 = pivots[j];
      const high1 = pivots[j - 1];
      if (highs.length - 1 - high2 > maxAge) continue;
      if (high2 - high1 < minDistance) continue;
      const price1 = highs[high1];
      const price2 = highs[high2];
      if (!Number.isFinite(price1) || !Number.isFinite(price2)) continue;
      const avg = (price1 + price2) / 2;
      const diff = Math.abs(price1 - price2) / Math.max(avg, 1);
      if (diff > tolerance) continue;
      const valley = Math.min(...lows.slice(high1 + 1, high2));
      if (!Number.isFinite(valley)) continue;
      const dip = (Math.min(price1, price2) - valley) / Math.min(price1, price2);
      const dipOk = dip >= dipPct;
      const rsi1 = rsis[high1];
      const rsi2 = rsis[high2];
      const bearishDiv = Number.isFinite(rsi1) && Number.isFinite(rsi2)
        ? rsi2 < rsi1 - rsiDelta
        : false;
      return {
        high1,
        high2,
        bearishDiv,
        potential: !(dipOk && bearishDiv)
      };
    }

    return null;
  }, [chartData]);

  const guideLines = useMemo(() => {
    if (!signal || signal.side === 'NEUTRAL') {
      if (!signal) return [];
      return [
        { key: 'support', value: signal.support, label: 'תמיכה', color: '#38bdf8' },
        { key: 'resistance', value: signal.resistance, label: 'התנגדות', color: '#f97316' }
      ];
    }
    return [
      { key: 'entry', value: signal.entry, label: 'כניסה', color: '#22c55e' },
      { key: 'stop', value: signal.stop, label: 'סטופ', color: '#f43f5e' },
      { key: 'exit', value: signal.exit, label: 'יציאה', color: '#f59e0b' },
      { key: 'support', value: signal.support, label: 'תמיכה', color: '#38bdf8' },
      { key: 'resistance', value: signal.resistance, label: 'התנגדות', color: '#f97316' }
    ];
  }, [signal]);

  useEffect(() => {
    if (!activeSymbol) return;
    let cancelled = false;
    const fetchHistory = async () => {
      setIsLoading(true);
      setLoadError('');
      setChartData([]);
      try {
        const outputsize = interval === '1h' ? 120 : 180;
        const res = await getStockHistory(activeSymbol, { interval, outputsize, allowMock: 0 });
        if (!cancelled) {
          const nextData = Array.isArray(res.data) ? res.data : [];
          setChartData(nextData);
          if (!nextData.length) {
            setLoadError('אין נתונים זמינים עבור הסימול');
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err?.response?.data?.message ||
            'אין נתונים זמינים עבור הסימול';
          setLoadError(message);
          setChartData([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [activeSymbol, interval]);

  const handleLoad = () => {
    const trimmed = symbolInput.trim().toUpperCase();
    if (!trimmed) {
      setLoadError('צריך להזין סימול מניה');
      return;
    }
    setActiveSymbol(trimmed);
  };

  const handleSelectSymbol = (value) => {
    if (!value) return;
    setSymbolInput(value);
    setActiveSymbol(value);
  };

  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8'
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.15)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.15)' }
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)'
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)'
      }
    });

    const series = chart.addSeries(LightweightCharts.CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444'
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = LightweightCharts.createSeriesMarkers(series);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
        chart.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLinesRef.current = [];
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    const mapped = chartData
      .map((item) => {
        const timeMs = Date.parse(item.date);
        if (!Number.isFinite(timeMs)) return null;
        const time = Math.floor(timeMs / 1000);
        return {
          time,
          open: Number(item.open ?? item.price),
          high: Number(item.high ?? item.price),
          low: Number(item.low ?? item.price),
          close: Number(item.price)
        };
      })
      .filter(Boolean);

    seriesRef.current.setData(mapped);
    if (mapped.length && chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

  useEffect(() => {
    if (!markersRef.current || !seriesRef.current) return;
    if (!doubleBottom && !doubleTop) {
      markersRef.current.setMarkers([]);
      return;
    }
    const markerForIndex = (index, label, isPotential) => {
      const timeMs = Date.parse(chartData[index]?.date);
      if (!Number.isFinite(timeMs)) return null;
      return {
        time: Math.floor(timeMs / 1000),
        position: 'belowBar',
        color: isPotential ? '#a1a1aa' : '#f59e0b',
        shape: 'circle',
        text: label
      };
    };
    const markerForTop = (index, label, isPotential) => {
      const timeMs = Date.parse(chartData[index]?.date);
      if (!Number.isFinite(timeMs)) return null;
      return {
        time: Math.floor(timeMs / 1000),
        position: 'aboveBar',
        color: isPotential ? '#a1a1aa' : '#ef4444',
        shape: 'circle',
        text: label
      };
    };
    const markers = [
      ...(doubleBottom
        ? [
          markerForIndex(doubleBottom.low1, doubleBottom.potential ? 'DB?' : 'DB1', doubleBottom.potential),
          markerForIndex(doubleBottom.low2, doubleBottom.potential ? 'DB?' : 'DB2', doubleBottom.potential)
        ]
        : []),
      ...(doubleTop
        ? [
          markerForTop(doubleTop.high1, doubleTop.potential ? 'DT?' : 'DT1', doubleTop.potential),
          markerForTop(doubleTop.high2, doubleTop.potential ? 'DT?' : 'DT2', doubleTop.potential)
        ]
        : [])
    ].filter(Boolean);
    markersRef.current.setMarkers(markers);
  }, [chartData, doubleBottom, doubleTop]);

  useEffect(() => {
    if (!seriesRef.current) return;
    priceLinesRef.current.forEach((line) => {
      seriesRef.current.removePriceLine(line);
    });
    priceLinesRef.current = [];

    guideLines.forEach((line) => {
      const priceLine = seriesRef.current.createPriceLine({
        price: line.value,
        color: line.color,
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: line.label
      });
      priceLinesRef.current.push(priceLine);
    });
  }, [guideLines]);

  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-white">
              גרף איתותים {activeSymbol ? `· ${activeSymbol}` : ''}
            </h3>
            <p className="text-sm text-slate-400">בחר סימול, טווח זמן, ורמות כניסה/סטופ</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp className="w-4 h-4" />
            {displayPrice ? (
              <span className="text-slate-200">מחיר אחרון: ${displayPrice.toFixed(2)}</span>
            ) : (
              <span>אין נתונים</span>
            )}
            {trend && (
              <span className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10">
                מגמה: {trend === 'UP' ? 'עולה' : trend === 'DOWN' ? 'יורדת' : 'צידית'}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="analysisHoldings" className="text-slate-300 text-sm mb-2 block">מהתיק שלך</label>
            <select
              id="analysisHoldings"
              name="analysisHoldings"
              value={activeSymbol || ''}
              onChange={(event) => handleSelectSymbol(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white focus:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 transition-colors"
            >
              <option value="">בחר סימול</option>
              {holdingsSymbols.map((symbol) => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>
          <Input
            label="סימול מניה"
            name="analysisSymbol"
            value={symbolInput}
            onChange={(event) => setSymbolInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleLoad();
              }
            }}
            placeholder="TSLA"
          />
          <div>
            <label className="text-slate-300 text-sm mb-2 block">טווח זמן</label>
            <div className="flex gap-2">
              {intervalOptions.map((option) => (
                <Button
                  key={option.id}
                  size="sm"
                  variant={interval === option.id ? 'primary' : 'outline'}
                  onClick={() => setInterval(option.id)}
                  className="rounded-full flex-1"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <Button onClick={handleLoad} className="w-full md:w-auto">
            טען גרף
          </Button>
          {loadError && <span className="text-sm text-rose-400">{loadError}</span>}
          {!activeSymbol && !loadError && (
            <span className="text-sm text-slate-500">בחר סימול כדי לראות גרף</span>
          )}
          {signal && (
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                פעולה: {signal.side === 'LONG' ? 'BUY' : signal.side === 'SHORT' ? 'SELL' : 'ללא'}
              </div>
              {signal.trend && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  טרנד: {signal.trend === 'UP' ? 'עולה' : signal.trend === 'DOWN' ? 'יורד' : 'צידי'}
                </div>
              )}
              {Number.isFinite(signal.longEntry) && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  כניסה לונג: {signal.longEntry.toFixed(2)}
                </div>
              )}
              {Number.isFinite(signal.shortEntry) && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  כניסה שורט: {signal.shortEntry.toFixed(2)}
                </div>
              )}
              {Number.isFinite(signal.entry) && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  כניסה לעסקה: {signal.entry.toFixed(2)}
                </div>
              )}
              {Number.isFinite(signal.stop) && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  סטופ: {signal.stop.toFixed(2)}
                </div>
              )}
              {Number.isFinite(signal.exit) && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  יציאה: {signal.exit.toFixed(2)}
                </div>
              )}
              {doubleBottom && (
                <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  {doubleBottom.potential ? 'Potential Double Bottom' : 'Double Bottom'}
                  {doubleBottom.bullishDiv ? ' + Bullish Divergence' : ''}
                </div>
              )}
              {doubleTop && (
                <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200">
                  {doubleTop.potential ? 'Potential Double Top' : 'Double Top'}
                  {doubleTop.bearishDiv ? ' + Bearish Divergence' : ''}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative h-80">
          <div ref={chartContainerRef} className="absolute inset-0" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              טוען נתונים...
            </div>
          )}
          {!isLoading && chartData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              אין נתונים להצגה
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
