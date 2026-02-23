'use client';

import * as React from 'react';
import {
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  AreaChart as AreaChartIcon,
  BarChart2,
  BarChart,
  BarChartHorizontal,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  { label: 'Area', value: 'area', icon: <AreaChartIcon className="h-4 w-4" /> },
  { label: 'Candle', value: 'candle', icon: <BarChart2 className="h-4 w-4" /> },
  { label: 'Hollow', value: 'hollow', icon: <BarChart className="h-4 w-4" /> },
  { label: 'OHLC', value: 'ohlc', icon: <BarChartHorizontal className="h-4 w-4" /> },
];

const timeIntervals: TimeInterval[] = [
  { label: '1 tick', seconds: 0 },
  { label: '1 minute', seconds: 60 },
  { label: '2 minutes', seconds: 120 },
  { label: '3 minutes', seconds: 180 },
  { label: '5 minutes', seconds: 300 },
  { label: '10 minutes', seconds: 600 },
  { label: '15 minutes', seconds: 900 },
  { label: '30 minutes', seconds: 1800 },
  { label: '1 hour', seconds: 3600 },
  { label: '2 hours', seconds: 7200 },
  { label: '4 hours', seconds: 14400 },
  { label: '8 hours', seconds: 28800 },
  { label: '1 day', seconds: 86400 },
];

export function RiseFallChart({
  selectedMarket,
  decimalPlaces,
}: RiseFallChartProps) {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [chartType, setChartType] = React.useState<ChartType>('area');
  const [timeInterval, setTimeInterval] = React.useState<number>(0);

  React.useEffect(() => {
    setChartData([]);
    const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=84799');

    ws.onopen = () => {
      const request = {
        ticks_history: selectedMarket,
        count: 100,
        end: 'latest',
        subscribe: 1,
        ...(timeInterval > 0 && {
          style: 'candles',
          granularity: timeInterval,
        }),
      };
      ws.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error('WebSocket error:', data.error.message);
        return;
      }

      if (data.msg_type === 'history') {
        if (data.history?.prices) {
          const ticks = data.history.times.map((t: number, i: number) => ({
            time: t * 1000,
            price: data.history.prices[i],
          }));
          setChartData(ticks);
        } else if (data.candles) {
          const candles = data.candles.map((c: any) => ({
            ...c,
            time: c.epoch * 1000,
          }));
          setChartData(candles);
        }
      } else if (data.msg_type === 'tick') {
        const tick = {
          time: data.tick.epoch * 1000,
          price: data.tick.quote,
        };
        setChartData((prev) => [...prev, tick].slice(-100));
      } else if (data.msg_type === 'ohlc') {
        const candle = { ...data.ohlc, time: data.ohlc.epoch * 1000 };
        setChartData((prev) => {
          const newHistory = [...prev];
          if (newHistory[newHistory.length - 1]?.epoch === candle.epoch) {
            newHistory[newHistory.length - 1] = candle;
            return newHistory;
          }
          return [...newHistory, candle].slice(-100);
        });
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [selectedMarket, timeInterval]);

  const ohlcData = React.useMemo(() => {
    let dataToProcess = chartData;
    if (dataToProcess.length === 0) return [];
    
    // If we are in tick mode, we need to aggregate into candles first
    if (timeInterval === 0) {
        const buckets: any[] = [];
        const bucketSizeInMs = 5000; // 5 second candles from ticks
        if (dataToProcess.length < 2) return [];

        let currentBucketTime = Math.floor(dataToProcess[0].time / bucketSizeInMs) * bucketSizeInMs;
        let currentBucketTicks: any[] = [];

        for (const tick of dataToProcess) {
            if (tick.time < currentBucketTime + bucketSizeInMs) {
                currentBucketTicks.push(tick);
            } else {
                if (currentBucketTicks.length > 0) {
                    const prices = currentBucketTicks.map(t => t.price);
                    buckets.push({
                        time: currentBucketTime,
                        open: currentBucketTicks[0].price,
                        high: Math.max(...prices),
                        low: Math.min(...prices),
                        close: currentBucketTicks[currentBucketTicks.length - 1].price
                    });
                }
                currentBucketTime = Math.floor(tick.time / bucketSizeInMs) * bucketSizeInMs;
                currentBucketTicks = [tick];
            }
        }
         if (currentBucketTicks.length > 0) {
            const prices = currentBucketTicks.map(t => t.price);
            buckets.push({
                time: currentBucketTime,
                open: currentBucketTicks[0].price,
                high: Math.max(...prices),
                low: Math.min(...prices),
                close: currentBucketTicks[currentBucketTicks.length - 1].price
            });
        }
        dataToProcess = buckets;
    }

    return dataToProcess.map((d) => {
      const open = parseFloat(d.open);
      const close = parseFloat(d.close);
      const high = parseFloat(d.high);
      const low = parseFloat(d.low);
      const isBullish = close >= open;

      let fillColor = isBullish ? '#22c55e' : '#ef4444';
      if (chartType === 'hollow' && isBullish) {
        fillColor = 'transparent';
      } else if (chartType === 'ohlc') {
         fillColor = 'transparent'; // OHLC has no body fill
      }

      return {
        time: d.time, open, high, low, close,
        body: [open, close],
        wick: [low, high],
        color: isBullish ? '#22c55e' : '#ef4444',
        fillColor: fillColor,
      };
    });
  }, [chartData, timeInterval, chartType]);

  const domain = React.useMemo(() => {
    if (chartData.length < 2) return ['auto', 'auto'];
    const prices = chartData.map((d) => d.price || d.high);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 1;
    return [min - padding, max + padding];
  }, [chartData]);
  
  const chartConfig = { price: { label: 'Price', color: 'hsl(var(--primary))' }};

  const renderChart = () => {
    if (chartData.length === 0) {
      return <Skeleton className="h-48 w-full" />;
    }

    if (chartType === 'area' || chartType === 'line') {
      return (
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })} />
          <YAxis domain={domain} orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => (typeof value === 'number' ? value.toFixed(decimalPlaces) : '')} tick={{ fontSize: 10 }} />
          <Tooltip cursor={{ stroke: 'hsl(var(--accent))' }} content={<ChartTooltipContent formatter={(value) => (typeof value === 'number' ? value.toFixed(decimalPlaces) : '')} indicator="dot" />} />
          <Area dataKey="price" type="monotone" stroke="var(--color-price)" fill={chartType === 'area' ? 'url(#fillPrice)' : 'transparent'} strokeWidth={2} dot={false} isAnimationActive={false} />
        </AreaChart>
      );
    }

    return (
      <ComposedChart data={ohlcData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 10 }} tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
        <YAxis domain={domain} orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => (typeof value === 'number' ? value.toFixed(decimalPlaces) : '')} tick={{ fontSize: 10 }} />
        <Tooltip cursor={{ stroke: 'hsl(var(--accent))' }} content={({ active, payload }) => {
          if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
              <div className="min-w-[12rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
                <p className="font-bold text-foreground mb-2">{new Date(data.time).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Open:</span><span className="font-medium text-right">{data.open.toFixed(decimalPlaces)}</span>
                  <span className="text-muted-foreground">High:</span><span className="font-medium text-right">{data.high.toFixed(decimalPlaces)}</span>
                  <span className="text-muted-foreground">Low:</span><span className="font-medium text-right">{data.low.toFixed(decimalPlaces)}</span>
                  <span className="text-muted-foreground">Close:</span><span className="font-medium text-right">{data.close.toFixed(decimalPlaces)}</span>
                </div>
              </div>
            );
          }
          return null;
        }} />
        <Bar dataKey="wick" strokeWidth={1} barSize={chartType === 'ohlc' ? 1 : 1} isAnimationActive={false}>
          {ohlcData.map((entry, index) => <Cell key={`cell-wick-${index}`} stroke={entry.color} fill={entry.color} />)}
        </Bar>
        <Bar dataKey="body" barSize={chartType === 'ohlc' ? 8 : 6} isAnimationActive={false}>
          {ohlcData.map((entry, index) => <Cell key={`cell-body-${index}`} stroke={entry.color} fill={entry.fillColor} />)}
        </Bar>
         {chartType === 'ohlc' && <Bar dataKey="open" barSize={3} isAnimationActive={false}><Cell/></Bar>}
      </ComposedChart>
    );
  };

  return (
    <div className="relative mt-4">
      <div className="absolute top-0 right-0 z-10 p-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="outline" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Chart Types</h4>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {chartTypes.map((type) => (
                  <Button key={type.value} variant={chartType === type.value ? 'secondary' : 'ghost'} size="sm" onClick={() => setChartType(type.value)} className="flex flex-col h-16 gap-1">
                    {type.icon}
                    {type.label}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Time Interval</h4>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {timeIntervals.map((interval) => (
                  <Button key={interval.seconds} variant={timeInterval === interval.seconds ? 'secondary' : 'ghost'} size="sm" onClick={() => setTimeInterval(interval.seconds)}>
                    {interval.label}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <ChartContainer config={chartConfig} className="h-48 w-full">
        <ResponsiveContainer>
            {renderChart()}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
