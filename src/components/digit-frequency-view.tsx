
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
import { Compass, Progress as ProgressIcon } from 'lucide-react';
import { RiseFallAnalysis } from './rise-fall-analysis';
import { Progress } from '@/components/ui/progress';

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

const DigitFrequencyCircles = ({ 
    ticks, 
    selectedDigit, 
    onDigitSelect 
}: { 
    ticks: number[], 
    selectedDigit: number | null, 
    onDigitSelect: (d: number) => void 
}) => {
    const { digitData, lastDigit } = React.useMemo(() => {
        const counts = Array(10).fill(0);
        ticks.forEach(d => counts[d]++);
        const total = ticks.length || 1;
        
        const mapped = counts.map((count, index) => ({
            index,
            count,
            percentage: (count / total) * 100
        }));

        const sorted = [...mapped].sort((a, b) => b.count - a.count);

        return {
            digitData: mapped.map(item => {
                const rank = sorted.findIndex(s => s.index === item.index);
                let colorClass = "text-muted-foreground/20";
                
                if (rank === 0) colorClass = "text-emerald-400"; // Most (Green)
                else if (rank === 1) colorClass = "text-cyan-400"; // 2nd Most (Blue)
                else if (rank === 8) colorClass = "text-orange-400"; // 2nd Lowest (Orange)
                else if (rank === 9) colorClass = "text-rose-400"; // Lowest (Red)

                return { ...item, colorClass };
            }),
            lastDigit: ticks.length > 0 ? ticks[0] : null
        };
    }, [ticks]);

    const DigitCircle = ({ digit, percentage, colorClass, isLast, isSelected }: { 
        digit: number, 
        percentage: number, 
        colorClass: string, 
        isLast: boolean,
        isSelected: boolean 
    }) => {
        const radius = 28;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (Math.min(percentage, 25) / 25) * circumference;

        return (
            <div 
                className={cn(
                    "flex flex-col items-center relative cursor-pointer transition-all duration-300",
                    isSelected && "bg-primary/10 rounded-xl ring-1 ring-primary/30"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-muted-foreground/5"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-in-out", colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn(
                            "text-3xl font-black leading-none transition-colors",
                            isSelected ? "text-primary" : "text-foreground"
                        )}>{digit}</span>
                        <span className="text-[9px] font-bold text-muted-foreground mt-0.5">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute -bottom-0.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-primary animate-bounce" />
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md">
             <CardHeader className="pb-1 pt-3 text-center">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    DIGIT PERCENTAGE
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <div className="space-y-0.5">
                    <div className="grid grid-cols-5 gap-1 border-b border-white/5 pb-1">
                        {digitData.slice(0, 5).map((data) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                                isSelected={selectedDigit === data.index}
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1 pt-1">
                        {digitData.slice(5, 10).map((data) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                                isSelected={selectedDigit === data.index}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const DigitDetailPanel = ({ digit, ticks }: { digit: number, ticks: number[] }) => {
    const stats = React.useMemo(() => {
        const total = ticks.length || 1;
        const matches = ticks.filter(t => t === digit).length;
        const differs = total - matches;
        const over = ticks.filter(t => t > digit).length;
        const under = ticks.filter(t => t < digit).length;
        
        const ouTotal = (over + under) || 1;

        return {
            matches: (matches / total) * 100,
            differs: (differs / total) * 100,
            over: (over / ouTotal) * 100,
            under: (under / ouTotal) * 100,
            matchesCount: matches,
            differsCount: differs,
            overCount: over,
            underCount: under,
            totalTicks: total
        };
    }, [digit, ticks]);

    return (
        <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="border-none bg-indigo-950/20 backdrop-blur-xl shadow-2xl overflow-hidden relative border-t border-cyan-500/20">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 opacity-50" />
                <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black text-cyan-400">DIGIT {digit} INSIGHTS</CardTitle>
                            <CardDescription className="text-cyan-100/40 uppercase tracking-widest text-[10px] font-bold">Midpoint Strategy Matrix</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-950/50 px-2 py-0.5 font-bold tracking-tighter text-[10px]">
                            {stats.totalTicks} TICKS
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end border-b border-white/5 pb-1">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Matching Frequency</h4>
                                <div className="text-right flex flex-col">
                                    <span className="text-2xl font-black text-emerald-400 leading-none">{stats.matches.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-emerald-300">Matches {digit}</span>
                                        <span className="text-emerald-400">{stats.matchesCount}</span>
                                    </div>
                                    <Progress value={stats.matches} className="h-2.5 bg-emerald-950/30 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-rose-300">All Differs</span>
                                        <span className="text-rose-400">{stats.differsCount}</span>
                                    </div>
                                    <Progress value={stats.differs} className="h-2.5 bg-rose-950/30 [&>div]:bg-gradient-to-r [&>div]:from-rose-600 [&>div]:to-rose-400" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end border-b border-white/5 pb-1">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Relative Distribution</h4>
                                <div className="text-right flex flex-col">
                                    <span className="text-2xl font-black text-cyan-400 leading-none">{stats.over.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-cyan-300">Over {digit}</span>
                                        <span className="text-cyan-400">{stats.overCount}</span>
                                    </div>
                                    <Progress value={stats.over} className="h-2.5 bg-cyan-950/30 [&>div]:bg-gradient-to-r [&>div]:from-cyan-600 [&>div]:to-cyan-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-orange-300">Under {digit}</span>
                                        <span className="text-orange-400">{stats.underCount}</span>
                                    </div>
                                    <Progress value={stats.under} className="h-2.5 bg-orange-950/30 [&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

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
            { name: 'Even', value: evenPercentage, fill: 'hsl(var(--chart-1))' },
            { name: 'Odd', value: oddPercentage, fill: 'hsl(var(--chart-3))' },
        ];

        // Matches/Differs
        const counts = Array(10).fill(0);
        ticks.forEach(digit => { counts[digit]++; });
        const hottestDigit = counts.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
        
        const matchesCount = counts[hottestDigit];
        const matchesPercentage = (matchesCount / ticks.length) * 100;
        const differsPercentage = 100 - matchesPercentage;
        const matchesDiffersChartData = [
            { name: 'Matches', value: matchesPercentage, fill: 'hsl(var(--chart-2))' },
            { name: 'Differs', value: differsPercentage, fill: 'hsl(var(--chart-5))' },
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
            { name: 'Lower (0-4)', value: lowerPercentage, fill: 'hsl(var(--chart-1))' },
            { name: 'Higher (5-9)', value: higherPercentage, fill: 'hsl(var(--destructive))' },
        ];

        // Over Cluster (0-2 vs 3-9)
        const overClusterLowCount = ticks.filter(d => d <= 2).length;
        const overClusterHighCount = ticks.length - overClusterLowCount;
        const overClusterLowPercentage = (overClusterLowCount / ticks.length) * 100;
        const overClusterHighPercentage = 100 - overClusterLowPercentage;
        const overClusterChartData = [
            { name: 'Low (0-2)', value: overClusterLowPercentage, fill: 'hsl(var(--chart-1))' },
            { name: 'High (3-9)', value: overClusterHighPercentage, fill: 'hsl(var(--destructive))' },
        ];

        // Under Cluster (0-6 vs 7-9)
        const underClusterLowCount = ticks.filter(d => d <= 6).length;
        const underClusterHighCount = ticks.length - underClusterLowCount;
        const underClusterLowPercentage = (underClusterLowCount / ticks.length) * 100;
        const underClusterHighPercentage = 100 - underClusterLowPercentage;
        const underClusterChartData = [
            { name: 'Low (0-6)', value: underClusterLowPercentage, fill: 'hsl(var(--chart-1))' },
            { name: 'High (7-9)', value: underClusterHighPercentage, fill: 'hsl(var(--destructive))' },
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
            },
            overCluster: {
                chartData: overClusterChartData
            },
            underCluster: {
                chartData: underClusterChartData
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

            <DigitFrequencyCircles 
                ticks={lastDigitTicks} 
                selectedDigit={selectedDigit}
                onDigitSelect={setSelectedDigit}
            />

            {selectedDigit !== null && (
                <DigitDetailPanel digit={selectedDigit} ticks={lastDigitTicks} />
            )}

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
                    )).reverse()}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Probability Analysis</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[450px]">
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
                                outerRadius={220}
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

                                    if (chartData[index].percentage < 4) return null;

                                    return (
                                        <text
                                            x={x}
                                            y={y}
                                            fill="white"
                                            textAnchor={x > cx ? "start" : "end"}
                                            dominantBaseline="central"
                                            className="text-xl font-bold"
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
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">Even / Odd</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground font-mono">PRICE</p>
                                        <p className="font-bold text-primary text-lg">{price.toFixed(decimalPlaces)}</p>
                                    </div>
                                </div>
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
                                    <ChartContainer config={{}} className="h-40 w-40 mx-auto">
                                        <PieChart>
                                            <Tooltip content={<MiniChartTooltip />} />
                                            <Pie data={marketDirectionAnalysis.evenOdd.chartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={2}>
                                                {marketDirectionAnalysis.evenOdd.chartData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">Matches / Differs</h4>
                                        <CardDescription className="text-xs -mt-1">Analysis for Hottest Digit: {marketDirectionAnalysis.matchesDiffers.hottest}</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground font-mono">PRICE</p>
                                        <p className="font-bold text-primary text-lg">{price.toFixed(decimalPlaces)}</p>
                                    </div>
                                </div>
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
                                    <ChartContainer config={{}} className="h-40 w-40 mx-auto">
                                        <PieChart>
                                            <Tooltip content={<MiniChartTooltip />} />
                                            <Pie data={marketDirectionAnalysis.matchesDiffers.chartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={2}>
                                                {marketDirectionAnalysis.matchesDiffers.chartData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">Over / Under Clusters</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground font-mono">PRICE</p>
                                        <p className="font-bold text-primary text-lg">{price.toFixed(decimalPlaces)}</p>
                                    </div>
                                </div>
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
                                    <ChartContainer config={{}} className="h-40 w-40 mx-auto">
                                        <PieChart>
                                            <Tooltip content={<MiniChartTooltip />} />
                                            <Pie data={marketDirectionAnalysis.overUnder.chartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={2}>
                                                {marketDirectionAnalysis.overUnder.chartData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>
                            
                            <div className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">Over Cluster</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground font-mono">PRICE</p>
                                        <p className="font-bold text-primary text-lg">{price.toFixed(decimalPlaces)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">Low (0-2)</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.overCluster.chartData[0].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.overCluster.chartData[0].value}%`, backgroundColor: marketDirectionAnalysis.overCluster.chartData[0].fill }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">High (3-9)</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.overCluster.chartData[1].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.overCluster.chartData[1].value}%`, backgroundColor: marketDirectionAnalysis.overCluster.chartData[1].fill }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <ChartContainer config={{}} className="h-40 w-40 mx-auto">
                                        <PieChart>
                                            <Tooltip content={<MiniChartTooltip />} />
                                            <Pie data={marketDirectionAnalysis.overCluster.chartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={2}>
                                                {marketDirectionAnalysis.overCluster.chartData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                </div>
                            </div>
                            
                            <div className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">Under Cluster</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground font-mono">PRICE</p>
                                        <p className="font-bold text-primary text-lg">{price.toFixed(decimalPlaces)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 items-center gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">Low (0-6)</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.underCluster.chartData[0].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.underCluster.chartData[0].value}%`, backgroundColor: marketDirectionAnalysis.underCluster.chartData[0].fill }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1 text-sm">
                                                <span className="font-medium">High (7-9)</span>
                                                <span className="text-muted-foreground">{marketDirectionAnalysis.underCluster.chartData[1].value.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${marketDirectionAnalysis.underCluster.chartData[1].value}%`, backgroundColor: marketDirectionAnalysis.underCluster.chartData[1].fill }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <ChartContainer config={{}} className="h-40 w-40 mx-auto">
                                        <PieChart>
                                            <Tooltip content={<MiniChartTooltip />} />
                                            <Pie data={marketDirectionAnalysis.underCluster.chartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={2}>
                                                {marketDirectionAnalysis.underCluster.chartData.map((entry) => (
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
