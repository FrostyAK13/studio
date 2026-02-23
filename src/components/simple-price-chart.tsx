'use client';

import * as React from 'react';
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

const CustomDot = (props: any) => {
    const { cx, cy, index } = props;
    const isLastPoint = index === props.owner.points.length - 1;
    if (isLastPoint && cx) {
        return <circle cx={cx} cy={cy} r={4} strokeWidth={2} fill={'hsl(var(--foreground))'} stroke="hsl(var(--background))" />;
    }
    return null;
};

interface SimplePriceChartProps {
  data: { price: number }[];
}

export function SimplePriceChart({ data }: SimplePriceChartProps) {
    if (!data || data.length === 0) {
        return <div className="h-[120px] w-full flex items-center justify-center bg-muted rounded-md text-sm text-muted-foreground">Loading chart data...</div>;
    }

    const domain: ['dataMin' | number, 'dataMax' | number] = React.useMemo(() => {
        if (data.length === 0) return [0, 0];
        const prices = data.map(d => d.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const padding = (max - min) * 0.1 || 1; // Add padding, ensure it's not 0
        return [min - padding, max + padding];
    }, [data]);


    return (
        <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                    data={data} 
                    margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                >
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={true} vertical={true} />
                    <YAxis hide={true} domain={domain} />
                    <defs>
                        <linearGradient id="priceGradientSimple" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        isAnimationActive={false}
                        type="monotone"
                        dataKey="price"
                        strokeWidth={2}
                        stroke={'hsl(var(--foreground))'}
                        fill="url(#priceGradientSimple)"
                        dot={CustomDot}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
