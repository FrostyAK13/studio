'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  Cell,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AreaChart as AreaIcon,
  BarChart2,
  BarChartBig,
  Minus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from './ui/skeleton';

interface RiseFallChartProps {
  selectedMarket: string;
  decimalPlaces: number;
}

type ChartType = 'area' | 'candle' | 'hollow' | 'ohlc';
type TimeInterval = {
  label: string;
  seconds: number;
};

const chartTypes: { label: string; value: ChartType; icon: React.ReactNode }[] = [
  { label: 'Area', value: 'area', icon: <AreaIcon className="h-4 w-4" /> },
  { label: 'Candles', value: 'candle', icon: <BarChartBig className="h-4 w-4" /> },
  { label: 'Hollow', value: 'hollow', icon: <BarChart2 className="h-4 w-4" /> },
  { label: 'OHLC', value: 'ohlc', icon: <Minus className="h-4 w-4 -rotate-45" /> },
];

const timeIntervals: TimeInterval[] = [
  { label: 'Ticks', seconds: 0 },
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '1h', seconds: 3600 },
  { label: '4h', seconds: 14400 },
  { label: '1d', seconds: 86400 },
];

const OhlcBar = (props: any) => {
    const { x, y, width, height, open, high, low, close } = props.payload;
    const { yAxis } = props;
    
    if (x === undefined || y === undefined || width === undefined || height === undefined || !yAxis || high === undefined || low === undefined || open === undefined || close === undefined) {
      return null;
    }
  
    const isBullish = close >= open;
    const color = isBullish ? '#22c55e' : '#ef4444';
  
    const yOpen = yAxis.scale(open);
    const yClose = yAxis.scale(close);
    const yHigh = yAxis.scale(high);
    const yLow = yAxis.scale(low);
  
    return (
      <g stroke={color} strokeWidth="1">
        {/* Main vertical line (High-Low wick) */}
        <path d={`M ${x + width / 2},${yHigh} L ${x + width / 2},${yLow}`} />
        {/* Open tick */}
        <path d={`M ${x},${yOpen} L ${x + width / 2},${yOpen}`} />
        {/* Close tick */}
        <path d={`M ${x + width / 2},${yClose} L ${x + width},${yClose}`} />
      </g>
    );
};

export function RiseFallChart({ selectedMarket, decimalPlaces }: RiseFallChartProps) {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [chartType, setChartType] = React.useState<ChartType>('candle');
  const [timeInterval, setTimeInterval] = React.useState<number>(60);
  const [isLoading, setIsLoading] = React.useState(true);
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setChartData([]);

    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=84799');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        ticks_history: selectedMarket,
        count: 1000,
        end: 'latest',
        subscribe: 1,
        ...(timeInterval > 0 && { style: 'candles', granularity: timeInterval }),
      }));
    };

    ws.onmessage = (event) => {
      setIsLoading(false);
      const data = JSON.parse(event.data);

      if (data.error) {
        console.error('WebSocket error:', data.error.message);
        return;
      }
      
      if (data.msg_type === 'candles') {
        setChartData(data.candles.map((c: any) => ({ ...c, time: c.epoch * 1000 })));
      } else if (data.msg_type === 'history') {
        setChartData(data.history.prices.map((p: number, i: number) => ({ time: data.history.times[i] * 1000, price: p })));
      } else if (data.msg_type === 'ohlc') {
        if (timeInterval > 0) {
          setChartData((prev) => {
            const candle = { ...data.ohlc, time: data.ohlc.open_time * 1000 };
            const lastCandle = prev[prev.length - 1];
            if (lastCandle && lastCandle.time === candle.time) {
              return [...prev.slice(0, -1), candle];
            }
            return [...prev.slice(-999), candle];
          });
        }
      } else if (data.msg_type === 'tick') {
        if (timeInterval === 0) {
          const tick = { time: data.tick.epoch * 1000, price: data.tick.quote };
          setChartData((prev) => [...prev.slice(-999), tick]);
        }
      }
    };

    ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setIsLoading(false);
    }

    return () => {
      if(wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedMarket, timeInterval]);

  const processedData = React.useMemo(() => {
    return chartData.map((d) => ({
      ...d,
      time: d.time,
      open: d.open ? parseFloat(d.open) : undefined,
      high: d.high ? parseFloat(d.high) : undefined,
      low: d.low ? parseFloat(d.low) : undefined,
      close: d.close ? parseFloat(d.close) : undefined,
      price: d.price ? parseFloat(d.price) : undefined,
      body: d.open && d.close ? [parseFloat(d.open), parseFloat(d.close)] : undefined,
      wick: d.low && d.high ? [parseFloat(d.low), parseFloat(d.high)] : undefined,
    }));
  }, [chartData]);
  
  const domain = React.useMemo(() => {
    if (processedData.length === 0) return ['auto', 'auto'];
    const values = processedData.flatMap((d) => [d.high, d.low, d.price]).filter(v => v !== undefined) as number[];
    if(values.length === 0) return ['auto', 'auto'];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 1;
    return [min - padding, max + padding];
  }, [processedData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="min-w-[12rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
            <p className="font-bold text-foreground mb-2">{new Date(label).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}</p>
            {data.open !== undefined ? (
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Open:</span><span className="font-medium text-right">{data.open.toFixed(decimalPlaces)}</span>
                  <span className="text-muted-foreground">High:</span><span className="font-medium text-right">{data.high.toFixed(decimalPlaces)}</span>
                  <span className="text-muted-foreground">Low:</span><span className="font-medium text-right">{data.low.toFixed(decimalPlaces)}</span>
                  <span className="text-muted-foreground">Close:</span><span className="font-medium text-right">{data.close.toFixed(decimalPlaces)}</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-muted-foreground">Price:</span><span className="font-medium text-right">{data.price.toFixed(decimalPlaces)}</span>
                </div>
            )}
          </div>
        );
      }
      return null;
  };

  const renderChart = () => {
    if (isLoading) return <Skeleton className="h-48 w-full" />;
    if (processedData.length === 0) return <div className="flex h-48 w-full items-center justify-center text-muted-foreground">No data available.</div>;

    const isTickChart = timeInterval === 0;
    const showArea = isTickChart || chartType === 'area';

    if (showArea) {
      return (
        <AreaChart data={processedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs><linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} /></linearGradient></defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/.5)" />
          <XAxis dataKey="time" scale="time" type="number" domain={['dataMin', 'dataMax']} tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
          <YAxis domain={domain} orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => (typeof value === 'number' ? value.toFixed(decimalPlaces) : '')} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area dataKey="price" type="monotone" stroke="hsl(var(--primary))" fill={'url(#fillPrice)'} strokeWidth={2} dot={false} isAnimationActive={false} />
        </AreaChart>
      );
    }
    
    return (
      <ComposedChart data={processedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/.5)" />
        <XAxis dataKey="time" scale="time" type="number" domain={['dataMin', 'dataMax']} tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
        <YAxis yAxisId="right" domain={domain} orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => (typeof value === 'number' ? value.toFixed(decimalPlaces) : '')} tick={{ fontSize: 10 }} />
        <Tooltip content={<CustomTooltip />} />
        
        {chartType === 'ohlc' ? (
             <Bar dataKey="body" yAxisId="right" shape={<OhlcBar />} isAnimationActive={false} />
        ) : (
            <>
                <Bar dataKey="wick" yAxisId="right" stroke="none" barSize={1} isAnimationActive={false}>
                    {processedData.map((d, i) => <Cell key={`wick-${i}`} fill={(d.close ?? 0) >= (d.open ?? 0) ? '#22c55e' : '#ef4444'} />)}
                </Bar>
                <Bar dataKey="body" yAxisId="right" isAnimationActive={false} maxBarSize={5}>
                    {processedData.map((d, i) => {
                        const isBullish = (d.close ?? 0) >= (d.open ?? 0);
                        const color = isBullish ? '#22c55e' : '#ef4444';
                        return <Cell key={`body-${i}`} fill={chartType === 'hollow' && isBullish ? 'transparent' : color} stroke={color} strokeWidth={1} />;
                    })}
                </Bar>
            </>
        )}
      </ComposedChart>
    );
  };

  return (
    <div className="relative mt-4">
       <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1 flex-wrap">
                {timeIntervals.map((interval) => (
                <Button key={interval.label} variant={timeInterval === interval.seconds ? 'secondary' : 'ghost'} size="sm" onClick={() => setTimeInterval(interval.seconds)} className="h-8 px-2 text-xs">
                    {interval.label}
                </Button>
                ))}
            </div>
            <Popover>
                <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8" disabled={timeInterval === 0}>
                    {chartTypes.find(c => c.value === chartType)?.icon || <BarChartBig className="h-4 w-4" />}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1">
                <div className="flex gap-1">
                    {chartTypes.map((type) => (
                    <Button key={type.value} variant={chartType === type.value ? 'secondary' : 'ghost'} size="icon" onClick={() => setChartType(type.value)} title={type.label} className="h-8 w-8">
                        {type.icon}
                    </Button>
                    ))}
                </div>
                </PopoverContent>
            </Popover>
        </div>
      <ChartContainer config={{}} className="h-48 w-full">
        <ResponsiveContainer>
            {renderChart()}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
