'use client';

import * as React from 'react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { generateChartData } from '@/lib/mock-data';
import { Button } from './ui/button';

const chartData = generateChartData();

export function InteractiveChart() {
  const [timeframe, setTimeframe] = React.useState('1H');
  
  const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(var(--primary))",
    },
    volume: {
      label: "Volume",
      color: "hsl(var(--secondary))",
    }
  }

  return (
    <div className="h-[55vh] w-full">
       <div className="mb-4 flex items-center gap-2">
            {['1D', '1H', '30M', '5M', '1M'].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
        </div>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
          <XAxis 
            dataKey="date" 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value}
            />
          <YAxis 
            orientation="right"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip 
            cursor={{ stroke: "hsl(var(--accent))", strokeWidth: 2, strokeDasharray: "3 3" }} 
            content={<ChartTooltipContent />} 
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            name="Price"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
