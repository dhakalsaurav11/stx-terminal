// Hazing Terminal (V2.5 – Candle Pattern + RSI Confirmation Engine)
import { useState, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line
} from 'recharts';

const API_KEY = '8aff0fdfd53042725ce8f12e5d77e88b';

const fetchCandleData = async (symbol) => {
  const url = `https://markets.sh/symbols/NASDAQ:${symbol}/candles?interval=1m&limit=30`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });
    const json = await res.json();
    if (!Array.isArray(json.candles)) throw new Error("Invalid response format");

    return json.candles.map((entry) => ({
      time: new Date(entry.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
    }));
  } catch (err) {
    console.error(`Failed to fetch data from markets.sh for ${symbol}`, err);
    return [];
  }
};


const calculateRSI = (data) => {
  let gains = 0, losses = 0;
  for (let i = 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / (data.length - 1);
  const avgLoss = losses / (data.length - 1);
  const rs = avgGain / (avgLoss || 1);
  return +(100 - 100 / (1 + rs)).toFixed(2);
};

const detectPattern = (candles) => {
  if (candles.length < 2) return null;
  const prev = candles[candles.length - 2];
  const curr = candles[candles.length - 1];

  const isBullishEngulfing = prev.close < prev.open && curr.close > curr.open && curr.close > prev.open && curr.open < prev.close;
  const isDoji = Math.abs(curr.open - curr.close) / (curr.high - curr.low) < 0.1;
  const isHammer = (curr.high - curr.low) > 3 * Math.abs(curr.close - curr.open) && (curr.close > curr.open) && ((curr.low - Math.min(curr.open, curr.close)) > 2 * (curr.high - Math.max(curr.open, curr.close)));

  if (isBullishEngulfing) return 'Bullish Engulfing';
  if (isHammer) return 'Hammer';
  if (isDoji) return 'Doji';
  return null;
};

const Card = ({ children }) => <div className="bg-white p-4 rounded-xl shadow mb-4">{children}</div>;
const CardContent = ({ children }) => <div>{children}</div>;
const Button = ({ children, onClick, variant }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded font-medium mr-2 mt-2 ${
      variant === 'destructive'
        ? 'bg-red-500 text-white'
        : 'border border-gray-400 text-gray-800 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);
const Input = (props) => (
  <input {...props} className="border border-gray-300 rounded px-2 py-1 w-full mt-2" />
);

const TradeTicket = ({ action, ticker, price, quantity, note }) => (
  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl shadow">
    <p className="text-sm font-semibold mb-1">Robinhood Trade Ticket</p>
    <p className="text-xs text-gray-700">{action} {ticker} @ ${price}</p>
    <p className="text-xs text-gray-700">Qty: {quantity || 'N/A'}</p>
    {note && <p className="text-xs text-gray-500">Note: {note}</p>}
    <p className="text-xs text-gray-400 mt-1">→ Type: Limit<br/>→ Time-in-force: GTC</p>
  </div>
);

const Candle = ({ data }) => (
  <ResponsiveContainer width="100%" height={120}>
    <ComposedChart data={data}>
      <XAxis dataKey="time" hide />
      <YAxis domain={['auto', 'auto']} hide />
      <Tooltip />
      {data.map((entry, idx) => (
        <Bar
          key={`candle-${idx}`}
          dataKey="close"
          x={idx * 10}
          y={Math.min(entry.open, entry.close)}
          width={4}
          height={Math.abs(entry.open - entry.close)}
          fill={entry.close > entry.open ? '#16a34a' : '#dc2626'}
        />
      ))}
      <Line type="monotone" dataKey="high" stroke="transparent" dot={false} />
    </ComposedChart>
  </ResponsiveContainer>
);

const StockCard = ({ ticker, data, decision, rsi, pattern, onBuy, onSell, quantity, note, setQuantity, setNote, ticket }) => (
  <Card>
    <CardContent>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">{ticker}</h2>
          <p className="text-sm text-gray-500">Current: ${data[data.length - 1]?.close || '—'}</p>
          <p className="text-xs text-gray-400">RSI: {rsi}</p>
          {pattern && <p className="text-xs text-blue-500">Pattern: {pattern}</p>}
        </div>
        <div>
          <p className={`font-semibold ${decision === 'BUY' ? 'text-green-600' : decision === 'SELL' ? 'text-red-600' : 'text-yellow-500'}`}>{decision}</p>
        </div>
      </div>

      <div className="mt-4">
        <Candle data={data} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <label className="text-xs font-medium text-gray-700">Quantity</label>
          <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Strategy Note</label>
          <Input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <Button onClick={onBuy}>Buy</Button>
        <Button variant="destructive" onClick={onSell}>Sell</Button>
      </div>

      {ticket}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stocks, setStocks] = useState([
    { ticker: 'NVDA', data: [], decision: 'WAIT', rsi: 0, pattern: null, ticket: null, quantity: '', note: '' }
  ]);

  const updateAllStockData = useCallback(async () => {
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      const candles = await fetchCandleData(stock.ticker);
      const rsi = calculateRSI(candles);
      const pattern = detectPattern(candles);

      let decision = 'WAIT';
      if ((pattern === 'Bullish Engulfing' || pattern === 'Hammer') && rsi < 40) decision = 'BUY';
      else if (pattern === 'Doji' && rsi > 65) decision = 'SELL';

      setStocks(prev => {
        const copy = [...prev];
        copy[i] = { ...copy[i], data: candles, decision, rsi, pattern };
        return copy;
      });

      await new Promise(r => setTimeout(r, 6000));
    }
  }, [stocks]);

  useEffect(() => {
    updateAllStockData();
    const interval = setInterval(updateAllStockData, 60000);
    return () => clearInterval(interval);
  }, [updateAllStockData]);

  const handleBuy = (ticker) => {
    setStocks(prev => prev.map(stock =>
      stock.ticker === ticker
        ? {
            ...stock,
            ticket: <TradeTicket action="BUY" ticker={ticker} price={stock.data[stock.data.length - 1]?.close} quantity={stock.quantity} note={stock.note} />
          }
        : stock
    ));
  };

  const handleSell = (ticker) => {
    setStocks(prev => prev.map(stock =>
      stock.ticker === ticker
        ? {
            ...stock,
            ticket: <TradeTicket action="SELL" ticker={ticker} price={stock.data[stock.data.length - 1]?.close} quantity={stock.quantity} note={stock.note} />
          }
        : stock
    ));
  };

  return (
    <div className="p-6 grid grid-cols-1 gap-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Hazing Terminal</h1>
      {stocks.map((stock, index) => (
        <StockCard
          key={stock.ticker}
          ticker={stock.ticker}
          data={stock.data}
          decision={stock.decision}
          rsi={stock.rsi}
          pattern={stock.pattern}
          quantity={stock.quantity}
          note={stock.note}
          setQuantity={(val) => {
            const copy = [...stocks];
            copy[index].quantity = val;
            setStocks(copy);
          }}
          setNote={(val) => {
            const copy = [...stocks];
            copy[index].note = val;
            setStocks(copy);
          }}
          onBuy={() => handleBuy(stock.ticker)}
          onSell={() => handleSell(stock.ticker)}
          ticket={stock.ticket}
        />
      ))}
    </div>
  );
}
