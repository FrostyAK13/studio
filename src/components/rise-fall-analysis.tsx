'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';


interface RiseFallAnalysisProps {
  selectedMarket: string;
}

const CustomDot = (props: any) => {
    const { cx, cy, index, data } = props;
    if (index === data.length - 1 && cx) {
        return <circle cx={cx} cy={cy} r={4} strokeWidth={2} fill={'hsl(var(--foreground))'} stroke="hsl(var(--card))" />;
    }
    return null;
};

export function RiseFallAnalysis({ selectedMarket }: RiseFallAnalysisProps) {
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
        count: 100,
        end: 'latest',
        style: 'ticks',
        subscribe: 1,
      }));
    };

    ws.onmessage = (event) => {
      setIsLoading(false);
      const data = JSON.parse(event.data);

      if (data.error) {
        setError(data.error.message || 'An unknown error occurred while fetching data.');
        return;
      }
      
      if (data.msg_type === 'history') {
        const history = data.history.prices.map((p: number) => ({ price: p }));
        setChartData(history);
      } else if (data.msg_type === 'tick') {
        if (data.tick?.quote) {
            const tick = { price: data.tick.quote };
            setChartData((prev) => [...prev.slice(-99), tick]);
        }
      }
    };

    ws.onerror = () => {
        setError('A WebSocket connection error occurred.');
        setIsLoading(false);
    }

    return () => {
      if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, [selectedMarket]);
  
  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-full w-full" />;
    }

    if (error) {
      return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <Alert variant="destructive" className="max-w-lg">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Chart Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
      );
    }
    
    if (chartData.length === 0) {
        return <div className="flex h-full w-full items-center justify-center text-muted-foreground">Waiting for data...</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="priceGradientSimple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border) / 0.5)" strokeDasharray="3 3" horizontal={true} vertical={false} />
                <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="price"
                    stroke={'hsl(var(--foreground))'}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#priceGradientSimple)"
                    dot={<CustomDot data={chartData} />}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardContent className="p-0 h-[240px] w-full flex items-center justify-center">
          {renderContent()}
      </CardContent>
    </Card>
  );
}
