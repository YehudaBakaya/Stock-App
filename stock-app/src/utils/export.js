export function exportHoldingsToCSV(holdings, stockPrices) {
  const headers = ['סמל', 'מניות', 'מחיר קנייה', 'מחיר נוכחי', 'שווי', 'רווח $', 'רווח %', 'סוג', 'תאריך קנייה'];

  const rows = holdings.map(h => {
    const currentPrice = stockPrices[h.symbol]?.price ?? h.buyPrice;
    const value = h.shares * currentPrice;
    const cost = h.shares * h.buyPrice;
    const pnl = value - cost;
    const pnlPct = cost > 0 ? ((pnl / cost) * 100).toFixed(2) : '0';
    return [
      h.symbol,
      h.shares,
      h.buyPrice,
      currentPrice.toFixed(2),
      value.toFixed(2),
      pnl.toFixed(2),
      pnlPct,
      h.portfolioType === 'trade' ? 'טריידים' : 'טווח ארוך',
      new Date(h.buyDate).toLocaleDateString('he-IL')
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  // BOM (\uFEFF) so Excel opens Hebrew correctly
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
