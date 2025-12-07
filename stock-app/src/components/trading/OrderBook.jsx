// src/components/trading/OrderBook.jsx
export default function OrderBook({ symbol, currentPrice }) {
  return (
    <div className="p-4 bg-gray-900 rounded-xl text-white">
      <h2 className="font-bold text-lg mb-2">Order Book: {symbol}</h2>
      <p>Current Price: ${currentPrice?.toFixed(2)}</p>
      <p>(Placeholder content)</p>
    </div>
  );
}
