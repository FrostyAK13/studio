'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Compass } from 'lucide-react';

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
    '#3b82f6', // 0 - blue-500
    '#14b8a6', // 1 - teal-500
    '#22c55e', // 2 - green-500
    '#84cc16', // 3 - lime-500
    '#f59e0b', // 4 - amber-500
    '#ef4444', // 5 - red-500
    '#ec4899', // 6 - pink-500
    '#a855f7', // 7 - purple-500
    '#f97316', // 8 - orange-500
    '#06b6d4'  // 9 - cyan-500
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
    
    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks.slice(0, 50);
        if (ticks.length < 10) {
            return null;
        }

        // Even/Odd
        const evenCount = ticks.filter(d => d % 2 === 0).length;
        const evenPercentage = (evenCount / ticks.length) * 100;
        const oddPercentage = 100 - evenPercentage;
        let evenOddReversal: 'Even' | 'Odd' | 'None' = 'None';
        const evenOddOutcomes = ticks.map(d => d % 2 === 0 ? 'E' : 'O');
        if (ticks.length >= 5) {
            const lastFive = evenOddOutcomes.slice(0, 5);
            if (lastFive.every(o => o === 'E')) evenOddReversal = 'Odd';
            if (lastFive.every(o => o === 'O')) evenOddReversal = 'Even';
        }
        const evenOddChartData = [
            { name: 'Even', value: evenPercentage, fill: '#3b82f6' },
            { name: 'Odd', value: oddPercentage, fill: '#a855f7' },
        ];

        // Matches/Differs
        const counts = Array(10).fill(0);
        ticks.forEach(digit => { counts[digit]++; });
        const hottestDigit = counts.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
        
        const matchesCount = counts[hottestDigit];
        const matchesPercentage = (matchesCount / ticks.length) * 100;
        const differsPercentage = 100 - matchesPercentage;
        const matchesDiffersChartData = [
            { name: 'Matches', value: matchesPercentage, fill: '#14b8a6' },
            { name: 'Differs', value: differsPercentage, fill: '#6b7280' },
        ];


        // Over/Under
        const lowerClusterCount = ticks.filter(d => d <= 4).length;
        const higherClusterCount = ticks.length - lowerClusterCount;
        const lowerPercentage = (lowerClusterCount / ticks.length) * 100;
        const higherPercentage = 100 - lowerPercentage;
        let clusterReversal: 'Lower (0-4)' | 'Higher (5-9)' | 'None' = 'None';
        const clusterOutcomes = ticks.map(d => d <= 4 ? 'L' : 'H');
        if (ticks.length >= 5) {
            const lastFiveClusters = clusterOutcomes.slice(0, 5);
            if (lastFiveClusters.every(c => c === 'L')) clusterReversal = 'Higher (5-9)';
            if (lastFiveClusters.every(c => c === 'H')) clusterReversal = 'Lower (0-4)';
        }
        const overUnderChartData = [
            { name: 'Lower (0-4)', value: lowerPercentage, fill: '#22c55e' },
            { name: 'Higher (5-9)', value: higherPercentage, fill: '#ef4444' },
        ];

        return {
            evenOdd: {
                reversal: evenOddReversal,
                chartData: evenOddChartData,
            },
            matchesDiffers: {
                hottest: hottestDigit,
                chartData: matchesDiffersChartData,
            },
            overUnder: {
                reversal: clusterReversal,
                chartData: overUnderChartData,
            }
        };
    }, [lastDigitTicks]);

    const chartConfig = {
      ...Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [
          i.toString(),
          { label: `Digit ${i}`, color: digitColors[i] },
        ])
      ),
    }
    
    const MiniChartTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
            <div className="rounded-lg border bg-background p-2 text-sm shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                        {payload[0].name}
                        </span>
                        <span className="font-bold text-foreground">
                        {payload[0].value.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
            )
        }
        return null
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
                    {[...lastDigitTicks.slice(0, 30)].reverse().map((digit, i) => (
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
                <CardContent className="flex items-center justify-center">
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[400px]">
                        <PieChart>
                            <Tooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="min-w-[8rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
                                        <p className="font-bold text-foreground">{`Digit ${data.digit}`}</p>
                                        <p className="text-muted-foreground">{`Count: ${data.count}`}</p>
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
                                outerRadius={150}
                                labelLine={false}
                                label={({
                                    cx,
                                    cy,
                                    midAngle,
                                    innerRadius,
                                    outerRadius,
                                    index,
                                }) => {
                                    const RADIAN = Math.PI / 180
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN)

                                    if (chartData[index].percentage < 5) return null;

                                    return (
                                        <text
                                            x={x}
                                            y={y}
                                            fill="white"
                                            textAnchor={x > cx ? "start" : "end"}
                                            dominantBaseline="central"
                                            className="text-base font-bold"
                                        >
                                            {chartData[index].digit}
                                        </text>
                                    )
                                }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={digitColors[entry.digit]} />
                                ))}
                            </Pie>
                            <Legend
                                content={({ payload }) => {
                                return (
                                    <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 text-sm">
                                    {payload?.map((entry, index) => (
                                        <li key={`item-${index}`} className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-muted-foreground">{entry.payload?.payload.digit}:</span>
                                        <span className="font-medium">{entry.payload?.payload.percentage.toFixed(1)}%</span>
                                        </li>
                                    ))}
                                    </ul>
                                )
                                }}
                            />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Compass className="h-5 w-5 text-muted-foreground" />
                        Market Direction (Last 50 Ticks)
                    </CardTitle>
                    <CardDescription>Analysis of dominance and potential reversals.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!marketDirectionAnalysis ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Collecting more data for analysis... (needs at least 10 ticks)
                        </p>
                    ) : (
                        <div className="space-y-4">
                             <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Even / Odd</h4>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">Even</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.evenOdd.chartData[0].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.evenOdd.chartData[0].value}%`, backgroundColor: marketDirectionAnalysis.evenOdd.chartData[0].fill }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">Odd</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.evenOdd.chartData[1].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.evenOdd.chartData[1].value}%`, backgroundColor: marketDirectionAnalysis.evenOdd.chartData[1].fill }}></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm pt-2">
                                            <span>Reversal Signal:</span>
                                            <Badge variant={marketDirectionAnalysis.evenOdd.reversal !== 'None' ? 'destructive' : 'outline'}>
                                                {marketDirectionAnalysis.evenOdd.reversal}
                                            </Badge>
                                        </div>
                                    </div>
                                    <ChartContainer config={{}} className="h-32 w-32 mx-auto">
                                        <PieChart>
                                            <Tooltip content={<MiniChartTooltip />} />
                                            <Pie data={marketDirectionAnalysis.evenOdd.chartData} dataKey="value" nameKey="name" innerRadius={32} outerRadius={48} paddingAngle={2}>
                                                {marketDirectionAnalysis.evenOdd.chartData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Matches / Differs</h4>
                                 <CardDescription className="text-xs mb-2 -mt-1">Analysis for Hottest Digit: {marketDirectionAnalysis.matchesDiffers.hottest}</CardDescription>
                                <div className="grid grid-cols-2 items-center gap-4">
                                     <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">Matches</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.matchesDiffers.chartData[0].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.matchesDiffers.chartData[0].value}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.chartData[0].fill }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">Differs</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.matchesDiffers.chartData[1].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.matchesDiffers.chartData[1].value}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.chartData[1].fill }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <ChartContainer config={{}} className="h-32 w-32 mx-auto">
                                        <PieChart>
                                            <Tooltip content={<MiniChartTooltip />} />
                                            <Pie data={marketDirectionAnalysis.matchesDiffers.chartData} dataKey="value" nameKey="name" innerRadius={32} outerRadius={48} paddingAngle={2}>
                                                {marketDirectionAnalysis.matchesDiffers.chartData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <h4 className="font-semibold mb-2">Over / Under Clusters</h4>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">Lower (0-4)</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.overUnder.chartData[0].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.overUnder.chartData[0].value}%`, backgroundColor: marketDirectionAnalysis.overUnder.chartData[0].fill }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">Higher (5-9)</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.overUnder.chartData[1].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.overUnder.chartData[1].value}%`, backgroundColor: marketDirectionAnalysis.overUnder.chartData[1].fill }}></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm pt-2">
                                            <span>Reversal Signal:</span>
                                            <Badge variant={marketDirectionAnalysis.overUnder.reversal !== 'None' ? 'destructive' : 'outline'}>
                                                {marketDirectionAnalysis.overUnder.reversal}
                                            </Badge>
                                        </div>
                                    </div>
                                    <ChartContainer config={{}} className="h-32 w-32 mx-auto">
                                        <PieChart>
                                            <Tooltip content={<MiniChartTooltip />} />
                                            <Pie data={marketDirectionAnalysis.overUnder.chartData} dataKey="value" nameKey="name" innerRadius={32} outerRadius={48} paddingAngle={2}>
                                                {marketDirectionAnalysis.overUnder.chartData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
