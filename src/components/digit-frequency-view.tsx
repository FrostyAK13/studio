'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RiseFallAnalysis } from './rise-fall-analysis';
import { Target, Zap, List, Hash, Activity, Flame, Timer, BarChartHorizontal } from 'lucide-react';
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

const DigitHeatCard = ({ digit, ticks, isSelected, onSelect }: { 
    digit: number, 
    ticks: number[], 
    isSelected: boolean, 
    onSelect: (d: number) => void 
}) => {
    const stats = React.useMemo(() => {
        const total = ticks.length || 1;
        const matches = ticks.filter(t => t === digit).length;
        const freq = (matches / total) * 100;
        
        let tsl = 0;
        for (let i = 0; i < ticks.length; i++) {
            if (ticks[i] === digit) break;
            tsl++;
        }

        let colorClass = "text-muted-foreground";
        let glowClass = "shadow-none";
        let bgClass = "bg-white/5";
        let borderClass = "border-white/5";

        if (freq > 13) {
            colorClass = "text-rose-400";
            glowClass = "shadow-[0_0_20px_rgba(244,63,94,0.3)]";
            bgClass = "bg-rose-500/10";
            borderClass = "border-rose-500/20";
        } else if (freq > 11) {
            colorClass = "text-orange-400";
            bgClass = "bg-orange-500/10";
            borderClass = "border-orange-500/20";
        } else if (freq < 7) {
            colorClass = "text-cyan-400";
            bgClass = "bg-cyan-500/10";
            borderClass = "border-cyan-500/20";
        }

        return { freq, tsl, colorClass, glowClass, bgClass, borderClass };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-300 rounded-2xl border p-4 flex flex-col justify-between h-32 sm:h-44 overflow-hidden",
                stats.bgClass,
                stats.borderClass,
                isSelected ? "ring-2 ring-primary scale-105 z-20 shadow-2xl bg-primary/20" : "hover:scale-[1.02] hover:bg-white/10",
                stats.glowClass
            )}
        >
            <div className="flex justify-between items-start">
                <span className={cn("text-4xl sm:text-6xl font-black tracking-tighter leading-none", isSelected ? "text-primary" : "text-white")}>
                    {digit}
                </span>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Frequency</p>
                    <p className={cn("text-lg sm:text-2xl font-black tabular-nums", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 opacity-60">
                    <Timer className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">TSL GAP</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-4xl font-black text-white tabular-nums drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">
                        {stats.tsl}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ticks</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/40">
                <div 
                    className={cn("h-full transition-all duration-1000", stats.colorClass.replace('text-', 'bg-'))} 
                    style={{ width: `${Math.min(stats.freq * 5, 100)}%` }} 
                />
            </div>
        </div>
    );
};

const DigitDetailInsights = ({ digit, ticks }: { digit: number, ticks: number[] }) => {
    const stats = React.useMemo(() => {
        const total = ticks.length || 1;
        const matches = ticks.filter(t => t === digit).length;
        const actualFreq = (matches / total) * 100;
        const over = ticks.filter(t => t > digit).length;
        const under = ticks.filter(t => t < digit).length;
        const ouTotal = (over + under) || 1;

        return {
            actualFreq,
            matches,
            differs: total - matches,
            over: (over / ouTotal) * 100,
            under: (under / ouTotal) * 100,
        };
    }, [digit, ticks]);

    return (
        <Card className="mt-8 border-none bg-slate-950/90 backdrop-blur-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 via-primary to-purple-500" />
            <CardHeader className="pb-6 pt-10 px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                            <Activity className="h-8 w-8 text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]" />
                        </div>
                        <div className="text-center sm:text-left">
                            <CardTitle className="text-3xl font-black text-white tracking-tighter uppercase">DIGIT {digit} INTELLIGENCE</CardTitle>
                            <CardDescription className="text-primary/60 font-black uppercase tracking-[0.4em] text-[11px] mt-1">Advanced Volumetric Report</CardDescription>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-center">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Stability Rating</p>
                        <p className="text-xl font-black text-emerald-400 tabular-nums">HIGH PRECISION</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8 p-8 rounded-3xl bg-white/5 border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                            <Hash className="h-4 w-4 text-emerald-400" /> Accuracy Matrix
                        </h4>
                        <span className="text-3xl font-black text-emerald-400 tabular-nums">{stats.actualFreq.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-emerald-300">
                                <span>Matches Flow</span>
                                <span>{stats.matches} Ticks</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-4 bg-black/40 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-rose-300">
                                <span>Variance (Differs)</span>
                                <span>{stats.differs} Ticks</span>
                            </div>
                            <Progress value={100 - (stats.actualFreq * 4)} className="h-4 bg-black/40 [&>div]:bg-gradient-to-r [&>div]:from-rose-600 [&>div]:to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
                        </div>
                    </div>
                </div>

                <div className="space-y-8 p-8 rounded-3xl bg-white/5 border border-white/5 shadow-inner">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3">
                            <BarChartHorizontal className="h-4 w-4 text-cyan-400" /> Barrier Skew
                        </h4>
                        <span className="text-3xl font-black text-cyan-400 tabular-nums">{stats.over.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-cyan-300">
                                <span>Over {digit} Weight</span>
                                <span>{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-4 bg-black/40 [&>div]:bg-gradient-to-r [&>div]:from-cyan-600 [&>div]:to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-orange-300">
                                <span>Under {digit} Weight</span>
                                <span>{stats.under.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.under} className="h-4 bg-black/40 [&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
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

    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks;
        if (ticks.length < 2) return null;

        const total = ticks.length;
        const evenCount = ticks.filter(d => d % 2 === 0).length;
        const evenPercentage = (evenCount / total) * 100;
        const oddPercentage = 100 - evenPercentage;
        
        const counts = Array(10).fill(0);
        ticks.forEach(digit => { counts[digit]++; });
        const hottestDigit = counts.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
        const matchesPercentage = (counts[hottestDigit] / total) * 100;
        
        const lowerCount = ticks.filter(d => d <= 4).length;
        const lowerPercentage = (lowerCount / total) * 100;
        const higherPercentage = 100 - lowerPercentage;
        
        return {
            evenOdd: { even: evenPercentage, odd: oddPercentage },
            matchesDiffers: { hottest: hottestDigit, matches: matchesPercentage, differs: 100 - matchesPercentage },
            overUnder: { lower: lowerPercentage, higher: higherPercentage }
        };
    }, [lastDigitTicks]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16">
            <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12">
                    <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/80 ml-1">Market Logic Configuration</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-14 bg-background/40 border-white/5 rounded-2xl font-black text-base shadow-inner">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-white/10">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id}>
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/80 ml-1">Data Stream Window (TICKS)</Label>
                        <Input
                            type="number"
                            min="1"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                            className="h-14 bg-background/40 border-white/5 rounded-2xl font-black text-2xl text-primary text-center shadow-inner"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.5em] text-primary flex items-center gap-4">
                        <Flame className="h-5 w-5 animate-pulse text-rose-500" /> DIGIT HEAT MATRIX
                    </h3>
                    <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 font-black tracking-widest uppercase text-[10px]">
                        {lastDigitTicks.length} TICK SAMPLE
                    </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
                    {Array.from({ length: 10 }, (_, i) => (
                        <DigitHeatCard 
                            key={i} 
                            digit={i} 
                            ticks={lastDigitTicks} 
                            isSelected={selectedDigit === i} 
                            onSelect={setSelectedDigit} 
                        />
                    ))}
                </div>
            </div>

            {selectedDigit !== null && (
                <DigitDetailInsights digit={selectedDigit} ticks={lastDigitTicks} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {marketDirectionAnalysis && (
                    <>
                        <div className="p-8 rounded-[2rem] bg-slate-950/60 border border-white/5 backdrop-blur-xl group hover:bg-slate-950/80 transition-all duration-500">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground border-b border-white/5 pb-5 flex items-center gap-3">
                                <List className="h-5 w-5 text-chart-1" /> EVEN / ODD GATES
                            </h4>
                            <div className="space-y-8 pt-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                        <span className="text-chart-1">Even Flow</span>
                                        <span className="text-white text-lg">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.even} className="h-4 bg-black/40 [&>div]:bg-chart-1 shadow-[0_0_12px_rgba(var(--chart-1),0.5)]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                        <span className="text-chart-3">Odd Flow</span>
                                        <span className="text-white text-lg">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.odd} className="h-4 bg-black/40 [&>div]:bg-chart-3 shadow-[0_0_12px_rgba(var(--chart-3),0.5)]" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-slate-950/60 border border-white/5 backdrop-blur-xl group hover:bg-slate-950/80 transition-all duration-500">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground border-b border-white/5 pb-5 flex items-center gap-3">
                                <BarChartHorizontal className="h-5 w-5 text-accent" /> BARRIER SYMMETRY
                            </h4>
                            <div className="space-y-8 pt-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                        <span className="text-accent">Under 5 Weight</span>
                                        <span className="text-white text-lg">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.lower} className="h-4 bg-black/40 [&>div]:bg-accent shadow-[0_0_12px_rgba(var(--accent),0.5)]" />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                                        <span className="text-rose-500">Over 4 Weight</span>
                                        <span className="text-white text-lg">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.higher} className="h-4 bg-black/40 [&>div]:bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 rounded-[2rem] bg-slate-950/60 border border-white/5 backdrop-blur-xl group hover:bg-slate-950/80 transition-all duration-500">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground border-b border-white/5 pb-5 flex items-center gap-3">
                                <Zap className="h-5 w-5 text-cyan-400" /> REAL-TIME PIVOT
                            </h4>
                            <div className="flex flex-col items-center justify-center pt-4 h-full">
                                <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em] mb-2">Technical HUD Flux</p>
                                <p className="text-5xl sm:text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                                    {price.toFixed(decimalPlaces)}
                                </p>
                                <div className="mt-8 flex gap-4 w-full">
                                    <div className="flex-1 text-center bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-2xl">
                                        <p className="text-[9px] font-black uppercase text-emerald-400">Bullish</p>
                                        <p className="text-xl font-black">{marketDirectionAnalysis.overUnder.higher.toFixed(0)}%</p>
                                    </div>
                                    <div className="flex-1 text-center bg-rose-500/10 border border-rose-500/20 py-3 rounded-2xl">
                                        <p className="text-[9px] font-black uppercase text-rose-400">Bearish</p>
                                        <p className="text-xl font-black">{marketDirectionAnalysis.overUnder.lower.toFixed(0)}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

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
