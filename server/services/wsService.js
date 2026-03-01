const WebSocket = require('ws');
const { getQuote } = require('./stockService');

// Map<symbol, Set<WebSocket>> — מי מנוי לאיזה סמל
const subscriptions = new Map();
// Map<WebSocket, Set<symbol>> — reverse index לניקוי בהתנתקות
const clientSymbols = new Map();

let wss = null;

function initWsServer(httpServer) {
  wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws) => {
    clientSymbols.set(ws, new Set());
    ws.send(JSON.stringify({ type: 'connected' }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === 'subscribe' && Array.isArray(msg.symbols)) {
          handleSubscribe(ws, msg.symbols);
        }
        if (msg.type === 'unsubscribe' && Array.isArray(msg.symbols)) {
          handleUnsubscribe(ws, msg.symbols);
        }
      } catch {}
    });

    ws.on('close', () => cleanup(ws));
    ws.on('error', () => cleanup(ws));
  });

  // Heartbeat כל 25 שנ' — מונע timeout של Render (30 שנ' ללא פעילות)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 25000);

  // שידור מחירים כל 15 שנ'
  const broadcastInterval = setInterval(broadcastPrices, 15000);

  process.on('SIGTERM', () => {
    clearInterval(heartbeatInterval);
    clearInterval(broadcastInterval);
    wss.close();
  });

  console.log('✅ WebSocket server initialized');
}

function handleSubscribe(ws, symbols) {
  symbols.forEach((symbol) => {
    const sym = symbol.toUpperCase();
    if (!subscriptions.has(sym)) subscriptions.set(sym, new Set());
    subscriptions.get(sym).add(ws);
    clientSymbols.get(ws)?.add(sym);
  });
}

function handleUnsubscribe(ws, symbols) {
  symbols.forEach((symbol) => {
    const sym = symbol.toUpperCase();
    subscriptions.get(sym)?.delete(ws);
    clientSymbols.get(ws)?.delete(sym);
  });
}

function cleanup(ws) {
  const symbols = clientSymbols.get(ws) || new Set();
  symbols.forEach((sym) => subscriptions.get(sym)?.delete(ws));
  clientSymbols.delete(ws);
}

async function broadcastPrices() {
  const activeSymbols = [...subscriptions.keys()].filter(
    (sym) => (subscriptions.get(sym)?.size ?? 0) > 0
  );
  if (activeSymbols.length === 0) return;

  const results = await Promise.allSettled(
    activeSymbols.map((sym) =>
      getQuote(sym).then((data) => ({ sym, data }))
    )
  );

  results.forEach((result) => {
    if (result.status !== 'fulfilled' || !result.value.data) return;
    const { sym, data } = result.value;
    const clients = subscriptions.get(sym);
    if (!clients) return;

    const payload = JSON.stringify({ type: 'price', ...data });
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
  });
}

module.exports = { initWsServer };
