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
import { Target, Zap, TrendingUp, TrendingDown, Info, List, Hash, ShieldCheck, Activity, BarChart3, Flame, Timer, BarChartHorizontal } from 'lucide-react';
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

        // Calculate "Heat" color based on frequency deviation from 10%
        let colorClass = "text-muted-foreground";
        let glowClass = "shadow-none";
        let bgClass = "bg-white/5";

        if (freq > 13) {
            colorClass = "text-rose-400";
            glowClass = "shadow-[0_0_15px_rgba(244,63,94,0.3)]";
            bgClass = "bg-rose-500/10";
        } else if (freq > 11) {
            colorClass = "text-orange-400";
            bgClass = "bg-orange-500/10";
        } else if (freq < 7) {
            colorClass = "text-cyan-400";
            bgClass = "bg-cyan-500/10";
        }

        return { freq, tsl, colorClass, glowClass, bgClass };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-300 rounded-2xl border p-4 flex flex-col justify-between h-32 sm:h-40 overflow-hidden",
                stats.bgClass,
                isSelected ? "border-primary ring-2 ring-primary/40 scale-105 z-20 shadow-2xl" : "border-white/5 hover:border-white/20",
                stats.glowClass
            )}
        >
            <div className="flex justify-between items-start">
                <span className={cn("text-3xl sm:text-5xl font-black tracking-tighter", isSelected ? "text-primary" : "text-white")}>
                    {digit}
                </span>
                <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Freq</p>
                    <p className={cn("text-sm sm:text-lg font-black tabular-nums", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-1.5 opacity-60">
                    <Timer className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">TSL GAP</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-white tabular-nums">{stats.tsl}</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">TICKS</span>
                </div>
            </div>

            {/* Heat Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40">
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
        <Card className="mt-6 border-none bg-slate-950/60 backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-cyan-400 to-primary" />
            <CardHeader className="pb-4 pt-8 text-center sm:text-left px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                            <Target className="h-7 w-7 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black text-white tracking-tight uppercase">DIGIT {digit} PROTOCOL</CardTitle>
                            <CardDescription className="text-primary/60 font-black uppercase tracking-[0.3em] text-[10px]">Strategic Flow Analysis</CardDescription>
                        </div>
                    </div>
                    <Badge className="h-8 px-4 bg-primary/20 text-primary border-primary/30 font-black text-[10px] tracking-widest">
                        LIVE ACCURACY: {stats.actualFreq.toFixed(1)}%
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all duration-300">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Zap className="h-4 w-4 text-emerald-400" /> Accuracy Matrix
                        </h4>
                        <span className="text-2xl font-black text-emerald-400 tabular-nums">{stats.actualFreq.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-emerald-300">
                                <span>Matches Potential</span>
                                <span>{stats.matches}</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-3 bg-black/40 [&>div]:bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-rose-300">
                                <span>Differs Safety</span>
                                <span>{stats.differs}</span>
                            </div>
                            <Progress value={100 - (stats.actualFreq * 4)} className="h-3 bg-black/40 [&>div]:bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all duration-300">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Target className="h-4 w-4 text-cyan-400" /> Relative Barrier Skew
                        </h4>
                        <span className="text-2xl font-black text-cyan-400 tabular-nums">{stats.over.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-cyan-300">
                                <span>Over {digit} Weight</span>
                                <span>{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-3 bg-black/40 [&>div]:bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-orange-300">
                                <span>Under {digit} Weight</span>
                                <span>{stats.under.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.under} className="h-3 bg-black/40 [&>div]:bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.3)]" />
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">Market Configuration</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-12 bg-background/40 border-white/5 rounded-xl font-bold">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-white/10">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id}>
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">(TICKS)</Label>
                        <Input
                            type="number"
                            min="1"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                            className="h-12 bg-background/40 border-white/5 rounded-xl font-black text-lg text-primary text-center"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                        <Flame className="h-4 w-4 animate-pulse" /> Digit Heat Matrix
                    </h3>
                    <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase border-white/10 opacity-60">
                        {lastDigitTicks.length} Sample Window
                    </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
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

            <Card className="border-none shadow-2xl bg-slate-950/80 backdrop-blur-xl overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-primary to-cyan-400" />
                 <CardContent className="p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-12">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
                            <Zap className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        </div>
                        <div className="truncate">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Technical HUD Pivot</p>
                            <p className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter tabular-nums truncate">
                                {price.toFixed(decimalPlaces)}
                            </p>
                        </div>
                    </div>
                    
                    {marketDirectionAnalysis && (
                        <div className="flex gap-10 sm:gap-16 text-center bg-white/5 px-8 sm:px-12 py-5 sm:py-6 rounded-3xl border border-white/5 w-full md:w-auto">
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 truncate">Bullish Bias</p>
                                <p className="text-2xl sm:text-4xl font-black text-emerald-400 tabular-nums">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</p>
                            </div>
                            <div className="w-[1px] h-12 bg-white/10 shrink-0" />
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 truncate">Bearish Bias</p>
                                <p className="text-2xl sm:text-4xl font-black text-rose-500 tabular-nums">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {!marketDirectionAnalysis ? (
                    <div className="col-span-3 text-center py-12">
                        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronizing Logic Stream...</p>
                    </div>
                ) : (
                    <>
                        {/* Logic Gate 1: Even/Odd */}
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-3 flex items-center gap-2">
                                <List className="h-4 w-4 text-chart-1" /> Even / Odd Logic
                            </h4>
                            <div className="space-y-5 pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-chart-1">Even Flow</span>
                                        <span className="text-white">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.even} className="h-3 bg-black/40 [&>div]:bg-chart-1 shadow-[0_0_8px_rgba(var(--chart-1),0.4)]" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-chart-3">Odd Flow</span>
                                        <span className="text-white">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.odd} className="h-3 bg-black/40 [&>div]:bg-chart-3 shadow-[0_0_8px_rgba(var(--chart-3),0.4)]" />
                                </div>
                            </div>
                        </div>

                        {/* Logic Gate 2: Over/Under */}
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-3 flex items-center gap-2">
                                <BarChartHorizontal className="h-4 w-4 text-accent" /> Barrier Symmetery
                            </h4>
                            <div className="space-y-5 pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-accent">Under 5</span>
                                        <span className="text-white">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.lower} className="h-3 bg-black/40 [&>div]:bg-accent shadow-[0_0_8px_rgba(var(--accent),0.4)]" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-rose-500">Over 4</span>
                                        <span className="text-white">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.higher} className="h-3 bg-black/40 [&>div]:bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                </div>
                            </div>
                        </div>

                        {/* Logic Gate 3: Match/Differ */}
                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-3 flex items-center gap-2">
                                <Hash className="h-4 w-4 text-chart-2" /> Match / Differ Peak
                            </h4>
                            <div className="space-y-5 pt-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-chart-2">Digit {marketDirectionAnalysis.matchesDiffers.hottest} Peak</span>
                                        <span className="text-white">{marketDirectionAnalysis.matchesDiffers.matches.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.matchesDiffers.matches * 4} className="h-3 bg-black/40 [&>div]:bg-chart-2 shadow-[0_0_8px_rgba(var(--chart-2),0.4)]" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <span>Variance Flow</span>
                                        <span>{marketDirectionAnalysis.matchesDiffers.differs.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={100 - (marketDirectionAnalysis.matchesDiffers.matches * 4)} className="h-3 bg-black/40 [&>div]:bg-white/10" />
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
