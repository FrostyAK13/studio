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
        let rating = "STABLE";

        if (freq > 13) {
            colorClass = "text-rose-500";
            glowClass = "shadow-[0_0_20px_rgba(244,63,94,0.15)] border-rose-500/20";
            bgClass = "bg-rose-500/10";
            rating = "VOLATILE";
        } else if (freq > 11) {
            colorClass = "text-orange-500";
            glowClass = "shadow-[0_0_15px_rgba(249,115,22,0.1)] border-orange-500/10";
            bgClass = "bg-orange-500/5";
            rating = "TRENDING";
        } else if (freq < 7) {
            colorClass = "text-cyan-500";
            glowClass = "shadow-[0_0_20px_rgba(6,182,212,0.15)] border-cyan-500/20";
            bgClass = "bg-cyan-500/10";
            rating = "COLD";
        }

        return { freq, tsl, colorClass, glowClass, bgClass, rating, velocity };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-500 rounded-[0.75rem] sm:rounded-[2rem] border p-2 sm:p-5 flex flex-col justify-between h-28 sm:h-64 overflow-hidden backdrop-blur-xl",
                stats.bgClass,
                stats.glowClass || "border-white/5",
                isSelected ? "ring-2 ring-primary scale-105 z-20 shadow-[0_0_40px_rgba(var(--primary),0.2)] bg-primary/20" : "hover:scale-[1.02] hover:bg-white/10"
            )}
        >
            {/* Live Cursor Scanner Overlay */}
            {isLatest && (
                <motion.div 
                    layoutId="digit-scanner-cursor"
                    className="absolute inset-0 z-30 pointer-events-none"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div className="absolute inset-0 border-2 sm:border-4 border-cyan-400/60 rounded-[inherit] shadow-[0_0_30px_rgba(34,211,238,0.4)]" />
                    <div className="absolute inset-0 bg-cyan-400/5" />
                    <motion.div 
                        initial={{ top: "-100%" }}
                        animate={{ top: "200%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent"
                    />
                </motion.div>
            )}

            <div className="absolute top-0 right-0 p-1 sm:p-4 opacity-20 sm:opacity-30 group-hover:opacity-50 transition-opacity">
                <Hash className={cn("w-8 h-8 sm:w-24 sm:h-24", stats.colorClass)} />
            </div>

            <div className="flex justify-between items-start relative z-10">
                <div className="relative">
                    <span className={cn(
                        "text-2xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-none select-none drop-shadow-2xl transition-all duration-500",
                        isSelected ? "text-white scale-110" : stats.colorClass
                    )}>
                        {digit}
                    </span>
                    {Math.abs(stats.velocity) > 2 && (
                        <div className={cn(
                            "absolute -top-1 -right-4 sm:-right-12 flex items-center gap-0.5 font-black text-[5px] sm:text-[10px] uppercase tracking-widest px-1 sm:px-2 py-0.5 rounded-full shadow-lg z-20",
                            stats.velocity > 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                            {stats.velocity > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                            {stats.velocity > 0 ? 'HEAT' : 'COLD'}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <Badge className={cn(
                        "text-[5px] sm:text-[11px] font-black tracking-widest mb-0.5 sm:mb-3 px-1 sm:px-4 py-0 border-none",
                        stats.colorClass.replace('text-', 'bg-').replace('400', '500').replace('500', '600') + "/20",
                        stats.colorClass
                    )}>
                        {stats.rating}
                    </Badge>
                    <p className={cn("text-[10px] sm:text-3xl font-black tabular-nums tracking-tighter", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="space-y-0.5 sm:space-y-3 relative z-10">
                <div className="flex items-center gap-1 opacity-60">
                    <Timer className="h-2 w-2 sm:h-5 sm:w-5" />
                    <span className="text-[5px] sm:text-[11px] font-black uppercase tracking-widest text-foreground">SINCE LAST</span>
                </div>
                <div className="flex items-baseline gap-1 sm:gap-3">
                    <span className="text-sm sm:text-5xl md:text-6xl font-black text-foreground tabular-nums tracking-tighter drop-shadow-xl">
                        {stats.tsl}
                    </span>
                    <span className="text-[6px] sm:text-[14px] font-black text-muted-foreground uppercase tracking-widest opacity-80">STREAK</span>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 sm:h-2 bg-black/20 overflow-hidden">
                <div 
                    className={cn("h-full transition-all duration-1000 ease-out", stats.colorClass.replace('text-', 'bg-'))} 
                    style={{ 
                        width: `${Math.min(stats.freq * 6, 100)}%`
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
        <Card className="mt-8 border-none bg-slate-950/90 backdrop-blur-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700 rounded-[1.5rem] sm:rounded-[3rem]">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-primary to-emerald-600" />
            <CardHeader className="pb-4 sm:pb-8 pt-8 sm:pt-12 px-5 sm:px-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-center sm:text-left">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[0.75rem] sm:rounded-[1.25rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),1)]" />
                        </div>
                        <div>
                            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">DIGIT {digit} INTEL</CardTitle>
                            <CardDescription className="text-primary/70 font-black uppercase tracking-[0.3em] text-[7px] sm:text-[10px] mt-2">Precision Volumetric Matrix</CardDescription>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-5 sm:px-8 py-2 sm:py-3 rounded-[1rem] sm:rounded-[1.5rem] text-center shadow-2xl w-full sm:w-auto">
                        <p className="text-[7px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">STABILITY INDEX</p>
                        <p className="text-sm sm:text-xl font-black text-emerald-400 tabular-nums uppercase">Ultra Precision</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-5 sm:px-10 pb-8 sm:pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                <div className="space-y-6 sm:space-y-8 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-black/50 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/40" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-4 sm:pb-6">
                        <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3">
                            <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" /> ACCURACY GATE
                        </h4>
                        <span className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-400 tabular-nums">{stats.actualFreq.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-300">
                                <span>MATCHES FLOW</span>
                                <span>{stats.matches} TICKS</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-2.5 sm:h-3 bg-black/60 [&>div]:bg-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-rose-300">
                                <span>VARIANCE RATIO</span>
                                <span>{stats.differs} TICKS</span>
                            </div>
                            <Progress value={Math.max(0, 100 - (stats.actualFreq * 4))} className="h-2.5 sm:h-3 bg-black/60 [&>div]:bg-rose-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6 sm:space-y-8 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-black/50 border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-500/40" />
                    <div className="flex justify-between items-center border-b border-white/10 pb-4 sm:pb-6">
                        <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-3">
                            <BarChartHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" /> BARRIER SYMMETRY
                        </h4>
                        <span className="text-xl sm:text-2xl md:text-3xl font-black text-cyan-400 tabular-nums">{stats.over.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-cyan-300">
                                <span>OVER {digit} WEIGHT</span>
                                <span>{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-2.5 sm:h-3 bg-black/60 [&>div]:bg-cyan-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-orange-300">
                                <span>UNDER {digit} WEIGHT</span>
                                <span>{stats.under.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.under} className="h-2.5 sm:h-3 bg-black/60 [&>div]:bg-orange-500" />
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
        <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-20">
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-[60px] overflow-hidden relative rounded-[1.5rem] sm:rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-5 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-16 items-center">
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary ml-1 sm:ml-2">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-12 sm:h-16 bg-black/60 border-white/10 rounded-[1rem] sm:rounded-[1.5rem] font-black text-xs sm:text-base px-4 sm:px-6">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={10} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[1rem] sm:rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 px-4 font-black text-xs sm:text-sm transition-colors">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary ml-1 sm:ml-2">NEXUS DATA HORIZON</Label>
                        <div className="relative group">
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-12 sm:h-16 bg-black/60 border-white/10 rounded-[1rem] sm:rounded-[1.5rem] font-black text-lg sm:text-2xl text-primary text-center shadow-inner relative z-10"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-20"><Activity size={20} className="sm:w-6 sm:h-6" /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6 sm:space-y-10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 px-4 sm:px-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                        <div className="p-3 sm:p-4 bg-rose-500/25 rounded-[1rem] sm:rounded-[1.25rem] shadow-[0_0_30px_rgba(244,63,94,0.2)] border border-rose-500/30">
                            <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white">DIGIT HEAT MATRIX</h3>
                            <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">Precision Volumetric HUD Flux</p>
                        </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border border-primary/40 px-3 sm:px-6 py-1.5 sm:py-2 font-black tracking-widest uppercase text-[7px] sm:text-[9px] rounded-full shadow-lg">
                        {lastDigitTicks.length} TICK STREAM ACTIVE
                    </Badge>
                </div>

                <div className="grid grid-cols-5 gap-1.5 sm:gap-6 px-1 sm:px-2">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 mt-12">
                {marketDirectionAnalysis && (
                    <>
                        <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-chart-1 opacity-60" />
                            <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-4 sm:pb-6 flex items-center gap-3">
                                <List className="h-5 w-5 sm:h-6 sm:w-6 text-chart-1" /> EVEN / ODD GATES
                            </h4>
                            <div className="space-y-6 sm:space-y-8 pt-4 sm:pt-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-chart-1">EVEN FLOW</span>
                                        <span className="text-white text-base sm:text-xl tabular-nums">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.even} className="h-2 sm:h-3 bg-black/60 [&>div]:bg-chart-1" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-chart-3">ODD FLOW</span>
                                        <span className="text-white text-base sm:text-xl tabular-nums">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.odd} className="h-2 sm:h-3 bg-black/60 [&>div]:bg-chart-3" />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-accent opacity-60" />
                            <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-4 sm:pb-6 flex items-center gap-3">
                                <BarChartHorizontal className="h-5 w-5 sm:h-6 sm:w-6 text-accent" /> BARRIER SYMMETRY
                            </h4>
                            <div className="space-y-6 sm:space-y-8 pt-4 sm:pt-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-accent">UNDER 5 WEIGHT</span>
                                        <span className="text-white text-base sm:text-xl tabular-nums">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.lower} className="h-2 sm:h-3 bg-black/60 [&>div]:bg-accent" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[7px] sm:text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-rose-500">OVER 4 WEIGHT</span>
                                        <span className="text-white text-base sm:text-xl tabular-nums">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.higher} className="h-2 sm:h-3 bg-black/60 [&>div]:bg-rose-500" />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-slate-950/80 border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-400 opacity-60" />
                            <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-muted-foreground border-b border-white/5 pb-4 sm:pb-6 flex items-center gap-3">
                                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" /> REAL-TIME PIVOT
                            </h4>
                            <div className="flex flex-col items-center justify-center pt-5 sm:pt-8 flex-1">
                                <div className="relative group/price text-center">
                                    <p className="text-[7px] sm:text-[9px] font-black uppercase text-primary tracking-widest mb-2 sm:mb-4">TECHNICAL HUD FLUX</p>
                                    <p className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(var(--primary),0.6)] relative">
                                        {price.toFixed(decimalPlaces)}
                                    </p>
                                </div>
                                <div className="mt-6 sm:mt-10 flex gap-4 w-full">
                                    <div className="flex-1 text-center bg-emerald-500/10 border border-emerald-500/20 py-3 sm:py-5 rounded-[0.75rem] sm:rounded-[1.5rem] shadow-lg">
                                        <p className="text-[7px] sm:text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">BULLISH</p>
                                        <p className="text-sm sm:text-lg font-black text-white">{marketDirectionAnalysis.overUnder.higher.toFixed(0)}%</p>
                                    </div>
                                    <div className="flex-1 text-center bg-rose-500/10 border border-rose-500/20 py-3 sm:py-5 rounded-[0.75rem] sm:rounded-[1.5rem] shadow-lg">
                                        <p className="text-[7px] sm:text-[10px] font-black uppercase text-rose-400 tracking-widest mb-1">BEARISH</p>
                                        <p className="text-sm sm:text-lg font-black text-white">{marketDirectionAnalysis.overUnder.lower.toFixed(0)}%</p>
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
