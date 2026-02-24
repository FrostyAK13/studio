'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Zap } from 'lucide-react';

interface VolatilityViewProps {
    currentTps: number;
    historicalTps: { time: string; tps: number }[];
    highVolatilityDigits: number[];
    lowVolatilityDigits: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
}

const digitColors = [
    '#f43f5e', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
    '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'
];


const DigitAnalysisChart = ({ digits, title }: { digits: number[], title: string }) => {
    const { chartData, totalCount } = React.useMemo(() => {
        if (digits.length < 20) {
            return { chartData: [], totalCount: digits.length };
        }

        const counts = Array(10).fill(0);
        digits.forEach(digit => {
            counts[digit]++;
        });
        
        const data = counts.map((count, index) => ({
            digit: index,
            count: count,
            percentage: (count / digits.length) * 100,
        }));

        return { chartData: data, totalCount: digits.length };
    }, [digits]);

    const chartConfig = { ...Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i.toString(), { label: `Digit ${i}`, color: digitColors[i] }])) };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <CardDescription>Digit frequency from {totalCount} ticks.</CardDescription>
            </CardHeader>
            <CardContent>
                {chartData.length === 0 ? (
                    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        <p>Collecting data... (needs at least 20 ticks)</p>
                    </div>
                ) : (
                     <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                        <PieChart>
                            <Tooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="min-w-[8rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
                                        <p className="font-bold text-foreground">{`Digit ${data.digit}`}</p>
                                        <p className="text-muted-foreground">{`Percentage: ${data.percentage.toFixed(1)}%`}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                            />
                             <Pie
                                data={chartData}
                                dataKey="percentage"
                                nameKey="digit"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                labelLine={false}
                                label={({ index }) => chartData[index].percentage > 5 ? chartData[index].digit : ''}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={digitColors[entry.digit]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
};


export function VolatilityView({
    currentTps,
    historicalTps,
    highVolatilityDigits,
    lowVolatilityDigits,
    selectedMarket,
    onMarketChange,
}: VolatilityViewProps) {

    const chartConfig = { tps: { label: "TPS", color: "hsl(var(--primary))" }};

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6">
                    <Label htmlFor="volatility-market-select">Synthetic Market</Label>
                    <Select value={selectedMarket} onValueChange={onMarketChange}>
                        <SelectTrigger id="volatility-market-select">
                            <SelectValue placeholder="Select Index" />
                        </SelectTrigger>
                        <SelectContent>
                            {syntheticIndices.map((index) => (
                            <SelectItem key={index.id} value={index.id}>
                                {index.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Market Volatility</CardTitle>
                    <CardDescription>Analysis of tick speed and frequency.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white p-6 gap-2">
                        <div className="flex items-center gap-2 text-amber-100">
                            <Zap className="h-5 w-5" />
                            <span className="text-sm font-medium tracking-widest">LIVE TICK SPEED</span>
                        </div>
                        <span className="text-6xl font-bold">{currentTps}</span>
                        <span className="text-lg text-amber-200">Ticks per Second</span>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-center mb-2 text-muted-foreground">Volatility History (Last 60s)</h4>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <BarChart data={historicalTps} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis width={20} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={false}
                                    content={({ active, payload, label }) => {
                                      if (active && payload && payload.length) {
                                        return (
                                          <div className="rounded-lg border bg-background p-2 text-sm shadow-sm">
                                            <p>{`${label}: ${payload[0].value} TPS`}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="tps"
                                    fill="hsl(var(--primary))"
                                    radius={2}
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DigitAnalysisChart digits={highVolatilityDigits} title="High Volatility Analysis" />
                <DigitAnalysisChart digits={lowVolatilityDigits} title="Low Volatility Analysis" />
            </div>

        </div>
    );
}
