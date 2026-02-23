'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Brush,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface RiseFallChartProps {
  selectedMarket: string;
  decimalPlaces: number;
}

export function RiseFallChart({ selectedMarket, decimalPlaces }: RiseFallChartProps) {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const wsRef = React.useRef<WebSocket | null>(null);

  React.useEffect(() => {
    setIsLoading(true);
    setChartData([]);
    setError(null);

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
      }));
    };

    ws.onmessage = (event) => {
      setIsLoading(false);
      const data = JSON.parse(event.data);

      if (data.error) {
        setError(data.error.message || 'An unknown error occurred.');
        return;
      }
      
      setError(null);
      if (data.msg_type === 'history') {
        setChartData(data.history.prices.map((p: number, i: number) => ({ time: data.history.times[i] * 1000, price: p })));
      } else if (data.msg_type === 'tick') {
        if (data.tick?.quote) {
            const tick = { time: data.tick.epoch * 1000, price: data.tick.quote };
            setChartData((prev) => [...prev.slice(-999), tick]);
        }
      }
    };

    ws.onerror = () => {
        setError('An error occurred with the WebSocket connection.');
        setIsLoading(false);
    }

    return () => {
      if(wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedMarket]);

  const processedData = React.useMemo(() => {
    return chartData.map((d) => ({
      time: d.time,
      price: d.price ? parseFloat(d.price) : undefined,
    }));
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="min-w-[12rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
            <p className="font-bold text-foreground mb-2">{new Date(label).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}</p>
            {data.price !== undefined && (
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
    if (isLoading) return <Skeleton className="h-full w-full" />;
    if (error) return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
    );
    if (processedData.length === 0) return <div className="flex h-full w-full items-center justify-center text-muted-foreground">No data available for this market.</div>;
    
    // Set the brush to show the last 100 ticks.
    const brushStartIndex = processedData.length > 100 ? processedData.length - 100 : 0;
    
    return (
        <AreaChart data={processedData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
          <defs><linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} /></linearGradient></defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border)/.5)" />
          <XAxis hide dataKey="time" scale="time" type="number" />
          <YAxis domain={['dataMin', 'dataMax']} orientation="right" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => (typeof value === 'number' ? value.toFixed(decimalPlaces) : '')} tick={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area dataKey="price" type="monotone" stroke="hsl(var(--primary))" fill={'url(#fillPrice)'} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Brush 
            dataKey="time" 
            height={30} 
            stroke="hsl(var(--primary))" 
            startIndex={brushStartIndex}
            tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
          />
        </AreaChart>
    );
  };

  return (
    <div className="relative mt-4">
      <ChartContainer config={{}} className="h-[500px] w-full">
        <ResponsiveContainer>
            {renderChart()}
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
