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
import { Target, Zap, List, Hash, Activity, Flame, Timer, BarChartHorizontal, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
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
        
        // Momentum Analysis (last 50 vs total)
        const recentTicks = ticks.slice(0, 50);
        const recentMatches = recentTicks.filter(t => t === digit).length;
        const recentFreq = (recentMatches / (recentTicks.length || 1)) * 100;
        const velocity = recentFreq - freq;

        let tsl = 0;
        for (let i = 0; i < ticks.length; i++) {
            if (ticks[i] === digit) break;
            tsl++;
        }

        let colorClass = "text-muted-foreground";
        let glowClass = "";
        let bgClass = "bg-white/5";
        let borderClass = "border-white/5";
        let rating = "STABLE";

        if (freq > 13) {
            colorClass = "text-rose-400";
            glowClass = "shadow-[0_0_40px_rgba(244,63,94,0.4)] border-rose-500/40";
            bgClass = "bg-rose-500/10";
            rating = "VOLATILE";
        } else if (freq > 11) {
            colorClass = "text-orange-400";
            glowClass = "shadow-[0_0_25px_rgba(249,115,22,0.2)] border-orange-500/30";
            bgClass = "bg-orange-500/5";
            rating = "TRENDING";
        } else if (freq < 7) {
            colorClass = "text-cyan-400";
            glowClass = "shadow-[0_0_30px_rgba(6,182,212,0.3)] border-cyan-500/40";
            bgClass = "bg-cyan-500/10";
            rating = "COLD";
        }

        return { freq, tsl, colorClass, glowClass, bgClass, borderClass, rating, velocity };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-500 rounded-[1.5rem] sm:rounded-[3rem] border p-4 sm:p-8 flex flex-col justify-between h-40 sm:h-72 overflow-hidden backdrop-blur-xl",
                stats.bgClass,
                stats.glowClass || stats.borderClass,
                isSelected ? "ring-2 sm:ring-4 ring-primary scale-105 z-20 shadow-[0_0_80px_rgba(var(--primary),0.5)] bg-primary/20" : "hover:scale-[1.02] sm:hover:scale-[1.05] hover:bg-white/10"
            )}
        >
            <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                <Hash className={cn("w-20 h-20 sm:w-32 sm:h-32", stats.colorClass)} />
            </div>

            <div className="flex justify-between items-start relative z-10">
                <div className="relative">
                    <span className={cn(
                        "text-5xl sm:text-7xl md:text-9xl font-black tracking-tighter leading-none select-none drop-shadow-2xl transition-all duration-500",
                        isSelected ? "text-white scale-110" : stats.colorClass
                    )}>
                        {digit}
                    </span>
                    {Math.abs(stats.velocity) > 2 && (
                        <div className={cn(
                            "absolute -top-1 sm:-top-2 -right-6 sm:-right-10 flex items-center gap-1 font-black text-[7px] sm:text-[10px] uppercase tracking-widest px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-lg",
                            stats.velocity > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                            {stats.velocity > 0 ? <TrendingUp size={10} className="sm:w-3 sm:h-3" /> : <TrendingDown size={10} className="sm:w-3 sm:h-3" />}
                            {stats.velocity > 0 ? 'HEAT' : 'COOL'}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <Badge className={cn(
                        "text-[7px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.4em] mb-2 sm:mb-4 px-3 sm:px-6 py-1 sm:py-2 border-none shadow-xl",
                        stats.colorClass.replace('text-', 'bg-').replace('400', '500').replace('500', '600') + "/20",
                        stats.colorClass
                    )}>
                        {stats.rating}
                    </Badge>
                    <p className={cn("text-xl sm:text-3xl md:text-5xl font-black tabular-nums tracking-tighter drop-shadow-md", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="space-y-1 sm:space-y-2 relative z-10">
                <div className="flex items-center gap-2 sm:gap-3 opacity-50">
                    <Timer className="h-3 w-3 sm:h-5 sm:w-5" />
                    <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em]">TSL GAP CYCLE</span>
                </div>
                <div className="flex items-baseline gap-2 sm:gap-4">
                    <span className="text-3xl sm:text-5xl md:text-7xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                        {stats.tsl}
                    </span>
                    <span className="text-[10px] sm:text-[14px] font-black text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.4em] opacity-60">TICKS</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1.5 sm:h-3 bg-black/60 overflow-hidden">
                <div 
                    className={cn("h-full transition-all duration-1000 ease-out shadow-[0_0_30px]", stats.colorClass.replace('text-', 'bg-'))} 
                    style={{ 
                        width: `${Math.min(stats.freq * 6, 100)}%`,
                        boxShadow: `0 0 30px ${stats.colorClass.includes('rose') ? 'rgba(244,63,94,0.7)' : stats.colorClass.includes('cyan') ? 'rgba(6,182,212,0.7)' : 'rgba(255,255,255,0.4)'}`
                    }} 
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
        <Card className="mt-10 sm:mt-16 border-none bg-slate-950/90 backdrop-blur-[80px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-20 duration-1000 rounded-[2rem] sm:rounded-[4rem]">
            <div className="absolute top-0 left-0 w-full h-[6px] sm:h-[8px] bg-gradient-to-r from-cyan-500 via-primary to-emerald-600" />
            <CardHeader className="pb-8 sm:pb-12 pt-10 sm:pt-20 px-6 sm:px-16">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-12">
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 text-center sm:text-left">
                        <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-[1rem] sm:rounded-[2.5rem] bg-primary/20 flex items-center justify-center border-2 border-primary/30 shadow-[0_0_60px_rgba(var(--primary),0.4)] relative group">
                            <Activity className="h-8 w-8 sm:h-14 sm:w-14 text-primary drop-shadow-[0_0_25px_rgba(var(--primary),1)] animate-pulse" />
                            <div className="absolute -inset-4 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none">DIGIT {digit} INTEL</CardTitle>
                            <CardDescription className="text-primary/70 font-black uppercase tracking-[0.4em] sm:tracking-[0.8em] text-[10px] sm:text-[16px] mt-3 sm:mt-6">Precision Volumetric Matrix</CardDescription>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-8 sm:px-14 py-4 sm:py-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-center shadow-2xl group transition-all hover:bg-white/10 w-full sm:w-auto">
                        <p className="text-[8px] sm:text-[12px] font-black uppercase text-muted-foreground tracking-[0.3em] sm:tracking-[0.5em] mb-2 sm:mb-3 group-hover:text-primary transition-colors">STABILITY INDEX</p>
                        <p className="text-xl sm:text-4xl font-black text-emerald-400 tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]">ULTRA PRECISION</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-16 pb-10 sm:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16">
                <div className="space-y-8 sm:space-y-12 p-8 sm:p-14 rounded-[1.5rem] sm:rounded-[3.5rem] bg-black/50 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-6 sm:pb-10">
                        <h4 className="text-[12px] sm:text-[16px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-muted-foreground flex items-center gap-4 sm:gap-6">
                            <Hash className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-400" /> ACCURACY GATE
                        </h4>
                        <span className="text-3xl sm:text-6xl font-black text-emerald-400 tabular-nums">{stats.actualFreq.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-8 sm:space-y-12">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex justify-between text-[8px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-emerald-300">
                                <span>MATCHES FLOW</span>
                                <span>{stats.matches} TICKS</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-6 sm:h-8 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex justify-between text-[8px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-rose-300">
                                <span>VARIANCE RATIO</span>
                                <span>{stats.differs} TICKS</span>
                            </div>
                            <Progress value={100 - (stats.actualFreq * 4)} className="h-6 sm:h-8 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-rose-600 [&>div]:to-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.5)]" />
                        </div>
                    </div>
                </div>

                <div className="space-y-8 sm:space-y-12 p-8 sm:p-14 rounded-[1.5rem] sm:rounded-[3.5rem] bg-black/50 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-2 h-full bg-cyan-500/40 group-hover:bg-cyan-500 transition-colors" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-6 sm:pb-10">
                        <h4 className="text-[12px] sm:text-[16px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-muted-foreground flex items-center gap-4 sm:gap-6">
                            <BarChartHorizontal className="h-5 w-5 sm:h-8 sm:w-8 text-cyan-400" /> BARRIER SYMMETRY
                        </h4>
                        <span className="text-3xl sm:text-6xl font-black text-cyan-400 tabular-nums">{stats.over.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-8 sm:space-y-12">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex justify-between text-[8px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-cyan-300">
                                <span>OVER {digit} WEIGHT</span>
                                <span>{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-6 sm:h-8 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-cyan-600 [&>div]:to-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.5)]" />
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex justify-between text-[8px] sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-orange-300">
                                <span>UNDER {digit} WEIGHT</span>
                                <span>{stats.under.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.under} className="h-6 sm:h-8 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.5)]" />
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
        <div className="space-y-10 sm:space-y-20 animate-in fade-in slide-in-from-bottom-20 duration-1000 pb-40">
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-[80px] overflow-hidden relative rounded-[2rem] sm:rounded-[4rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-8 sm:p-20 grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-32 items-center">
                    <div className="space-y-4 sm:space-y-8">
                        <Label className="text-[10px] sm:text-[16px] font-black uppercase tracking-[0.4em] sm:tracking-[0.8em] text-primary ml-2 sm:ml-4">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-16 sm:h-24 bg-black/60 border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-sm sm:text-2xl shadow-[inset_0_2px_20px_rgba(0,0,0,0.7)] px-8 sm:px-12">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={10} className="w-[var(--radix-select-trigger-width)] max-h-[400px] sm:max-h-[500px] rounded-[1.5rem] sm:rounded-[2.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 px-6 font-black text-xs sm:text-lg transition-colors">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4 sm:space-y-8">
                        <Label className="text-[10px] sm:text-[16px] font-black uppercase tracking-[0.4em] sm:tracking-[0.8em] text-primary ml-2 sm:ml-4">NEXUS DATA HORIZON</Label>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-16 sm:h-24 bg-black/60 border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-2xl sm:text-5xl text-primary text-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.7)] relative z-10"
                            />
                            <div className="absolute right-8 sm:right-12 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-20"><Activity size={32} className="sm:w-12 sm:h-12" /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-8 sm:space-y-16">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-12 px-6 sm:px-12">
                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 text-center sm:text-left">
                        <div className="p-4 sm:p-6 bg-rose-500/25 rounded-[1.5rem] sm:rounded-[2.5rem] animate-pulse shadow-[0_0_60px_rgba(244,63,94,0.5)] border-2 border-rose-500/30">
                            <Flame className="h-8 w-8 sm:h-14 sm:w-14 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-4xl font-black uppercase tracking-[0.5em] sm:tracking-[1em] text-white">DIGIT HEAT MATRIX</h3>
                            <p className="text-[8px] sm:text-[14px] font-black uppercase tracking-[0.3em] sm:tracking-[0.6em] text-muted-foreground mt-2 sm:mt-4">Precision Volumetric HUD Flux</p>
                        </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-2 border-primary/40 px-6 sm:px-12 py-3 sm:py-5 font-black tracking-[0.3em] sm:tracking-[0.5em] uppercase text-[8px] sm:text-[14px] rounded-full shadow-[0_0_50px_rgba(var(--primary),0.3)]">
                        {lastDigitTicks.length} TICK STREAM ACTIVE
                    </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-14">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-16 mt-20 sm:mt-32">
                {marketDirectionAnalysis && (
                    <>
                        <div className="p-8 sm:p-14 rounded-[2.5rem] sm:rounded-[4.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-[80px] group hover:bg-slate-950 transition-all duration-1000 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-chart-1 to-transparent opacity-60" />
                            <h4 className="text-[12px] sm:text-[16px] font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] text-muted-foreground border-b border-white/5 pb-8 sm:pb-12 flex items-center gap-6 sm:gap-8">
                                <List className="h-6 w-6 sm:h-10 sm:w-10 text-chart-1" /> EVEN / ODD GATES
                            </h4>
                            <div className="space-y-10 sm:space-y-16 pt-8 sm:pt-12">
                                <div className="space-y-6 sm:space-y-8">
                                    <div className="flex justify-between text-[8px] sm:text-sm font-black uppercase tracking-[0.4em] sm:tracking-[0.6em]">
                                        <span className="text-chart-1">EVEN FLOW</span>
                                        <span className="text-white text-2xl sm:text-4xl tracking-tighter">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.even} className="h-6 sm:h-8 bg-black/60 [&>div]:bg-chart-1 shadow-[0_0_35px_rgba(var(--chart-1),0.7)]" />
                                </div>
                                <div className="space-y-6 sm:space-y-8">
                                    <div className="flex justify-between text-[8px] sm:text-sm font-black uppercase tracking-[0.4em] sm:tracking-[0.6em]">
                                        <span className="text-chart-3">ODD FLOW</span>
                                        <span className="text-white text-2xl sm:text-4xl tracking-tighter">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.odd} className="h-6 sm:h-8 bg-black/60 [&>div]:bg-chart-3 shadow-[0_0_35px_rgba(var(--chart-3),0.7)]" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 sm:p-14 rounded-[2.5rem] sm:rounded-[4.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-[80px] group hover:bg-slate-950 transition-all duration-1000 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-accent to-transparent opacity-60" />
                            <h4 className="text-[12px] sm:text-[16px] font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] text-muted-foreground border-b border-white/5 pb-8 sm:pb-12 flex items-center gap-6 sm:gap-8">
                                <BarChartHorizontal className="h-6 w-6 sm:h-10 sm:w-10 text-accent" /> BARRIER SYMMETRY
                            </h4>
                            <div className="space-y-10 sm:space-y-16 pt-8 sm:pt-12">
                                <div className="space-y-6 sm:space-y-8">
                                    <div className="flex justify-between text-[8px] sm:text-sm font-black uppercase tracking-[0.4em] sm:tracking-[0.6em]">
                                        <span className="text-accent">UNDER 5 WEIGHT</span>
                                        <span className="text-white text-2xl sm:text-4xl tracking-tighter">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.lower} className="h-6 sm:h-8 bg-black/60 [&>div]:bg-accent shadow-[0_0_35px_rgba(var(--accent),0.7)]" />
                                </div>
                                <div className="space-y-6 sm:space-y-8">
                                    <div className="flex justify-between text-[8px] sm:text-sm font-black uppercase tracking-[0.4em] sm:tracking-[0.6em]">
                                        <span className="text-rose-500">OVER 4 WEIGHT</span>
                                        <span className="text-white text-2xl sm:text-4xl tracking-tighter">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.higher} className="h-6 sm:h-8 bg-black/60 [&>div]:bg-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.7)]" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 sm:p-14 rounded-[2.5rem] sm:rounded-[4.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-[80px] group hover:bg-slate-950 transition-all duration-1000 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-cyan-400 to-transparent opacity-60" />
                            <h4 className="text-[12px] sm:text-[16px] font-black uppercase tracking-[0.5em] sm:tracking-[0.8em] text-muted-foreground border-b border-white/5 pb-8 sm:pb-12 flex items-center gap-6 sm:gap-8">
                                <Zap className="h-6 w-6 sm:h-10 sm:w-10 text-cyan-400" /> REAL-TIME PIVOT
                            </h4>
                            <div className="flex flex-col items-center justify-center pt-8 sm:pt-12 flex-1">
                                <div className="relative group/price">
                                    <div className="absolute -inset-10 sm:-inset-20 bg-primary/30 blur-[60px] sm:blur-[100px] rounded-full opacity-60 group-hover/price:opacity-100 transition-opacity animate-pulse" />
                                    <p className="text-[10px] sm:text-[16px] font-black uppercase text-primary tracking-[0.5em] sm:tracking-[1em] mb-6 sm:mb-10 text-center">TECHNICAL HUD FLUX</p>
                                    <p className="text-4xl sm:text-6xl md:text-9xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(var(--primary),1)] relative">
                                        {price.toFixed(decimalPlaces)}
                                    </p>
                                </div>
                                <div className="mt-12 sm:mt-20 flex gap-6 sm:gap-12 w-full">
                                    <div className="flex-1 text-center bg-emerald-500/20 border-2 border-emerald-500/40 py-6 sm:py-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-2xl group/bull transition-all hover:bg-emerald-500/30">
                                        <p className="text-[10px] sm:text-[14px] font-black uppercase text-emerald-400 tracking-[0.3em] sm:tracking-[0.5em] mb-2 sm:mb-4 group-hover/bull:animate-bounce">BULLISH</p>
                                        <p className="text-xl sm:text-4xl font-black text-white">{marketDirectionAnalysis.overUnder.higher.toFixed(0)}%</p>
                                    </div>
                                    <div className="flex-1 text-center bg-rose-500/20 border-2 border-rose-500/40 py-6 sm:py-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-2xl group/bear transition-all hover:bg-rose-500/30">
                                        <p className="text-[10px] sm:text-[14px] font-black uppercase text-rose-400 tracking-[0.3em] sm:tracking-[0.5em] mb-2 sm:mb-4 group-hover/bear:animate-bounce">BEARISH</p>
                                        <p className="text-xl sm:text-4xl font-black text-white">{marketDirectionAnalysis.overUnder.lower.toFixed(0)}%</p>
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
