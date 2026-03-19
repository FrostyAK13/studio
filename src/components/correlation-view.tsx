'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Zap } from 'lucide-react';
import { TickPacingVisualizer } from './tick-pacing-visualizer';
import { cn } from '@/lib/utils';

interface CorrelationViewProps {
    currentTps: number;
    historicalTps: { time: string; tps: number }[];
    highVolatilityDigits: number[];
    lowVolatilityDigits: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    tickTimestamps: number[];
    lastDigitTicks: number[];
}

const DigitFrequencyCircles = ({ ticks }: { ticks: number[] }) => {
    const { digitData, lastDigit } = React.useMemo(() => {
        const counts = Array(10).fill(0);
        ticks.forEach(d => counts[d]++);
        const total = ticks.length || 1;
        
        // Map to include index for sorting
        const mapped = counts.map((count, index) => ({
            index,
            count,
            percentage: (count / total) * 100
        }));

        // Sort by count descending to find ranks
        const sorted = [...mapped].sort((a, b) => b.count - a.count);

        return {
            digitData: mapped.map(item => {
                const rank = sorted.findIndex(s => s.index === item.index);
                let colorClass = "text-muted-foreground/40";
                
                if (rank === 0) colorClass = "text-green-500"; // Most
                else if (rank === 1) colorClass = "text-blue-500"; // 2nd Most
                else if (rank === 8) colorClass = "text-orange-500"; // 2nd Lowest (9th place)
                else if (rank === 9) colorClass = "text-red-500"; // Lowest (10th place)

                return { ...item, colorClass };
            }),
            lastDigit: ticks.length > 0 ? ticks[0] : null
        };
    }, [ticks]);

    const DigitCircle = ({ digit, percentage, colorClass, isLast }: { digit: number, percentage: number, colorClass: string, isLast: boolean }) => {
        const radius = 26;
        const circumference = 2 * Math.PI * radius;
        // Scale arc relative to 20% max for visibility
        const offset = circumference - (Math.min(percentage, 20) / 20) * circumference;

        return (
            <div className="flex flex-col items-center relative py-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-muted-foreground/10"
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
                        <span className="text-xl font-black leading-tight">{digit}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute -bottom-1 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[10px] border-b-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
             <CardHeader className="pb-2 text-center">
                <CardTitle className="text-base font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Real-Time Digit Ranks
                </CardTitle>
                <CardDescription>Ranked by frequency: Most (Green), 2nd (Blue), Lowest (Red), 2nd Low (Orange).</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Row 1: 0 to 4 */}
                    <div className="grid grid-cols-5 gap-2 border-b border-white/5 pb-4">
                        {digitData.slice(0, 5).map((data) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                            />
                        ))}
                    </div>
                    {/* Row 2: 5 to 9 */}
                    <div className="grid grid-cols-5 gap-2 pt-4">
                        {digitData.slice(5, 10).map((data) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export function CorrelationView({
    currentTps,
    historicalTps,
    selectedMarket,
    onMarketChange,
    tickTimestamps,
    lastDigitTicks,
}: CorrelationViewProps) {

    const chartConfig = { tps: { label: "TPS", color: "hsl(var(--primary))" }};

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                    <Label htmlFor="correlation-market-select" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Synthetic Market</Label>
                    <Select value={selectedMarket} onValueChange={onMarketChange}>
                        <SelectTrigger id="correlation-market-select" className="mt-2 h-12 text-lg font-semibold bg-background/50 border-none shadow-inner">
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

            <DigitFrequencyCircles ticks={lastDigitTicks} />

            <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-base font-bold uppercase tracking-wider">Market Volatility Pulse</CardTitle>
                    <CardDescription>Measuring the velocity and frequency of incoming ticks.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-primary/10 p-8 gap-3 shadow-inner">
                        <div className="flex items-center gap-2 text-primary">
                            <Zap className="h-5 w-5 fill-primary" />
                            <span className="text-xs font-black tracking-[0.3em] uppercase">LIVE TICK SPEED</span>
                        </div>
                        <span className="text-8xl font-black text-primary tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                            {currentTps}
                        </span>
                        <span className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest">Ticks / Second</span>
                    </div>

                    <div className="flex flex-col">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-center mb-6 text-muted-foreground/60">60-Second Volatility History</h4>
                        <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <BarChart data={historicalTps} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="time" tick={{ fontSize: 9, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <YAxis width={20} tick={{ fontSize: 9, fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--primary))', opacity: 0.05 }}
                                    content={({ active, payload, label }) => {
                                      if (active && payload && payload.length) {
                                        return (
                                          <div className="rounded-xl border bg-background/90 backdrop-blur-md p-3 text-sm shadow-2xl border-primary/20">
                                            <p className="font-black text-xs uppercase tracking-wider mb-1 opacity-60">{label}</p>
                                            <p className="text-lg font-black text-primary">{`${payload[0].value} TPS`}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="tps"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={500}
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </CardContent>
            </Card>

            <TickPacingVisualizer tickTimestamps={tickTimestamps} lastDigitTicks={lastDigitTicks} />
        </div>
    );
}
