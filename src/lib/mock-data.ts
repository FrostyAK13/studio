export type SyntheticIndex = {
  id: string;
  name: string;
  price: number;
  change: number;
};

export const syntheticIndices: SyntheticIndex[] = [
  { id: 'R_100', name: 'Volatility 100 Index', price: 12543.78, change: 1.25 },
  { id: 'R_75', name: 'Volatility 75 Index', price: 834521.45, change: -0.56 },
  { id: 'R_50', name: 'Volatility 50 Index', price: 104.0489, change: 2.31 },
  { id: 'R_25', name: 'Volatility 25 Index', price: 616.25, change: -1.12 },
  { id: 'R_10', name: 'Volatility 10 Index', price: 3456.78, change: 0.99 },
  { id: '1HZ100V', name: 'Volatility 100 (1s) Index', price: 12543.78, change: 1.25 },
  { id: '1HZ75V', name: 'Volatility 75 (1s) Index', price: 834521.45, change: -0.56 },
  { id: '1HZ50V', name: 'Volatility 50 (1s) Index', price: 104.0489, change: 2.31 },
  { id: '1HZ25V', name: 'Volatility 25 (1s) Index', price: 616.25, change: -1.12 },
  { id: '1HZ10V', name: 'Volatility 10 (1s) Index', price: 3456.78, change: 0.99 },
  { id: 'BOOM1000', name: 'Boom 1000 Index', price: 10450.5, change: 3.01 },
  { id: 'CRASH1000', name: 'Crash 1000 Index', price: 9870.1, change: -2.45 },
];

export const generateChartData = (points = 100) => {
  const data = [];
  let lastClose = Math.random() * 500 + 10000;
  let timestamp = new Date().getTime() - points * 60000;

  for (let i = 0; i < points; i++) {
    const open = parseFloat((lastClose + (Math.random() - 0.5) * 20).toFixed(2));
    const close = parseFloat((open + (Math.random() - 0.5) * 20).toFixed(2));
    const high = parseFloat(
      (Math.max(open, close) + Math.random() * 10).toFixed(2)
    );
    const low = parseFloat(
      (Math.min(open, close) - Math.random() * 10).toFixed(2)
    );
    const volume = Math.floor(Math.random() * 100000);
    const date = new Date(timestamp);

    data.push({
      date: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullDate: date,
      open,
      high,
      low,
      close,
      volume,
    });

    lastClose = close;
    timestamp += 60000;
  }
  return data;
};

export const generateLastDigitTicks = (count = 100) => {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 10));
};

export const historicalData = generateChartData(50).map(d => ({...d, date: d.fullDate.toLocaleString()})).reverse();
