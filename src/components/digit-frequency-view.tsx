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

        return { freq, tsl, colorClass, glowClass, bgClass, borderClass, rating };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-500 rounded-[2.5rem] border p-6 flex flex-col justify-between h-48 sm:h-64 overflow-hidden backdrop-blur-xl",
                stats.bgClass,
                stats.glowClass || stats.borderClass,
                isSelected ? "ring-4 ring-primary scale-105 z-20 shadow-[0_0_60px_rgba(var(--primary),0.4)] bg-primary/20" : "hover:scale-[1.05] hover:bg-white/10"
            )}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <Hash size={80} className={stats.colorClass} />
            </div>

            <div className="flex justify-between items-start relative z-10">
                <div className="relative">
                    <span className={cn(
                        "text-7xl sm:text-9xl font-black tracking-tighter leading-none select-none drop-shadow-2xl transition-all duration-500",
                        isSelected ? "text-white scale-110" : stats.colorClass
                    )}>
                        {digit}
                    </span>
                    {isSelected && (
                        <Sparkles className="absolute -top-4 -right-8 h-6 w-6 text-primary animate-pulse" />
                    )}
                </div>
                <div className="text-right">
                    <Badge className={cn(
                        "text-[10px] font-black tracking-[0.3em] mb-3 px-4 py-1 border-none shadow-lg",
                        stats.colorClass.replace('text-', 'bg-').replace('400', '500').replace('500', '600') + "/20",
                        stats.colorClass
                    )}>
                        {stats.rating}
                    </Badge>
                    <p className={cn("text-2xl sm:text-4xl font-black tabular-nums tracking-tighter drop-shadow-md", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2 opacity-50">
                    <Timer className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">TSL GAP CYCLE</span>
                </div>
                <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-6xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        {stats.tsl}
                    </span>
                    <span className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-60">TICKS</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-2.5 bg-black/60">
                <div 
                    className={cn("h-full transition-all duration-1000 ease-out shadow-[0_0_20px]", stats.colorClass.replace('text-', 'bg-'))} 
                    style={{ 
                        width: `${Math.min(stats.freq * 5, 100)}%`,
                        boxShadow: `0 0 20px ${stats.colorClass.includes('rose') ? 'rgba(244,63,94,0.6)' : stats.colorClass.includes('cyan') ? 'rgba(6,182,212,0.6)' : 'rgba(255,255,255,0.3)'}`
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
        <Card className="mt-12 border-none bg-slate-950/90 backdrop-blur-[60px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 rounded-[3rem]">
            <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-cyan-500 via-primary to-purple-600" />
            <CardHeader className="pb-10 pt-16 px-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-10">
                        <div className="w-24 h-24 rounded-[2rem] bg-primary/20 flex items-center justify-center border-2 border-primary/30 shadow-[0_0_40px_rgba(var(--primary),0.3)] relative group">
                            <Activity className="h-12 w-12 text-primary drop-shadow-[0_0_20px_rgba(var(--primary),1)] animate-pulse" />
                            <div className="absolute -inset-2 bg-primary/30 blur-2xl opacity-0 group-hover:opacity-60 transition-opacity" />
                        </div>
                        <div className="text-center sm:text-left">
                            <CardTitle className="text-5xl font-black text-white tracking-tighter uppercase leading-none">DIGIT {digit} INTEL</CardTitle>
                            <CardDescription className="text-primary/80 font-black uppercase tracking-[0.6em] text-[14px] mt-4">Precision Volumetric Matrix</CardDescription>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-10 py-6 rounded-[2rem] text-center shadow-inner group transition-all hover:bg-white/10">
                        <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em] mb-2 group-hover:text-primary transition-colors">STABILITY INDEX</p>
                        <p className="text-3xl font-black text-emerald-400 tabular-nums tracking-tighter drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">HIGH PRECISION</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-12 p-12 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-8">
                        <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-muted-foreground flex items-center gap-5">
                            <Hash className="h-6 w-6 text-emerald-400" /> ACCURACY GATE
                        </h4>
                        <span className="text-5xl font-black text-emerald-400 tabular-nums">{stats.actualFreq.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-10">
                        <div className="space-y-5">
                            <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
                                <span>MATCHES FLOW</span>
                                <span>{stats.matches} TICKS</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-6 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
                        </div>
                        <div className="space-y-5">
                            <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em] text-rose-300">
                                <span>VARIANCE RATIO</span>
                                <span>{stats.differs} TICKS</span>
                            </div>
                            <Progress value={100 - (stats.actualFreq * 4)} className="h-6 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-rose-600 [&>div]:to-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.5)]" />
                        </div>
                    </div>
                </div>

                <div className="space-y-12 p-12 rounded-[3rem] bg-black/40 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-500/40 group-hover:bg-cyan-500 transition-colors" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-8">
                        <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-muted-foreground flex items-center gap-5">
                            <BarChartHorizontal className="h-6 w-6 text-cyan-400" /> BARRIER SYMMETRY
                        </h4>
                        <span className="text-5xl font-black text-cyan-400 tabular-nums">{stats.over.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-10">
                        <div className="space-y-5">
                            <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                                <span>OVER {digit} WEIGHT</span>
                                <span>{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-6 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-cyan-600 [&>div]:to-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
                        </div>
                        <div className="space-y-5">
                            <div className="flex justify-between text-xs font-black uppercase tracking-[0.3em] text-orange-300">
                                <span>UNDER {digit} WEIGHT</span>
                                <span>{stats.under.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.under} className="h-6 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.5)]" />
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
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-32">
            <Card className="border-none shadow-[0_20px_80px_rgba(0,0,0,0.6)] bg-slate-900/40 backdrop-blur-[60px] overflow-hidden relative rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-10 sm:p-14 grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-24 items-center">
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.6em] text-primary ml-2">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-20 bg-black/50 border-white/10 rounded-[2rem] font-black text-xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] px-10">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[2rem] border-white/10 bg-slate-950 text-white z-[100]">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-4">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.6em] text-primary ml-2">DATA HORIZON (TICKS)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-20 bg-black/50 border-white/10 rounded-[2rem] font-black text-4xl text-primary text-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] focus:ring-primary/50 transition-all"
                            />
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Activity size={32} /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 px-10">
                    <div className="flex items-center gap-10">
                        <div className="p-5 bg-rose-500/25 rounded-[2rem] animate-pulse shadow-[0_0_40px_rgba(244,63,94,0.4)]">
                            <Flame className="h-10 w-10 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black uppercase tracking-[0.8em] text-white">DIGIT HEAT MATRIX</h3>
                            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-muted-foreground mt-2">Precision Volumetric HUD Flux</p>
                        </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-primary/30 px-10 py-3.5 font-black tracking-[0.4em] uppercase text-[12px] rounded-full shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                        {lastDigitTicks.length} TICK STREAM ACTIVE
                    </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-20">
                {marketDirectionAnalysis && (
                    <>
                        <div className="p-12 rounded-[4rem] bg-slate-950/80 border border-white/10 backdrop-blur-[60px] group hover:bg-slate-950 transition-all duration-700 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-chart-1 to-transparent opacity-40" />
                            <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-muted-foreground border-b border-white/5 pb-10 flex items-center gap-6">
                                <List className="h-8 w-8 text-chart-1" /> EVEN / ODD GATES
                            </h4>
                            <div className="space-y-12 pt-10">
                                <div className="space-y-6">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.4em]">
                                        <span className="text-chart-1">EVEN FLOW</span>
                                        <span className="text-white text-3xl tracking-tighter">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.even} className="h-6 bg-black/50 [&>div]:bg-chart-1 shadow-[0_0_25px_rgba(var(--chart-1),0.6)]" />
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.4em]">
                                        <span className="text-chart-3">ODD FLOW</span>
                                        <span className="text-white text-3xl tracking-tighter">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.odd} className="h-6 bg-black/50 [&>div]:bg-chart-3 shadow-[0_0_25px_rgba(var(--chart-3),0.6)]" />
                                </div>
                            </div>
                        </div>

                        <div className="p-12 rounded-[4rem] bg-slate-950/80 border border-white/10 backdrop-blur-[60px] group hover:bg-slate-950 transition-all duration-700 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accent to-transparent opacity-40" />
                            <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-muted-foreground border-b border-white/5 pb-10 flex items-center gap-6">
                                <BarChartHorizontal className="h-8 w-8 text-accent" /> BARRIER SYMMETRY
                            </h4>
                            <div className="space-y-12 pt-10">
                                <div className="space-y-6">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.4em]">
                                        <span className="text-accent">UNDER 5 WEIGHT</span>
                                        <span className="text-white text-3xl tracking-tighter">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.lower} className="h-6 bg-black/50 [&>div]:bg-accent shadow-[0_0_25px_rgba(var(--accent),0.6)]" />
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-[0.4em]">
                                        <span className="text-rose-500">OVER 4 WEIGHT</span>
                                        <span className="text-white text-3xl tracking-tighter">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.higher} className="h-6 bg-black/50 [&>div]:bg-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]" />
                                </div>
                            </div>
                        </div>

                        <div className="p-12 rounded-[4rem] bg-slate-950/80 border border-white/10 backdrop-blur-[60px] group hover:bg-slate-950 transition-all duration-700 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-transparent opacity-40" />
                            <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-muted-foreground border-b border-white/5 pb-10 flex items-center gap-6">
                                <Zap className="h-8 w-8 text-cyan-400" /> REAL-TIME PIVOT
                            </h4>
                            <div className="flex flex-col items-center justify-center pt-10 flex-1">
                                <div className="relative group/price">
                                    <div className="absolute -inset-12 bg-primary/25 blur-[60px] rounded-full opacity-60 group-hover/price:opacity-100 transition-opacity animate-pulse" />
                                    <p className="text-[14px] font-black uppercase text-primary tracking-[0.6em] mb-6 text-center">TECHNICAL HUD FLUX</p>
                                    <p className="text-7xl sm:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(var(--primary),1)] relative">
                                        {price.toFixed(decimalPlaces)}
                                    </p>
                                </div>
                                <div className="mt-16 flex gap-8 w-full">
                                    <div className="flex-1 text-center bg-emerald-500/20 border-2 border-emerald-500/40 py-6 rounded-[2.5rem] shadow-2xl group/bull transition-all hover:bg-emerald-500/30">
                                        <p className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.3em] mb-2 group-hover/bull:animate-bounce">BULLISH</p>
                                        <p className="text-3xl font-black text-white">{marketDirectionAnalysis.overUnder.higher.toFixed(0)}%</p>
                                    </div>
                                    <div className="flex-1 text-center bg-rose-500/20 border-2 border-rose-500/40 py-6 rounded-[2.5rem] shadow-2xl group/bear transition-all hover:bg-rose-500/30">
                                        <p className="text-[11px] font-black uppercase text-rose-400 tracking-[0.3em] mb-2 group-hover/bear:animate-bounce">BEARISH</p>
                                        <p className="text-3xl font-black text-white">{marketDirectionAnalysis.overUnder.lower.toFixed(0)}%</p>
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