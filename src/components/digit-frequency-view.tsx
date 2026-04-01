
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
import { Target, Zap, List, Hash, Activity, Flame, Timer, BarChartHorizontal, Sparkles, TrendingUp, TrendingDown, Gauge } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

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

const DigitHeatCard = ({ digit, ticks, isSelected, isLatest, onSelect }: { 
    digit: number, 
    ticks: number[], 
    isSelected: boolean, 
    isLatest: boolean,
    onSelect: (d: number) => void 
}) => {
    const stats = React.useMemo(() => {
        const total = ticks.length || 1;
        const matches = ticks.filter(t => t === digit).length;
        const freq = (matches / total) * 100;
        
        // Z-Score Calculation (Feature 2)
        const mean = total / 10;
        const variance = total * 0.1 * 0.9;
        const stdDev = Math.sqrt(variance);
        const zScore = (matches - mean) / (stdDev || 1);

        let tsl = 0;
        for (let i = 0; i < ticks.length; i++) {
            if (ticks[i] === digit) break;
            tsl++;
        }

        let colorClass = "text-muted-foreground";
        let glowClass = "";
        let bgClass = "bg-white/5";
        let rating = "STABLE";

        if (zScore > 2) {
            colorClass = "text-rose-500";
            glowClass = "shadow-[0_0_15px_rgba(244,63,94,0.1)] border-rose-500/20";
            bgClass = "bg-rose-500/10";
            rating = "OVER-SATURATED";
        } else if (zScore < -2) {
            colorClass = "text-cyan-500";
            glowClass = "shadow-[0_0_15px_rgba(6,182,212,0.1)] border-cyan-500/20";
            bgClass = "bg-cyan-500/10";
            rating = "STATISTICALLY DUE";
        } else if (freq > 11.5) {
            colorClass = "text-orange-500";
            glowClass = "shadow-[0_0_10px_rgba(249,115,22,0.1)] border-orange-500/10";
            bgClass = "bg-orange-500/5";
            rating = "TRENDING";
        }

        return { freq, tsl, colorClass, glowClass, bgClass, rating, zScore };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-300 rounded-xl sm:rounded-3xl border p-2 sm:p-4 flex flex-col justify-between h-24 sm:h-48 overflow-hidden backdrop-blur-xl",
                stats.bgClass,
                stats.glowClass || "border-white/5",
                isSelected ? "ring-2 ring-primary scale-105 z-20 shadow-lg bg-primary/10" : "hover:scale-[1.02]"
            )}
        >
            {isLatest && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-cyan-400/50 rounded-[inherit]" />
                </div>
            )}

            <div className="absolute top-0 right-0 p-1 sm:p-2 opacity-10 sm:opacity-20">
                <Hash className={cn("w-6 h-6 sm:w-16 sm:h-16", stats.colorClass)} />
            </div>

            <div className="flex justify-between items-start relative z-10">
                <span className={cn(
                    "text-xl sm:text-5xl font-black tracking-tighter transition-all",
                    isSelected ? "text-white" : stats.colorClass
                )}>
                    {digit}
                </span>
                <div className="text-right">
                    <Badge className={cn(
                        "text-[5px] sm:text-[8px] font-black tracking-widest px-1 sm:px-2 py-0 border-none",
                        stats.colorClass.replace('text-', 'bg-') + "/20",
                        stats.colorClass
                    )}>
                        {stats.rating}
                    </Badge>
                    <p className={cn("text-[9px] sm:text-xl font-black tabular-nums tracking-tighter mt-1", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <p className="text-[6px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">GAP</p>
                    <p className="text-sm sm:text-3xl font-black text-foreground tabular-nums tracking-tighter leading-none mt-0.5">
                        {stats.tsl}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[6px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Z-SCORE</p>
                    <p className={cn("text-[8px] sm:text-xs font-black", Math.abs(stats.zScore) > 2 ? stats.colorClass : "text-white/20")}>
                        {stats.zScore.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 overflow-hidden">
                <div 
                    className={cn("h-full transition-all duration-700", stats.colorClass.replace('text-', 'bg-'))} 
                    style={{ width: `${Math.min(stats.freq * 6, 100)}%` }} 
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
        <Card className="mt-6 border-none bg-slate-950/90 backdrop-blur-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700 rounded-[1.5rem] sm:rounded-[2.5rem]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-primary to-emerald-600" />
            <CardHeader className="pb-4 pt-6 sm:pt-8 px-5 sm:px-8">
                <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-10 h-10 sm:w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">DIGIT {digit} INTEL</CardTitle>
                        <CardDescription className="text-primary/70 font-black uppercase tracking-widest text-[7px] sm:text-[9px] mt-1">Precision Volumetric Matrix</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-5 sm:px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="p-4 sm:p-6 rounded-xl bg-black/50 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Hash className="h-4 w-4 text-emerald-400" /> ACCURACY GATE
                        </h4>
                        <span className="text-base sm:text-2xl font-black text-emerald-400 tabular-nums">{stats.actualFreq.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                <span className="text-emerald-300">MATCHES</span>
                                <span>{stats.matches} TICKS</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-1.5 sm:h-2 bg-black/60 [&>div]:bg-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6 rounded-xl bg-black/50 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <BarChartHorizontal className="h-4 w-4 text-cyan-400" /> BARRIER SYMMETRY
                        </h4>
                        <span className="text-base sm:text-2xl font-black text-cyan-400 tabular-nums">{stats.over.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                <span className="text-cyan-300">OVER {digit} WEIGHT</span>
                                <span>{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-1.5 sm:h-2 bg-black/60 [&>div]:bg-cyan-500" />
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

    const latestDigit = lastDigitTicks.length > 0 ? lastDigitTicks[0] : null;

    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks;
        if (ticks.length < 2) return null;

        const total = ticks.length;
        const evenCount = ticks.filter(d => d % 2 === 0).length;
        const evenPercentage = (evenCount / total) * 100;
        const oddPercentage = 100 - evenPercentage;
        
        const lowerCount = ticks.filter(d => d <= 4).length;
        const lowerPercentage = (lowerCount / total) * 100;
        const higherPercentage = 100 - lowerPercentage;
        
        return {
            evenOdd: { even: evenPercentage, odd: oddPercentage },
            overUnder: { lower: lowerPercentage, higher: higherPercentage }
        };
    }, [lastDigitTicks]);

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24">
            <Card className="border-none shadow-xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[1.5rem] sm:rounded-[2.5rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center">
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-12 sm:h-16 bg-black/60 border-white/10 rounded-xl sm:rounded-[1.5rem] font-black text-xs sm:text-base px-4">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-xl sm:rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-2.5 px-4 font-black text-xs sm:text-sm">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">DATA HORIZON</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-12 sm:h-16 bg-black/60 border-white/10 rounded-xl sm:rounded-[1.5rem] font-black text-lg sm:text-2xl text-primary text-center shadow-inner"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                    <div className="p-2 sm:p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                        <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-xl font-black uppercase tracking-widest text-foreground">STATISTICAL Z-CORE MATRIX</h3>
                        <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Statistical Edge & Deviation Analysis</p>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 sm:gap-4 px-1">
                    {Array.from({ length: 10 }, (_, i) => (
                        <DigitHeatCard 
                            key={i} 
                            digit={i} 
                            ticks={lastDigitTicks} 
                            isSelected={selectedDigit === i} 
                            isLatest={latestDigit === i}
                            onSelect={setSelectedDigit} 
                        />
                    ))}
                </div>
            </div>

            {selectedDigit !== null && (
                <DigitDetailInsights digit={selectedDigit} ticks={lastDigitTicks} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mt-6">
                {marketDirectionAnalysis && (
                    <>
                        <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-3xl shadow-xl relative overflow-hidden">
                            <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                                <List className="h-4 w-4 text-chart-1" /> EVEN / ODD GATES
                            </h4>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-chart-1">EVEN</span>
                                        <span className="text-foreground text-xs sm:text-base tabular-nums">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.even} className="h-1.5 sm:h-2.5 bg-black/60 [&>div]:bg-chart-1" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-chart-3">ODD</span>
                                        <span className="text-foreground text-xs sm:text-base tabular-nums">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.odd} className="h-1.5 sm:h-2.5 bg-black/60 [&>div]:bg-chart-3" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-3xl shadow-xl relative overflow-hidden">
                            <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
                                <BarChartHorizontal className="h-4 w-4 text-accent" /> BARRIER SYMMETRY
                            </h4>
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-accent">UNDER 5</span>
                                        <span className="text-foreground text-xs sm:text-base tabular-nums">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.lower} className="h-1.5 sm:h-2.5 bg-black/60 [&>div]:bg-accent" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-rose-500">OVER 4</span>
                                        <span className="text-foreground text-xs sm:text-base tabular-nums">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.higher} className="h-1.5 sm:h-2.5 bg-black/60 [&>div]:bg-rose-500" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-3xl shadow-xl flex flex-col justify-center text-center">
                            <p className="text-[8px] sm:text-[10px] font-black uppercase text-primary tracking-widest mb-2">TECHNICAL HUD FLUX</p>
                            <p className="text-lg sm:text-3xl font-black text-foreground tabular-nums tracking-tighter leading-none mb-4">
                                {price.toFixed(decimalPlaces)}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl">
                                    <p className="text-[6px] sm:text-[8px] font-black text-emerald-400 uppercase tracking-widest">BULLISH</p>
                                    <p className="text-xs sm:text-lg font-black text-foreground">{marketDirectionAnalysis.overUnder.higher.toFixed(0)}%</p>
                                </div>
                                <div className="bg-rose-500/10 border border-rose-500/20 py-2 rounded-xl">
                                    <p className="text-[6px] sm:text-[8px] font-black text-rose-400 uppercase tracking-widest">BEARISH</p>
                                    <p className="text-xs sm:text-lg font-black text-foreground">{marketDirectionAnalysis.overUnder.lower.toFixed(0)}%</p>
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
