/**
 * AI Analysis Service — Claude Haiku
 * ניתוח מניות אוטומטי בעברית עבור Telegram
 */

const Anthropic = require('@anthropic-ai/sdk');

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/**
 * analyzeStock — שולח נתוני מניה ל-Claude ומקבל ניתוח בעברית
 * @param {string} symbol — סמל המניה
 * @param {object} data — { price, changePercent, volume, rsi, macdHistogram, bollingerPos, support, resistance, signal }
 * @returns {string|null} — טקסט ניתוח בעברית, או null אם אין API key
 */
async function analyzeStock(symbol, data) {
  const ai = getClient();
  if (!ai) return null;

  const {
    price = 0,
    changePercent = 0,
    volume = null,
    rsi = null,
    macdHistogram = null,
    bollingerPos = null,
    support = null,
    resistance = null,
    signal = 'NEUTRAL',
  } = data;

  const rsiText = rsi !== null ? `RSI: ${rsi.toFixed(1)}` : '';
  const macdText = macdHistogram !== null
    ? `MACD היסטוגרמה: ${macdHistogram > 0 ? 'חיובית (' + macdHistogram.toFixed(3) + ')' : 'שלילית (' + macdHistogram.toFixed(3) + ')'}`
    : '';
  const bbText = bollingerPos !== null
    ? `Bollinger: מחיר ${bollingerPos}`
    : '';
  const srText = [
    support !== null ? `תמיכה: $${support.toFixed(2)}` : '',
    resistance !== null ? `התנגדות: $${resistance.toFixed(2)}` : '',
  ].filter(Boolean).join(' | ');

  const prompt = `אתה אנליסט מניות מקצועי. נתח את המניה ${symbol} בעברית בלבד.

נתונים:
מחיר: $${price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)
${volume !== null ? `נפח יחסי: ${volume}` : ''}
${rsiText}
${macdText}
${bbText}
${srText}
אות טכני: ${signal === 'BUY' ? 'קנייה' : signal === 'SELL' ? 'מכירה' : 'ניטרלי'}

ספק ניתוח קצר וממוקד (3-4 שורות) + המלצה אחת: קנייה / מכירה / המתנה.
אל תוסיף כותרות. כתוב ישירות.`;

  try {
    const resp = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    return resp.content[0]?.text?.trim() || null;
  } catch (err) {
    console.error('[aiService] analyzeStock error:', err.message);
    return null;
  }
}

module.exports = { analyzeStock };
