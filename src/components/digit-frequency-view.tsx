
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Tooltip, Cell, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Compass } from 'lucide-react';
import { RiseFallAnalysis } from './rise-fall-analysis';
import { DigitFrequencyCircles } from './correlation-view';

interface DigitFrequencyViewProps {
    price: number;
    lastDigitTicks: number[];
    priceHistory: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    decimalPlaces: number;
}

const digitColors = Array.from({ length: 10 }, (_, i) => `hsl(var(--chart-${i + 1}))`);

export function DigitFrequencyView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
}: DigitFrequencyViewProps) {
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    const { highestDigit, lowestDigit, chartData } = React.useMemo(() => {
        // Frequency analysis always uses the full 1000-tick window for precision
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
    
    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks;
        if (ticks.length < 10) return null;

        const total = ticks.length;
        const evenCount = ticks.filter(d => d % 2 === 0).length;
        const evenPercentage = (evenCount / total) * 100;
        const oddPercentage = 100 - evenPercentage;
        
        let evenOddReversal: 'Even' | 'Odd' | 'None' = 'None';
        if (ticks.length >= 5) {
            const lastFive = ticks.slice(0, 5).map(d => d % 2 === 0 ? 'E' : 'O');
            if (lastFive.every(o => o === 'E')) evenOddReversal = 'Odd';
            if (lastFive.every(o => o === 'O')) evenOddReversal = 'Even';
        }
        
        const evenOddChartData = [
            { name: 'Even', value: evenPercentage, fill: 'hsl(var(--chart-1))' },
            { name: 'Odd', value: oddPercentage, fill: 'hsl(var(--chart-3))' },
        ];

        const counts = Array(10).fill(0);
        ticks.forEach(digit => { counts[digit]++; });
        const hottestDigit = counts.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
        const matchesPercentage = (counts[hottestDigit] / total) * 100;
        
        const matchesDiffersChartData = [
            { name: 'Matches', value: matchesPercentage, fill: 'hsl(var(--chart-2))' },
            { name: 'Differs', value: 100 - matchesPercentage, fill: 'hsl(var(--chart-5))' },
        ];

        const lowerCount = ticks.filter(d => d <= 4).length;
        const lowerPercentage = (lowerCount / total) * 100;
        
        return {
            evenOdd: { reversal: evenOddReversal, chartData: evenOddChartData },
            matchesDiffers: { hottest: hottestDigit, chartData: matchesDiffersChartData },
            overUnder: { chartData: [
                { name: 'Lower (0-4)', value: lowerPercentage, fill: 'hsl(var(--chart-1))' },
                { name: 'Higher (5-9)', value: 100 - lowerPercentage, fill: 'hsl(var(--destructive))' },
            ]}
        };
    }, [lastDigitTicks]);

    const chartConfig = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i.toString(), { label: `Digit ${i}`, color: digitColors[i] }])
    );

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
                        <Label className="text-muted-foreground">Analysis Baseline (Synchronized)</Label>
                        <div className="h-10 flex items-center px-3 border rounded-md bg-muted/20 font-mono font-bold">
                            1000 TICKS
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DigitFrequencyCircles 
                ticks={lastDigitTicks} 
                selectedDigit={selectedDigit}
                onDigitSelect={setSelectedDigit}
                selectedMarket={selectedMarket}
            />

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
                    <CardTitle className="text-base font-semibold uppercase">Market Direction (Last 1000 Ticks)</CardTitle>
                    <CardDescription>High-precision analysis of dominance and potential reversals.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!marketDirectionAnalysis ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Collecting data...</p>
                    ) : (
                        <div className="space-y-4">
                             <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Even / Odd</h4>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm font-bold">
                                                <span>Even</span>
                                                <span>{marketDirectionAnalysis.evenOdd.chartData[0].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full" style={{ width: `${marketDirectionAnalysis.evenOdd.chartData[0].value}%`, backgroundColor: marketDirectionAnalysis.evenOdd.chartData[0].fill }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm font-bold">
                                                <span>Odd</span>
                                                <span>{marketDirectionAnalysis.evenOdd.chartData[1].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full" style={{ width: `${marketDirectionAnalysis.evenOdd.chartData[1].value}%`, backgroundColor: marketDirectionAnalysis.evenOdd.chartData[1].fill }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={marketDirectionAnalysis.evenOdd.reversal !== 'None' ? 'destructive' : 'outline'}>
                                            REVERSAL: {marketDirectionAnalysis.evenOdd.reversal}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Matches / Differs (Hottest: {marketDirectionAnalysis.matchesDiffers.hottest})</h4>
                                <div className="grid grid-cols-2 items-center gap-4">
                                     <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm font-bold">
                                                <span>Matches</span>
                                                <span>{marketDirectionAnalysis.matchesDiffers.chartData[0].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full" style={{ width: `${marketDirectionAnalysis.matchesDiffers.chartData[0].value}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.chartData[0].fill }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm font-bold">
                                                <span>Differs</span>
                                                <span>{marketDirectionAnalysis.matchesDiffers.chartData[1].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full" style={{ width: `${marketDirectionAnalysis.matchesDiffers.chartData[1].value}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.chartData[1].fill }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <RiseFallAnalysis 
                priceHistory={priceHistory}
                selectedMarket={selectedMarket}
                price={price}
                decimalPlaces={decimalPlaces}
                variant="compact"
            />
        </div>
    );
}
