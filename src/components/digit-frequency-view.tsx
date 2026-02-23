'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

interface DigitFrequencyViewProps {
    price: number;
    lastDigitTicks: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    decimalPlaces: number;
}

const digitColors = [
    '#818cf8', // 0 - indigo-400
    '#60a5fa', // 1 - blue-400
    '#38bdf8', // 2 - light-blue-400
    '#22d3ee', // 3 - cyan-400
    '#2dd4bf', // 4 - teal-400
    '#34d399', // 5 - emerald-400
    '#a3e635', // 6 - lime-400
    '#facc15', // 7 - yellow-400
    '#fb923c', // 8 - orange-400
    '#f472b6'  // 9 - pink-400
];

export function DigitFrequencyView({
    price,
    lastDigitTicks,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
}: DigitFrequencyViewProps) {
    const { highestDigit, lowestDigit, chartData } = React.useMemo(() => {
        if (lastDigitTicks.length === 0) {
            return { 
                highestDigit: { digit: '-', count: 0 }, 
                lowestDigit: { digit: '-', count: 0 },
                chartData: Array.from({ length: 10 }, (_, i) => ({ digit: i, percentage: 0, count: 0 }))
            };
        }

        const counts = Array(10).fill(0);
        lastDigitTicks.forEach(digit => {
            counts[digit]++;
        });

        let highest = { digit: 0, count: counts[0] };
        let lowest = { digit: 0, count: counts[0] };

        for (let i = 1; i < 10; i++) {
            if (counts[i] > highest.count) {
                highest = { digit: i, count: counts[i] };
            }
            if (counts[i] < lowest.count) {
                lowest = { digit: i, count: counts[i] };
            }
        }
        
        const data = counts.map((count, index) => ({
            digit: index,
            count: count,
            percentage: (count / lastDigitTicks.length) * 100,
        }));

        return { highestDigit: highest, lowestDigit: lowest, chartData: data };
    }, [lastDigitTicks]);
    
    const chartConfig = {
      percentage: {
        label: "Percentage",
      },
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="freq-market-select">Synthetic Market</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger id="freq-market-select">
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
                    </div>
                    <div>
                        <Label htmlFor="max-ticks-freq">Number of Ticks to Analyze</Label>
                        <Input
                            id="max-ticks-freq"
                            type="number"
                            min="10"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">CURRENT PRICE</p>
                        <p className="text-4xl font-bold text-primary">{price.toFixed(decimalPlaces)}</p>
                    </div>
                    <div className="flex gap-8 text-center">
                        <div>
                            <p className="text-muted-foreground">Highest Digit</p>
                            <p className="text-2xl font-bold">{highestDigit.count}</p>
                            <p className="text-sm text-muted-foreground">Digit {highestDigit.digit}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Lowest Digit</p>
                            <p className="text-2xl font-bold">{lowestDigit.count}</p>
                            <p className="text-sm text-muted-foreground">Digit {lowestDigit.digit}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Digit Pattern</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {lastDigitTicks.slice(0, 30).map((digit, i) => (
                        <div key={i} className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-white")} style={{ backgroundColor: digitColors[digit] }}>
                            {digit}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Probability Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                            <XAxis dataKey="digit" tickLine={false} axisLine={false} />
                            <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} tickLine={false} axisLine={false}/>
                            <Tooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-popover text-popover-foreground rounded-md px-3 py-2 text-sm shadow-md border">
                                        <p className="font-bold">{`Digit ${data.digit}`}</p>
                                        <p>{`Count: ${data.count}`}</p>
                                        <p>{`Percentage: ${data.percentage.toFixed(1)}%`}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                            />
                            <Bar dataKey="percentage" radius={4}>
                                {chartData.map((entry) => {
                                    let color = 'hsl(var(--primary))';
                                    if (entry.digit === highestDigit.digit) {
                                        color = 'hsl(var(--chart-2))';
                                    } else if (entry.digit === lowestDigit.digit) {
                                        color = 'hsl(var(--destructive))';
                                    }
                                    return <Cell key={`cell-${entry.digit}`} fill={color} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

        </div>
    );
}
