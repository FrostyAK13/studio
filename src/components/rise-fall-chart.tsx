'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { CandlestickChart, LineChart as LineChartIcon } from 'lucide-react';

interface RiseFallChartProps {
  lastDigitTicks: number[];
}

export function RiseFallChart({ lastDigitTicks }: RiseFallChartProps) {
  const [chartType, setChartType] = React.useState<'line' | 'bar'>('line');

  const chartData = React.useMemo(() => {
    return lastDigitTicks
      .slice(0, 50)
      .reverse() // reverse to show oldest first
      .map((digit, index) => ({
        name: `${index + 1}`,
        digit: digit,
      }));
  }, [lastDigitTicks]);

  const chartConfig = {
    digit: {
      label: 'Digit',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex justify-end gap-2 mb-4">
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
            variant={chartType === 'bar' ? 'secondary' : 'ghost'}
            onClick={() => setChartType('bar')}
            className="h-8 w-8"
          >
            <CandlestickChart className="h-4 w-4" />
            <span className="sr-only">Bar Chart</span>
          </Button>
        </div>
        <ChartContainer config={chartConfig} className="h-48 w-full">
          <ResponsiveContainer>
            {chartType === 'line' ? (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 9]}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickCount={10}
                />
                <Tooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => `${item.payload.name}: ${value}`}
                      indicator="dot"
                    />
                  }
                />
                <Line
                  dataKey="digit"
                  type="monotone"
                  stroke="var(--color-digit)"
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 9]}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickCount={10}
                />
                <Tooltip
                   cursor={false}
                  content={
                    <ChartTooltipContent
                       formatter={(value, name, item) => `Tick ${item.payload.name}: ${value}`}
                      indicator="dot"
                    />
                  }
                />
                <Bar dataKey="digit" fill="var(--color-digit)" radius={2} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
