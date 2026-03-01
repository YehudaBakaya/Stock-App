import { useState, useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';

const LEVELS = 8;

// Deterministic pseudo-random quantity from a string seed
function seededRand(seed, index) {
  let h = 0x811c9dc5;
  const str = `${seed}-${index}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 4901) + 100; // 100-5000
}

function buildBook(symbol, price) {
  if (!price || price <= 0) return { asks: [], bids: [] };
  const spread = price * 0.0005;

  const asks = Array.from({ length: LEVELS }, (_, i) => {
    const askPrice = price * 1.001 + i * spread;
    const qty = seededRand(symbol, 100 + i);
    return { price: askPrice, qty };
  });

  const bids = Array.from({ length: LEVELS }, (_, i) => {
    const bidPrice = price * 0.999 - i * spread;
    const qty = seededRand(symbol, 200 + i);
    return { price: bidPrice, qty };
  });

  return { asks, bids };
}

export default function OrderBook({ symbol, currentPrice, change }) {
  const [shimmer, setShimmer] = useState(false);
  const [book, setBook] = useState(() => buildBook(symbol, currentPrice));

  const refresh = useCallback(() => {
    setShimmer(true);
    setTimeout(() => {
      setBook(buildBook(symbol, currentPrice));
      setShimmer(false);
    }, 400);
  }, [symbol, currentPrice]);

  // Refresh every 3 seconds
  useEffect(() => {
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  // Rebuild when symbol/price changes
  useEffect(() => {
    setBook(buildBook(symbol, currentPrice));
  }, [symbol, currentPrice]);

  const maxQty = Math.max(
    ...book.asks.map((r) => r.qty),
    ...book.bids.map((r) => r.qty),
    1
  );

  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="rounded-xl bg-gray-900/70 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <BookOpen className="w-4 h-4 text-gray-400" />
        <span className="text-white font-semibold text-sm">Order Book</span>
        {symbol && (
          <span className="ml-auto text-gray-400 text-xs font-mono">{symbol}</span>
        )}
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-3 px-4 py-1 text-xs text-gray-500 border-b border-white/5">
        <span>מחיר</span>
        <span className="text-center">כמות</span>
        <span className="text-right">עומק</span>
      </div>

      {/* Asks (sell side — red) */}
      <div className={`transition-opacity duration-300 ${shimmer ? 'opacity-30' : 'opacity-100'}`}>
        {[...book.asks].reverse().map((row, i) => (
          <div key={`ask-${i}`} className="grid grid-cols-3 items-center px-4 py-[3px] hover:bg-red-500/5">
            <span className="text-red-400 font-mono text-xs">${row.price.toFixed(2)}</span>
            <span className="text-center text-gray-300 font-mono text-xs">{row.qty.toLocaleString()}</span>
            <div className="flex justify-end">
              <div
                className="h-1.5 rounded-full bg-red-500/40"
                style={{ width: `${(row.qty / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Current Price Badge */}
      {currentPrice > 0 && (
        <div className={`flex items-center justify-center gap-2 py-2 border-y border-white/10 ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          <span className={`font-bold text-sm font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            ${currentPrice.toFixed(2)}
          </span>
          <span className={`text-xs ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(change ?? 0).toFixed(2)}%
          </span>
          <span className="text-xs text-gray-500">● Live</span>
        </div>
      )}

      {/* Bids (buy side — green) */}
      <div className={`transition-opacity duration-300 ${shimmer ? 'opacity-30' : 'opacity-100'}`}>
        {book.bids.map((row, i) => (
          <div key={`bid-${i}`} className="grid grid-cols-3 items-center px-4 py-[3px] hover:bg-emerald-500/5">
            <span className="text-emerald-400 font-mono text-xs">${row.price.toFixed(2)}</span>
            <span className="text-center text-gray-300 font-mono text-xs">{row.qty.toLocaleString()}</span>
            <div className="flex justify-end">
              <div
                className="h-1.5 rounded-full bg-emerald-500/40"
                style={{ width: `${(row.qty / maxQty) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
