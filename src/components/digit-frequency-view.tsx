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
import { Target, Zap, List, Hash, Activity, Flame, Timer, BarChartHorizontal, Sparkles } from 'lucide-react';
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
        let rating = "STABLE";

        if (freq > 13) {
            colorClass = "text-rose-400";
            glowClass = "shadow-[0_0_25px_rgba(244,63,94,0.4)]";
            bgClass = "bg-rose-500/15";
            borderClass = "border-rose-500/30";
            rating = "VOLATILE";
        } else if (freq > 11) {
            colorClass = "text-orange-400";
            bgClass = "bg-orange-500/10";
            borderClass = "border-orange-500/20";
            rating = "TRENDING";
        } else if (freq < 7) {
            colorClass = "text-cyan-400";
            bgClass = "bg-cyan-500/10";
            borderClass = "border-cyan-500/20";
            rating = "COLD";
        }

        return { freq, tsl, colorClass, glowClass, bgClass, borderClass, rating };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-500 rounded-[2rem] border p-5 flex flex-col justify-between h-40 sm:h-52 overflow-hidden backdrop-blur-md",
                stats.bgClass,
                stats.borderClass,
                isSelected ? "ring-2 ring-primary scale-105 z-20 shadow-[0_0_40px_rgba(var(--primary),0.3)] bg-primary/25" : "hover:scale-[1.03] hover:bg-white/10",
                stats.glowClass
            )}
        >
            <div className="flex justify-between items-start">
                <div className="relative">
                    <span className={cn("text-5xl sm:text-7xl font-black tracking-tighter leading-none select-none", isSelected ? "text-primary" : "text-white")}>
                        {digit}
                    </span>
                    {isSelected && (
                        <Sparkles className="absolute -top-2 -right-6 h-4 w-4 text-primary animate-pulse" />
                    )}
                </div>
                <div className="text-right">
                    <Badge variant="outline" className={cn("text-[8px] font-black tracking-[0.2em] mb-2 bg-black/40 border-none", stats.colorClass)}>
                        {stats.rating}
                    </Badge>
                    <p className={cn("text-xl sm:text-3xl font-black tabular-nums tracking-tighter", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center gap-1.5 opacity-40">
                    <Timer className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em]">TSL GAP</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-5xl font-black text-white tabular-nums drop-shadow-[0_4px_12px_rgba(255,255,255,0.25)]">
                        {stats.tsl}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">TICKS</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-2 bg-black/60">
                <div 
                    className={cn("h-full transition-all duration-1000 ease-out shadow-[0_0_10px]", stats.colorClass.replace('text-', 'bg-'))} 
                    style={{ 
                        width: `${Math.min(stats.freq * 5, 100)}%`,
                        boxShadow: `0 0 10px ${stats.colorClass.includes('rose') ? 'rgba(244,63,94,0.5)' : stats.colorClass.includes('cyan') ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.2)'}`
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
        <Card className="mt-8 border-none bg-slate-950/90 backdrop-blur-[40px] shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-cyan-400 via-primary to-purple-500" />
            <CardHeader className="pb-8 pt-12 px-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center border border-primary/25 shadow-[0_0_30px_rgba(var(--primary),0.25)] relative group">
                            <Activity className="h-10 w-10 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-pulse" />
                            <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
                        </div>
                        <div className="text-center sm:text-left">
                            <CardTitle className="text-4xl font-black text-white tracking-tighter uppercase leading-none">DIGIT {digit} INTEL</CardTitle>
                            <CardDescription className="text-primary/70 font-black uppercase tracking-[0.5em] text-[12px] mt-2">Precision Volumetric HUD</CardDescription>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/15 px-8 py-4 rounded-3xl text-center shadow-inner group">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mb-1 group-hover:text-primary transition-colors">STABILITY INDEX</p>
                        <p className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">ULTRA PRECISION</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-10 p-10 rounded-[2.5rem] bg-white/5 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-4">
                            <Hash className="h-5 w-5 text-emerald-400" /> ACCURACY GATE
                        </h4>
                        <span className="text-4xl font-black text-emerald-400 tabular-nums">{stats.actualFreq.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-black uppercase tracking-[0.25em] text-emerald-300">
                                <span>MATCHES FLOW</span>
                                <span>{stats.matches} TICKS</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-5 bg-black/40 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-black uppercase tracking-[0.25em] text-rose-300">
                                <span>VARIANCE RATIO</span>
                                <span>{stats.differs} TICKS</span>
                            </div>
                            <Progress value={100 - (stats.actualFreq * 4)} className="h-5 bg-black/40 [&>div]:bg-gradient-to-r [&>div]:from-rose-600 [&>div]:to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]" />
                        </div>
                    </div>
                </div>

                <div className="space-y-10 p-10 rounded-[2.5rem] bg-white/5 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1 h-full bg-cyan-500/20 group-hover:bg-cyan-500/50 transition-colors" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-4">
                            <BarChartHorizontal className="h-5 w-5 text-cyan-400" /> BARRIER SYMMETRY
                        </h4>
                        <span className="text-4xl font-black text-cyan-400 tabular-nums">{stats.over.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                                <span>OVER {digit} WEIGHT</span>
                                <span>{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-5 bg-black/40 [&>div]:bg-gradient-to-r [&>div]:from-cyan-600 [&>div]:to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-black uppercase tracking-[0.25em] text-orange-300">
                                <span>UNDER {digit} WEIGHT</span>
                                <span>{stats.under.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.under} className="h-5 bg-black/40 [&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-24">
            <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-slate-900/40 backdrop-blur-[50px] overflow-hidden relative rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-20 items-center">
                    <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-16 bg-black/40 border-white/10 rounded-[1.5rem] font-black text-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] px-8">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={4} className="rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100]">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">DATA HORIZON (TICKS)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-16 bg-black/40 border-white/10 rounded-[1.5rem] font-black text-3xl text-primary text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] focus:ring-primary/50 transition-all"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Activity size={24} /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-6">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-rose-500/20 rounded-2xl animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                            <Flame className="h-8 w-8 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-[0.6em] text-white">DIGIT HEAT MATRIX</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-1">Real-Time Probability HUD</p>
                        </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30 px-6 py-2.5 font-black tracking-[0.3em] uppercase text-[11px] rounded-full shadow-lg">
                        {lastDigitTicks.length} TICK STREAM ACTIVE
                    </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16">
                {marketDirectionAnalysis && (
                    <>
                        <div className="p-10 rounded-[3rem] bg-slate-950/70 border border-white/10 backdrop-blur-3xl group hover:bg-slate-950/90 transition-all duration-700 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-chart-1 to-transparent opacity-30" />
                            <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-muted-foreground border-b border-white/5 pb-8 flex items-center gap-4">
                                <List className="h-6 w-6 text-chart-1" /> EVEN / ODD GATES
                            </h4>
                            <div className="space-y-10 pt-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em]">
                                        <span className="text-chart-1">EVEN FLOW</span>
                                        <span className="text-white text-2xl tracking-tighter">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.even} className="h-5 bg-black/40 [&>div]:bg-chart-1 shadow-[0_0_15px_rgba(var(--chart-1),0.5)]" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em]">
                                        <span className="text-chart-3">ODD FLOW</span>
                                        <span className="text-white text-2xl tracking-tighter">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.odd} className="h-5 bg-black/40 [&>div]:bg-chart-3 shadow-[0_0_15px_rgba(var(--chart-3),0.5)]" />
                                </div>
                            </div>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-slate-950/70 border border-white/10 backdrop-blur-3xl group hover:bg-slate-950/90 transition-all duration-700 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent to-transparent opacity-30" />
                            <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-muted-foreground border-b border-white/5 pb-8 flex items-center gap-4">
                                <BarChartHorizontal className="h-6 w-6 text-accent" /> BARRIER SYMMETRY
                            </h4>
                            <div className="space-y-10 pt-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em]">
                                        <span className="text-accent">UNDER 5 WEIGHT</span>
                                        <span className="text-white text-2xl tracking-tighter">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.lower} className="h-5 bg-black/40 [&>div]:bg-accent shadow-[0_0_15px_rgba(var(--accent),0.5)]" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em]">
                                        <span className="text-rose-500">OVER 4 WEIGHT</span>
                                        <span className="text-white text-2xl tracking-tighter">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.higher} className="h-5 bg-black/40 [&>div]:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                                </div>
                            </div>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-slate-950/70 border border-white/10 backdrop-blur-3xl group hover:bg-slate-950/90 transition-all duration-700 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 to-transparent opacity-30" />
                            <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-muted-foreground border-b border-white/5 pb-8 flex items-center gap-4">
                                <Zap className="h-6 w-6 text-cyan-400" /> REAL-TIME PIVOT
                            </h4>
                            <div className="flex flex-col items-center justify-center pt-8 flex-1">
                                <div className="relative group/price">
                                    <div className="absolute -inset-8 bg-primary/20 blur-[40px] rounded-full opacity-50 group-hover/price:opacity-100 transition-opacity animate-pulse" />
                                    <p className="text-[12px] font-black uppercase text-primary tracking-[0.4em] mb-4 text-center">TECHNICAL HUD FLUX</p>
                                    <p className="text-6xl sm:text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(var(--primary),0.8)] relative">
                                        {price.toFixed(decimalPlaces)}
                                    </p>
                                </div>
                                <div className="mt-12 flex gap-6 w-full">
                                    <div className="flex-1 text-center bg-emerald-500/15 border border-emerald-500/30 py-4 rounded-3xl shadow-lg group/bull">
                                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1 group-hover/bull:animate-bounce">BULLISH</p>
                                        <p className="text-2xl font-black text-white">{marketDirectionAnalysis.overUnder.higher.toFixed(0)}%</p>
                                    </div>
                                    <div className="flex-1 text-center bg-rose-500/15 border border-rose-500/30 py-4 rounded-3xl shadow-lg group/bear">
                                        <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-1 group-hover/bear:animate-bounce">BEARISH</p>
                                        <p className="text-2xl font-black text-white">{marketDirectionAnalysis.overUnder.lower.toFixed(0)}%</p>
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
