import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { getStockHistory } from '../../api/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CHART_THEME = {
  background: { color: 'transparent' },
  textColor: '#94a3b8',
  grid: {
    vertLines: { color: 'rgba(148,163,184,0.06)' },
    horzLines: { color: 'rgba(148,163,184,0.06)' },
  },
  rightPriceScale: { borderColor: 'rgba(148,163,184,0.15)' },
  timeScale: { borderColor: 'rgba(148,163,184,0.15)', timeVisible: true },
};

const intervalOptions = [
  { id: '1h',    label: 'שעתי',   outputsize: 120 },
  { id: '1day',  label: 'יומי',   outputsize: 180 },
  { id: '1week', label: 'שבועי',  outputsize: 60  },
  { id: '1month',label: 'חודשי',  outputsize: 36  },
];

// ─── RSI ──────────────────────────────────────────────────────────────────
function computeRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return [];
  const rsis = new Array(closes.length).fill(null);
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    gainSum += Math.max(d, 0);
    lossSum += Math.max(-d, 0);
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  rsis[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    rsis[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsis;
}

export default function SignalChart({ holdings = [] }) {
  const [symbolInput, setSymbolInput]   = useState('');
  const [activeSymbol, setActiveSymbol] = useState('');
  const [interval, setIntervalOption]   = useState('1day');
  const [chartData, setChartData]       = useState([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [loadError, setLoadError]       = useState('');
  const [hoverInfo, setHoverInfo]       = useState(null); // OHLCV on hover

  // Chart refs
  const mainRef    = useRef(null); // container div
  const volumeRef  = useRef(null);
  const rsiRef     = useRef(null);
  const chartMain  = useRef(null); // chart instance
  const chartVol   = useRef(null);
  const chartRsi   = useRef(null);
  const seriesMain = useRef(null);
  const seriesVol  = useRef(null);
  const seriesRsi  = useRef(null);
  const priceLinesRef = useRef([]);
  const markersRef    = useRef(null);
  const syncingRef    = useRef(false); // prevent recursive sync

  // ── Initial symbol from holdings ──────────────────────────────────────
  const holdingsSymbols = useMemo(() => {
    const s = holdings.map(h => h.symbol).filter(Boolean);
    return [...new Set(s)].sort();
  }, [holdings]);

  useEffect(() => {
    if (!activeSymbol) {
      const sym = holdingsSymbols[0] || 'SPY';
      setSymbolInput(sym);
      setActiveSymbol(sym);
    }
  }, [activeSymbol, holdingsSymbols]);

  // ── Derived values ────────────────────────────────────────────────────
  const displayPrice = chartData.length ? chartData[chartData.length - 1].price : null;

  const trend = useMemo(() => {
    if (chartData.length < 10) return null;
    const closes = chartData.map(d => d.price).filter(Number.isFinite);
    const sma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const sma30 = closes.slice(-30).reduce((a, b) => a + b, 0) / Math.min(closes.length, 30);
    if (sma10 > sma30) return 'UP';
    if (sma10 < sma30) return 'DOWN';
    return 'SIDE';
  }, [chartData]);

  const signal = useMemo(() => {
    if (chartData.length < 12) return null;
    const last = chartData[chartData.length - 1];
    const lookback = chartData.slice(-Math.min(50, chartData.length));
    const highs = lookback.map(d => Number(d.high ?? d.price)).filter(Number.isFinite);
    const lows  = lookback.map(d => Number(d.low  ?? d.price)).filter(Number.isFinite);
    if (!highs.length || !lows.length) return null;
    const resistance = Math.max(...highs);
    const support    = Math.min(...lows);
    const lastClose  = Number(last.price);
    if (!Number.isFinite(lastClose)) return null;
    if (lastClose > resistance) {
      const entry = lastClose, stop = support, exit = entry + (entry - stop) * 2;
      return { side: 'LONG', entry, stop, exit, support, resistance, trend };
    }
    if (lastClose < support) {
      const entry = lastClose, stop = resistance, exit = entry - (stop - entry) * 2;
      return { side: 'SHORT', entry, stop, exit, support, resistance, trend };
    }
    return { side: 'NEUTRAL', support, resistance, trend };
  }, [chartData, trend]);

  const guideLines = useMemo(() => {
    if (!signal) return [];
    if (signal.side === 'NEUTRAL') return [
      { key: 'support',    value: signal.support,    label: 'תמיכה',    color: '#38bdf8' },
      { key: 'resistance', value: signal.resistance, label: 'התנגדות',  color: '#f97316' },
    ];
    return [
      { key: 'entry',      value: signal.entry,      label: 'כניסה',    color: '#22c55e' },
      { key: 'stop',       value: signal.stop,       label: 'סטופ',     color: '#f43f5e' },
      { key: 'exit',       value: signal.exit,       label: 'יציאה',    color: '#f59e0b' },
      { key: 'support',    value: signal.support,    label: 'תמיכה',    color: '#38bdf8' },
      { key: 'resistance', value: signal.resistance, label: 'התנגדות',  color: '#f97316' },
    ];
  }, [signal]);

  // ── Pattern detection ─────────────────────────────────────────────────
  const getPatternWindow = (range) => {
    if (range === '1h')    return { recentWindow: 400, maxAge: 40, minDistance: 6 };
    if (range === '1month') return { recentWindow: 120, maxAge: 12, minDistance: 6 };
    return { recentWindow: 200, maxAge: 30, minDistance: 8 };
  };

  const doubleBottom = useMemo(() => {
    if (chartData.length < 40) return null;
    const lows   = chartData.map(d => Number(d.low  ?? d.price));
    const highs  = chartData.map(d => Number(d.high ?? d.price));
    const closes = chartData.map(d => Number(d.price));
    const rsis   = computeRSI(closes);
    const { recentWindow, maxAge, minDistance } = getPatternWindow(interval);
    const recentStart = Math.max(lows.length - recentWindow, 0);
    const pivots = [];
    for (let i = Math.max(2, recentStart); i < lows.length - 2; i++) {
      const c = lows[i];
      if (!Number.isFinite(c)) continue;
      if (c <= lows[i-1] && c <= lows[i+1] && c <= lows[i-2] && c <= lows[i+2]) pivots.push(i);
    }
    if (pivots.length < 2) return null;
    for (let j = pivots.length - 1; j > 0; j--) {
      const low2 = pivots[j], low1 = pivots[j-1];
      if (lows.length - 1 - low2 > maxAge) continue;
      if (low2 - low1 < minDistance) continue;
      const p1 = lows[low1], p2 = lows[low2];
      if (!Number.isFinite(p1) || !Number.isFinite(p2)) continue;
      const diff = Math.abs(p1 - p2) / Math.max((p1+p2)/2, 1);
      if (diff > 0.02) continue;
      const peak = Math.max(...highs.slice(low1+1, low2));
      const rebound = (peak - Math.max(p1, p2)) / Math.max(p1, p2);
      const rsi1 = rsis[low1], rsi2 = rsis[low2];
      const bullishDiv = Number.isFinite(rsi1) && Number.isFinite(rsi2) ? rsi2 > rsi1 + 3 : false;
      return { low1, low2, bullishDiv, potential: !(rebound >= 0.05 && bullishDiv) };
    }
    return null;
  }, [chartData, interval]);

  const doubleTop = useMemo(() => {
    if (chartData.length < 40) return null;
    const highs  = chartData.map(d => Number(d.high ?? d.price));
    const lows   = chartData.map(d => Number(d.low  ?? d.price));
    const closes = chartData.map(d => Number(d.price));
    const rsis   = computeRSI(closes);
    const { recentWindow, maxAge, minDistance } = getPatternWindow(interval);
    const recentStart = Math.max(highs.length - recentWindow, 0);
    const pivots = [];
    for (let i = Math.max(2, recentStart); i < highs.length - 2; i++) {
      const c = highs[i];
      if (!Number.isFinite(c)) continue;
      if (c >= highs[i-1] && c >= highs[i+1] && c >= highs[i-2] && c >= highs[i+2]) pivots.push(i);
    }
    if (pivots.length < 2) return null;
    for (let j = pivots.length - 1; j > 0; j--) {
      const high2 = pivots[j], high1 = pivots[j-1];
      if (highs.length - 1 - high2 > maxAge) continue;
      if (high2 - high1 < minDistance) continue;
      const p1 = highs[high1], p2 = highs[high2];
      if (!Number.isFinite(p1) || !Number.isFinite(p2)) continue;
      const diff = Math.abs(p1 - p2) / Math.max((p1+p2)/2, 1);
      if (diff > 0.02) continue;
      const valley = Math.min(...lows.slice(high1+1, high2));
      const dip = (Math.min(p1, p2) - valley) / Math.min(p1, p2);
      const rsi1 = rsis[high1], rsi2 = rsis[high2];
      const bearishDiv = Number.isFinite(rsi1) && Number.isFinite(rsi2) ? rsi2 < rsi1 - 3 : false;
      return { high1, high2, bearishDiv, potential: !(dip >= 0.05 && bearishDiv) };
    }
    return null;
  }, [chartData, interval]);

  // ── Fetch history ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeSymbol) return;
    let cancelled = false;
    const fetchHistory = async () => {
      setIsLoading(true);
      setLoadError('');
      setChartData([]);
      try {
        const opt = intervalOptions.find(o => o.id === interval) || intervalOptions[1];
        const res = await getStockHistory(activeSymbol, { interval, outputsize: opt.outputsize });
        if (!cancelled) {
          const data = Array.isArray(res.data) ? res.data : [];
          setChartData(data);
          if (!data.length) setLoadError('אין נתונים זמינים עבור הסימול');
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err?.response?.data?.message || 'אין נתונים זמינים עבור הסימול');
          setChartData([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchHistory();
    return () => { cancelled = true; };
  }, [activeSymbol, interval]);

  // ── Init charts (once) ────────────────────────────────────────────────
  const initCharts = useCallback(() => {
    if (!mainRef.current || !volumeRef.current || !rsiRef.current) return;
    if (chartMain.current) return; // already init

    // ── Main candlestick chart ──
    const main = LightweightCharts.createChart(mainRef.current, {
      ...CHART_THEME,
      width:  mainRef.current.clientWidth,
      height: mainRef.current.clientHeight,
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    });
    const candleSeries = main.addSeries(LightweightCharts.CandlestickSeries, {
      upColor:        '#22c55e',
      downColor:      '#ef4444',
      borderUpColor:  '#22c55e',
      borderDownColor:'#ef4444',
      wickUpColor:    '#22c55e',
      wickDownColor:  '#ef4444',
    });
    chartMain.current  = main;
    seriesMain.current = candleSeries;
    markersRef.current = LightweightCharts.createSeriesMarkers(candleSeries);

    // ── Volume chart ──
    const vol = LightweightCharts.createChart(volumeRef.current, {
      ...CHART_THEME,
      width:  volumeRef.current.clientWidth,
      height: volumeRef.current.clientHeight,
      timeScale: { ...CHART_THEME.timeScale, visible: false },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    });
    const volSeries = vol.addSeries(LightweightCharts.HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    vol.priceScale('volume').applyOptions({ scaleMargins: { top: 0.1, bottom: 0 } });
    chartVol.current  = vol;
    seriesVol.current = volSeries;

    // ── RSI chart ──
    const rsiChart = LightweightCharts.createChart(rsiRef.current, {
      ...CHART_THEME,
      width:  rsiRef.current.clientWidth,
      height: rsiRef.current.clientHeight,
      timeScale: { ...CHART_THEME.timeScale, visible: false },
      rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.1 } },
      handleScroll: false,
      handleScale: false,
    });
    const rsiSeries = rsiChart.addSeries(LightweightCharts.LineSeries, {
      color: '#a78bfa',
      lineWidth: 1.5,
    });
    // RSI reference lines
    rsiSeries.createPriceLine({ price: 70, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '70' });
    rsiSeries.createPriceLine({ price: 30, color: '#22c55e', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '30' });
    rsiSeries.createPriceLine({ price: 50, color: '#64748b', lineWidth: 1, lineStyle: 1, axisLabelVisible: false });
    chartRsi.current  = rsiChart;
    seriesRsi.current = rsiSeries;

    // ── Time scale sync (main ↔ vol + rsi) ──
    main.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (syncingRef.current || !range) return;
      syncingRef.current = true;
      vol.timeScale().setVisibleLogicalRange(range);
      rsiChart.timeScale().setVisibleLogicalRange(range);
      syncingRef.current = false;
    });

    // ── Crosshair OHLCV overlay ──
    main.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData?.size) { setHoverInfo(null); return; }
      const candle = param.seriesData.get(candleSeries);
      if (!candle) { setHoverInfo(null); return; }
      setHoverInfo(candle);
    });

    // ── Resize handler ──
    const handleResize = () => {
      [
        [main,     mainRef],
        [vol,      volumeRef],
        [rsiChart, rsiRef],
      ].forEach(([chart, ref]) => {
        if (ref.current) {
          chart.applyOptions({
            width:  ref.current.clientWidth,
            height: ref.current.clientHeight,
          });
        }
      });
      main.timeScale().fitContent();
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      main.remove();
      vol.remove();
      rsiChart.remove();
      chartMain.current  = null;
      chartVol.current   = null;
      chartRsi.current   = null;
      seriesMain.current = null;
      seriesVol.current  = null;
      seriesRsi.current  = null;
      priceLinesRef.current = [];
      markersRef.current    = null;
    };
  }, []);

  useEffect(() => {
    const cleanup = initCharts();
    return cleanup;
  }, [initCharts]);

  // ── Update candlestick + volume + RSI when data changes ──────────────
  useEffect(() => {
    if (!seriesMain.current || !seriesVol.current || !seriesRsi.current) return;

    const candleData = chartData.map(d => {
      const t = Date.parse(d.date);
      if (!Number.isFinite(t)) return null;
      return {
        time:  Math.floor(t / 1000),
        open:  Number(d.open  ?? d.price),
        high:  Number(d.high  ?? d.price),
        low:   Number(d.low   ?? d.price),
        close: Number(d.price),
      };
    }).filter(Boolean);

    seriesMain.current.setData(candleData);

    // Volume
    const volData = chartData.map((d, i) => {
      const t = Date.parse(d.date);
      if (!Number.isFinite(t) || !d.volume) return null;
      const isUp = i === 0
        ? true
        : Number(d.price) >= Number(chartData[i - 1].price);
      return {
        time:  Math.floor(t / 1000),
        value: Number(d.volume),
        color: isUp ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)',
      };
    }).filter(Boolean);
    seriesVol.current.setData(volData);

    // RSI
    const closes = chartData.map(d => Number(d.price)).filter(Number.isFinite);
    const rsiValues = computeRSI(closes);
    const rsiData = chartData.map((d, i) => {
      const t = Date.parse(d.date);
      if (!Number.isFinite(t) || rsiValues[i] === null) return null;
      return { time: Math.floor(t / 1000), value: rsiValues[i] };
    }).filter(Boolean);
    seriesRsi.current.setData(rsiData);

    if (candleData.length && chartMain.current) {
      chartMain.current.timeScale().fitContent();
    }
  }, [chartData]);

  // ── Price lines (support/resistance/entry/stop) ──────────────────────
  useEffect(() => {
    if (!seriesMain.current) return;
    priceLinesRef.current.forEach(l => seriesMain.current.removePriceLine(l));
    priceLinesRef.current = [];
    guideLines.forEach(line => {
      const pl = seriesMain.current.createPriceLine({
        price: line.value, color: line.color, lineWidth: 2,
        lineStyle: 2, axisLabelVisible: true, title: line.label,
      });
      priceLinesRef.current.push(pl);
    });
  }, [guideLines]);

  // ── Markers (double top/bottom) ───────────────────────────────────────
  useEffect(() => {
    if (!markersRef.current) return;
    if (!doubleBottom && !doubleTop) { markersRef.current.setMarkers([]); return; }
    const mk = (index, label, pot, pos) => {
      const t = Date.parse(chartData[index]?.date);
      if (!Number.isFinite(t)) return null;
      return { time: Math.floor(t / 1000), position: pos,
        color: pot ? '#a1a1aa' : '#f59e0b', shape: 'circle', text: label };
    };
    const markers = [
      ...(doubleBottom ? [
        mk(doubleBottom.low1, doubleBottom.potential ? 'DB?' : 'DB1', doubleBottom.potential, 'belowBar'),
        mk(doubleBottom.low2, doubleBottom.potential ? 'DB?' : 'DB2', doubleBottom.potential, 'belowBar'),
      ] : []),
      ...(doubleTop ? [
        mk(doubleTop.high1, doubleTop.potential ? 'DT?' : 'DT1', doubleTop.potential, 'aboveBar'),
        mk(doubleTop.high2, doubleTop.potential ? 'DT?' : 'DT2', doubleTop.potential, 'aboveBar'),
      ] : []),
    ].filter(Boolean);
    markersRef.current.setMarkers(markers);
  }, [chartData, doubleBottom, doubleTop]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleLoad = () => {
    const sym = symbolInput.trim().toUpperCase();
    if (!sym) { setLoadError('צריך להזין סימול מניה'); return; }
    setActiveSymbol(sym);
  };

  const handleSelectSymbol = (value) => {
    if (!value) return;
    setSymbolInput(value);
    setActiveSymbol(value);
  };

  // ─────────────────────────────────────────────────────────────────────
  return (
    <Card>
      <div className="flex flex-col gap-4">

        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-white">
              גרף איתותים {activeSymbol ? `· ${activeSymbol}` : ''}
            </h3>
            <p className="text-sm text-slate-400">קנדלסטיק · Volume · RSI 14 · תמיכה/התנגדות</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp className="w-4 h-4" />
            {displayPrice ? (
              <span className="text-slate-200 font-mono">${displayPrice.toFixed(2)}</span>
            ) : (
              <span>אין נתונים</span>
            )}
            {trend && (
              <span className="px-2 py-1 text-xs rounded-full bg-white/5 border border-white/10">
                מגמה: {trend === 'UP' ? '📈 עולה' : trend === 'DOWN' ? '📉 יורדת' : '↔ צידית'}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-slate-300 text-sm mb-2 block">מהתיק שלך</label>
            <select
              value={activeSymbol || ''}
              onChange={e => handleSelectSymbol(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-3 text-white focus:border-emerald-400 focus:outline-none transition-colors"
            >
              <option value="">בחר סימול</option>
              {holdingsSymbols.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input
            label="סימול מניה"
            value={symbolInput}
            onChange={e => setSymbolInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleLoad(); }}
            placeholder="TSLA"
          />
          <div>
            <label className="text-slate-300 text-sm mb-2 block">טווח זמן</label>
            <div className="flex gap-1.5">
              {intervalOptions.map(opt => (
                <Button
                  key={opt.id}
                  size="sm"
                  variant={interval === opt.id ? 'primary' : 'outline'}
                  onClick={() => setIntervalOption(opt.id)}
                  className="rounded-full flex-1 !px-2 !py-2 text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <Button onClick={handleLoad} className="w-full">
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'טען גרף'}
            </Button>
          </div>
        </div>

        {/* Error */}
        {loadError && (
          <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {loadError}
          </p>
        )}

        {/* Signal badges */}
        {signal && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full border font-medium ${
              signal.side === 'LONG' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' :
              signal.side === 'SHORT' ? 'bg-red-500/15 border-red-500/30 text-red-300' :
              'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {signal.side === 'LONG' ? '✅ BUY' : signal.side === 'SHORT' ? '🔴 SELL' : '⚪ ללא'}
            </span>
            {Number.isFinite(signal.entry) && (
              <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-mono">
                כניסה: ${signal.entry.toFixed(2)}
              </span>
            )}
            {Number.isFinite(signal.stop) && (
              <span className="px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-mono">
                סטופ: ${signal.stop.toFixed(2)}
              </span>
            )}
            {Number.isFinite(signal.exit) && (
              <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
                יעד: ${signal.exit.toFixed(2)}
              </span>
            )}
            {doubleBottom && (
              <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-200">
                {doubleBottom.potential ? 'Potential Double Bottom' : '🔔 Double Bottom'}
                {doubleBottom.bullishDiv ? ' + Divergence' : ''}
              </span>
            )}
            {doubleTop && (
              <span className="px-2 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-200">
                {doubleTop.potential ? 'Potential Double Top' : '🔔 Double Top'}
                {doubleTop.bearishDiv ? ' + Divergence' : ''}
              </span>
            )}
          </div>
        )}

        {/* OHLCV crosshair overlay */}
        {hoverInfo && (
          <div className="flex flex-wrap gap-3 text-xs font-mono text-slate-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <span className="text-white">O: <span className="text-slate-200">${hoverInfo.open?.toFixed(2)}</span></span>
            <span>H: <span className="text-emerald-400">${hoverInfo.high?.toFixed(2)}</span></span>
            <span>L: <span className="text-red-400">${hoverInfo.low?.toFixed(2)}</span></span>
            <span>C: <span className="text-white">${hoverInfo.close?.toFixed(2)}</span></span>
          </div>
        )}

        {/* ── Chart Panels ─────────────────────────────────────────── */}

        {/* Candlestick — main */}
        <div className="relative" style={{ height: 360 }}>
          <div ref={mainRef} className="absolute inset-0" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
              <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          )}
          {!isLoading && chartData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
              אין נתונים להצגה
            </div>
          )}
          {/* Volume label */}
          <span className="absolute top-2 right-3 text-[10px] text-slate-500 select-none pointer-events-none">
            {activeSymbol}
          </span>
        </div>

        {/* Volume panel */}
        <div className="relative" style={{ height: 80 }}>
          <div ref={volumeRef} className="absolute inset-0" />
          <span className="absolute top-1 right-3 text-[10px] text-slate-600 select-none pointer-events-none">
            VOL
          </span>
        </div>

        {/* RSI panel */}
        <div className="relative border-t border-white/5 pt-0" style={{ height: 80 }}>
          <div ref={rsiRef} className="absolute inset-0" />
          <span className="absolute top-1 right-3 text-[10px] text-violet-500 select-none pointer-events-none">
            RSI 14
          </span>
        </div>

      </div>
    </Card>
  );
}
