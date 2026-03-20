'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Info, Target, Zap } from 'lucide-react';

interface CorrelationViewProps {
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    lastDigitTicks: number[];
}

export const DigitFrequencyCircles = ({ 
    ticks, 
    selectedDigit, 
    onDigitSelect,
    selectedMarket,
    onMarketChange
}: { 
    ticks: number[], 
    selectedDigit: number | null, 
    onDigitSelect: (d: number) => void,
    selectedMarket: string,
    onMarketChange?: (market: string) => void
}) => {
    const marketName = React.useMemo(() => {
        return syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;
    }, [selectedMarket]);

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
                
                if (rank === 0) colorClass = "text-emerald-400";
                else if (rank === 1) colorClass = "text-cyan-400";
                else if (rank === 8) colorClass = "text-orange-400";
                else if (rank === 9) colorClass = "text-rose-500";

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
        const radius = 22;
        const smRadius = 28;
        const circumference = 2 * Math.PI * smRadius;
        const offset = circumference - (Math.min(percentage, 25) / 25) * circumference;

        return (
            <div 
                className={cn(
                    "flex flex-col items-center relative cursor-pointer transition-all duration-300 px-0.5 py-1",
                    isSelected && "bg-primary/20 rounded-xl ring-2 ring-primary/40 scale-105 z-20"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="42%"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-muted-foreground/10"
                        />
                        <circle
                            cx="50%"
                            cy="50%"
                            r="42%"
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray="140%" 
                            strokeDashoffset={`${140 - (Math.min(percentage, 25) / 25) * 140}%`}
                            strokeLinecap="round"
                            className={cn("transition-all duration-700 ease-out", colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn(
                            "text-2xl sm:text-4xl font-black leading-none tracking-tighter transition-colors",
                            isSelected ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-foreground"
                        )}>{digit}</span>
                        <span className="text-[8px] sm:text-[10px] font-black text-muted-foreground mt-0.5">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute -bottom-1 w-0 h-0 border-l-[4px] sm:border-l-[6px] border-l-transparent border-r-[4px] sm:border-r-[6px] border-r-transparent border-b-[8px] sm:border-b-[10px] border-b-cyan-400 animate-bounce" />
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-2xl bg-card/40 backdrop-blur-xl">
            <div className="px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg text-[8px] sm:text-[10px] text-muted-foreground font-bold border border-white/5 uppercase tracking-wider">
                    <Info className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-cyan-400" />
                    <span className="truncate">Sample: {ticks.length} • {marketName}</span>
                </div>
            </div>
             <CardHeader className="pb-2 pt-3 sm:pt-4 text-center px-2">
                <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] flex items-center justify-center gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                    DIGIT PERCENTAGE
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
                <div className="space-y-1">
                    <div className="grid grid-cols-5 gap-0.5 sm:gap-1 border-b border-white/10 pb-2">
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
                    <div className="grid grid-cols-5 gap-0.5 sm:gap-1 pt-2">
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
        <div className="mt-4 animate-in fade-in zoom-in-95 duration-300">
            <Card className="border-none bg-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative border-t-2 border-primary/50">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-primary to-emerald-500" />
                <CardHeader className="pb-4 pt-6 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Target className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg sm:text-xl font-black text-white tracking-tight">DIGIT {digit} INSIGHTS</CardTitle>
                                <CardDescription className="text-primary/60 uppercase tracking-[0.2em] text-[8px] sm:text-[10px] font-black">Midpoint Strategy Matrix</CardDescription>
                            </div>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-primary/30 font-black px-3 py-1 text-[10px]">
                            {stats.totalTicks} ANALYZED
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-8 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                        {/* MATCHES VS DIFFERS */}
                        <div className="space-y-4 sm:space-y-5 p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Zap className="h-3 w-3 text-emerald-400" /> Accuracy Profile
                                </h4>
                                <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">{stats.matches.toFixed(1)}%</span>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-emerald-300">Matches {digit}</span>
                                        <span className="text-emerald-400 tabular-nums">{stats.matchesCount}</span>
                                    </div>
                                    <Progress value={stats.matches} className="h-3 sm:h-3.5 bg-emerald-950/40 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-rose-300">Differs Result</span>
                                        <span className="text-rose-400 tabular-nums">{stats.differsCount}</span>
                                    </div>
                                    <Progress value={stats.differs} className="h-3 sm:h-3.5 bg-rose-950/40 [&>div]:bg-gradient-to-r [&>div]:from-rose-600 [&>div]:to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                                </div>
                            </div>
                        </div>

                        {/* OVER VS UNDER */}
                        <div className="space-y-4 sm:space-y-5 p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex justify-between items-end border-b border-white/10 pb-2">
                                <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Target className="h-3 w-3 text-cyan-400" /> Relative Skew
                                </h4>
                                <span className="text-2xl sm:text-3xl font-black text-cyan-400 tabular-nums">{stats.over.toFixed(1)}%</span>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-cyan-300">Over {digit}</span>
                                        <span className="text-cyan-400 tabular-nums">{stats.overCount}</span>
                                    </div>
                                    <Progress value={stats.over} className="h-3 sm:h-3.5 bg-cyan-950/40 [&>div]:bg-gradient-to-r [&>div]:from-cyan-600 [&>div]:to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-orange-300">Under {digit}</span>
                                        <span className="text-orange-400 tabular-nums">{stats.underCount}</span>
                                    </div>
                                    <Progress value={stats.under} className="h-3 sm:h-3.5 bg-orange-950/40 [&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export function CorrelationView({
    selectedMarket,
    onMarketChange,
    lastDigitTicks,
}: CorrelationViewProps) {
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    return (
        <div className="space-y-4">
            <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md">
                <CardContent className="p-3 sm:p-4">
                    <Label htmlFor="circles-market-select" className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Configuration Market</Label>
                    <Select value={selectedMarket} onValueChange={onMarketChange}>
                        <SelectTrigger id="circles-market-select" className="mt-2 h-10 sm:h-11 text-sm sm:text-base font-bold bg-background/50 border-white/5 shadow-inner rounded-xl">
                            <SelectValue placeholder="Select Index" />
                        </SelectTrigger>
                        <SelectContent side="bottom" position="popper" sideOffset={4} className="rounded-xl border-white/10 bg-slate-950 text-white z-[100]">
                            {syntheticIndices.map((index) => (
                            <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-2">
                                {index.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <DigitFrequencyCircles 
                ticks={lastDigitTicks} 
                selectedDigit={selectedDigit}
                onDigitSelect={setSelectedDigit}
                selectedMarket={selectedMarket}
                onMarketChange={onMarketChange}
            />

            {selectedDigit !== null && (
                <DigitDetailPanel digit={selectedDigit} ticks={lastDigitTicks} />
            )}
        </div>
    );
}
