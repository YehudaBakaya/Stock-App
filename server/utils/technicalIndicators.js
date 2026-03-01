/**
 * Technical Indicators Utility
 * חישובי ניתוח טכני: RSI, MACD, Bollinger Bands, תמיכה/התנגדות, איתותים
 */

// ─── RSI ────────────────────────────────────────────────────────────────────

function computeRSI(closes, period = 14) {
  if (!closes || closes.length < period + 1) return [];
  const rsis = new Array(closes.length).fill(null);

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    gainSum += Math.max(change, 0);
    lossSum += Math.max(-change, 0);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  rsis[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
    rsis[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsis;
}

// ─── EMA helper ────────────────────────────────────────────────────────────

function computeEMA(values, period) {
  if (!values || values.length < period) return [];
  const k = 2 / (period + 1);
  const emas = new Array(values.length).fill(null);

  // Initial EMA = SMA of first `period` values
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  emas[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    emas[i] = values[i] * k + emas[i - 1] * (1 - k);
  }
  return emas;
}

// ─── MACD ──────────────────────────────────────────────────────────────────

function computeMACD(closes, fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = computeEMA(closes, fast);
  const emaSlow = computeEMA(closes, slow);

  const macdLine = closes.map((_, i) => {
    if (emaFast[i] === null || emaSlow[i] === null) return null;
    return emaFast[i] - emaSlow[i];
  });

  // Signal line: EMA(9) of macdLine — only over non-null values
  const macdValues = macdLine.filter(v => v !== null);
  const signalEMA = computeEMA(macdValues, signalPeriod);

  // Map signal back to original indices
  const signalLine = new Array(closes.length).fill(null);
  let macdIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] !== null) {
      signalLine[i] = signalEMA[macdIdx] ?? null;
      macdIdx++;
    }
  }

  const histogram = closes.map((_, i) => {
    if (macdLine[i] === null || signalLine[i] === null) return null;
    return macdLine[i] - signalLine[i];
  });

  return { macdLine, signalLine, histogram };
}

// ─── Bollinger Bands ────────────────────────────────────────────────────────

function computeBollinger(closes, period = 20, mult = 2) {
  const upper = new Array(closes.length).fill(null);
  const middle = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - sma) ** 2, 0) / period;
    const std = Math.sqrt(variance);

    middle[i] = sma;
    upper[i] = sma + mult * std;
    lower[i] = sma - mult * std;
  }

  return { upper, middle, lower };
}

// ─── Support / Resistance ──────────────────────────────────────────────────

function findSupportResistance(highs, lows, closes, lookback = 50) {
  const len = closes.length;
  if (len < 10) return { support: null, resistance: null };

  const recentHighs = highs.slice(Math.max(0, len - lookback));
  const recentLows = lows.slice(Math.max(0, len - lookback));

  const resistance = Math.max(...recentHighs.filter(Number.isFinite));
  const support = Math.min(...recentLows.filter(Number.isFinite));

  return { support, resistance };
}

// ─── Signal Generation ─────────────────────────────────────────────────────

function generateSignal(rsiValues, macdData, price, bollingerData) {
  const rsi = rsiValues ? rsiValues[rsiValues.length - 1] : null;
  const histogram = macdData?.histogram ? macdData.histogram[macdData.histogram.length - 1] : null;
  const prevHistogram = macdData?.histogram ? macdData.histogram[macdData.histogram.length - 2] : null;
  const bbLower = bollingerData?.lower ? bollingerData.lower[bollingerData.lower.length - 1] : null;
  const bbUpper = bollingerData?.upper ? bollingerData.upper[bollingerData.upper.length - 1] : null;

  const reasons = [];
  let bullish = 0;
  let bearish = 0;

  if (rsi !== null && Number.isFinite(rsi)) {
    if (rsi < 30) {
      reasons.push(`RSI ${rsi.toFixed(0)} — oversold (קנייה פוטנציאלית)`);
      bullish += 2;
    } else if (rsi < 45) {
      reasons.push(`RSI ${rsi.toFixed(0)} — חלש`);
      bullish += 1;
    } else if (rsi > 70) {
      reasons.push(`RSI ${rsi.toFixed(0)} — overbought (מכירה פוטנציאלית)`);
      bearish += 2;
    } else if (rsi > 55) {
      reasons.push(`RSI ${rsi.toFixed(0)} — חזק`);
      bearish += 1;
    } else {
      reasons.push(`RSI ${rsi.toFixed(0)} — ניטרלי`);
    }
  }

  if (histogram !== null && prevHistogram !== null && Number.isFinite(histogram)) {
    if (histogram > 0 && prevHistogram <= 0) {
      reasons.push('MACD — חציית קו אפס כלפי מעלה (bullish cross)');
      bullish += 2;
    } else if (histogram < 0 && prevHistogram >= 0) {
      reasons.push('MACD — חציית קו אפס כלפי מטה (bearish cross)');
      bearish += 2;
    } else if (histogram > 0) {
      reasons.push('MACD — היסטוגרמה חיובית');
      bullish += 1;
    } else {
      reasons.push('MACD — היסטוגרמה שלילית');
      bearish += 1;
    }
  }

  if (bbLower !== null && bbUpper !== null && price !== null) {
    if (price <= bbLower * 1.005) {
      reasons.push('Bollinger — מחיר בתחתית הרצועה (bounce פוטנציאלי)');
      bullish += 1;
    } else if (price >= bbUpper * 0.995) {
      reasons.push('Bollinger — מחיר בראש הרצועה (תיקון פוטנציאלי)');
      bearish += 1;
    }
  }

  let signal = 'NEUTRAL';
  if (bullish >= 3 && bullish > bearish + 1) signal = 'BUY';
  else if (bearish >= 3 && bearish > bullish + 1) signal = 'SELL';

  return { signal, reasons, rsi, histogram };
}

// ─── Hebrew interpretation ─────────────────────────────────────────────────

function interpretRSI(rsi) {
  if (rsi === null || !Number.isFinite(rsi)) return '—';
  if (rsi < 30) return `${rsi.toFixed(0)} 🟢 oversold`;
  if (rsi < 45) return `${rsi.toFixed(0)} 🔵 חלש`;
  if (rsi <= 55) return `${rsi.toFixed(0)} ⚪ ניטרלי`;
  if (rsi <= 70) return `${rsi.toFixed(0)} 🟡 חזק`;
  return `${rsi.toFixed(0)} 🔴 overbought`;
}

function signalEmoji(signal) {
  if (signal === 'BUY') return '✅ קנייה';
  if (signal === 'SELL') return '🔴 מכירה';
  return '⚪ המתנה';
}

module.exports = {
  computeRSI,
  computeEMA,
  computeMACD,
  computeBollinger,
  findSupportResistance,
  generateSignal,
  interpretRSI,
  signalEmoji,
};
