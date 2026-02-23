'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart as LineChartIcon, AreaChart as AreaChartIcon, BarChart2 } from 'lucide-react';

interface RiseFallChartProps {
  priceHistory: { time: number; price: number }[];
  decimalPlaces: number;
}

export function RiseFallChart({ priceHistory, decimalPlaces }: RiseFallChartProps) {
  const [chartType, setChartType] = React.useState<'area' | 'line' | 'candlestick'>('area');

  const chartConfig = {
    price: {
      label: 'Price',
      color: 'hsl(var(--primary))',
    },
  };

  const domain = React.useMemo(() => {
      if (priceHistory.length < 2) return ['auto', 'auto'];
      const prices = priceHistory.map(d => d.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const padding = (max - min) * 0.1 || 1; // Add padding, ensure it's not 0
      return [min - padding, max + padding];
  }, [priceHistory]);
  
  const ohlcData = React.useMemo(() => {
    if (priceHistory.length < 2) return [];

    const bucketSize = 5; // Aggregate every 5 ticks
    const buckets = [];

    // The price history is newest first, so we reverse it for chronological aggregation
    const chronologicalHistory = [...priceHistory].reverse();

    for (let i = 0; i < chronologicalHistory.length; i += bucketSize) {
        const chunk = chronologicalHistory.slice(i, i + bucketSize);
        if (chunk.length === 0) continue;

        const prices = chunk.map(p => p.price);
        const firstTick = chunk[0];
        const lastTick = chunk[chunk.length - 1];

        buckets.push({
            time: lastTick.time,
            open: firstTick.price,
            close: lastTick.price,
            high: Math.max(...prices),
            low: Math.min(...prices),
        });
    }
    // For recharts, the body and wick need to be arrays of [min, max]
    return buckets.map(d => ({
        ...d,
        body: [d.open, d.close].sort((a, b) => a - b),
        wick: [d.low, d.high],
        color: d.close >= d.open ? '#22c55e' : '#ef4444',
        fillColor: d.close >= d.open ? 'transparent' : '#ef4444',
    }));
  }, [priceHistory]);


  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex justify-end gap-2 mb-4">
           <Button
            size="icon"
            variant={chartType === 'area' ? 'secondary' : 'ghost'}
            onClick={() => setChartType('area')}
            className="h-8 w-8"
          >
            <AreaChartIcon className="h-4 w-4" />
            <span className="sr-only">Area Chart</span>
          </Button>
          <Button
            size="icon"
            variant={chartType === 'line' ? 'secondary' : 'ghost'}
            onClick={() => setChartType('line')}
            className="h-8 w-8"
          >
            <LineChartIcon className="h-4 w-4" />
            <span className="sr-only">Line Chart</span>
          </Button>
           <Button
            size="icon"
            variant={chartType === 'candlestick' ? 'secondary' : 'ghost'}
            onClick={() => setChartType('candlestick')}
            className="h-8 w-8"
          >
            <BarChart2 className="h-4 w-4" />
            <span className="sr-only">Candlestick Chart</span>
          </Button>
        </div>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <ResponsiveContainer>
            {chartType === 'area' ? (
               <AreaChart
                data={priceHistory}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                />
                <YAxis
                  domain={domain}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => typeof value === 'number' ? value.toFixed(decimalPlaces) : ''}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--accent))" }} 
                  content={
                    <ChartTooltipContent
                      formatter={(value) => typeof value === 'number' ? value.toFixed(decimalPlaces) : ''}
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="price"
                  type="monotone"
                  stroke="var(--color-price)"
                  fill="url(#fillPrice)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : chartType === 'line' ? (
               <LineChart
                data={priceHistory}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                   tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                />
                <YAxis
                  domain={domain}
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => typeof value === 'number' ? value.toFixed(decimalPlaces) : ''}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--accent))" }} 
                  content={
                    <ChartTooltipContent
                      formatter={(value) => typeof value === 'number' ? value.toFixed(decimalPlaces) : ''}
                      indicator="dot"
                    />
                  }
                />
                <Line
                  dataKey="price"
                  type="monotone"
                  stroke="var(--color-price)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            ) : (
                <ComposedChart
                    data={ohlcData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="time"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis
                        domain={domain}
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => typeof value === 'number' ? value.toFixed(decimalPlaces) : ''}
                        tick={{ fontSize: 10 }}
                    />
                     <Tooltip
                        cursor={{ stroke: "hsl(var(--accent))" }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                <div className="min-w-[12rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
                                    <p className="font-bold text-foreground mb-2">{new Date(data.time).toLocaleString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</p>
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
                        }}
                    />
                    <Bar dataKey="wick" strokeWidth={1} barSize={1} isAnimationActive={false}>
                        {ohlcData.map((entry, index) => (
                            <Cell key={`cell-wick-${index}`} stroke={entry.color} fill={entry.color} />
                        ))}
                    </Bar>
                    <Bar dataKey="body" barSize={6} isAnimationActive={false}>
                        {ohlcData.map((entry, index) => (
                            <Cell key={`cell-body-${index}`} stroke={entry.color} fill={entry.fillColor} />
                        ))}
                    </Bar>
                </ComposedChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
