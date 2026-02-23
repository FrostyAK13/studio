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
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';

interface RiseFallChartProps {
  priceHistory: { time: number; price: number }[];
  decimalPlaces: number;
}

export function RiseFallChart({ priceHistory, decimalPlaces }: RiseFallChartProps) {
  const [chartType, setChartType] = React.useState<'area' | 'line'>('area');

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
            ) : (
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
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
