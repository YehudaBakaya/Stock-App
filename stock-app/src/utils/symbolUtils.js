// זיהוי סוג סמל ופורמט מחיר

export const isCrypto = (symbol) => symbol.includes('/');
export const isTASE = (symbol) => symbol.toUpperCase().startsWith('TASE:');
export const getCurrency = (symbol) => isTASE(symbol) ? 'ILS' : 'USD';

export const formatPrice = (price, currency) => {
  if (price == null || Number.isNaN(price)) return '—';
  const fixed = Number(price).toFixed(2);
  return currency === 'ILS' ? `₪${fixed}` : `$${fixed}`;
};

export const formatChange = (change, currency) => {
  if (change == null || Number.isNaN(change)) return '—';
  const sign = change >= 0 ? '+' : '';
  const fixed = Number(change).toFixed(2);
  return currency === 'ILS' ? `${sign}₪${fixed}` : `${sign}$${fixed}`;
};
