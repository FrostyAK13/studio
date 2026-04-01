'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Activity, Crosshair, TrendingUp, TrendingDown, Target, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalyzerViewProps {
    price: number;
    lastDigitTicks: number[];
    priceHistory: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    decimalPlaces: number;
    tickTimestamps: number[];
}

export function AnalyzerView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
    tickTimestamps,
}: AnalyzerViewProps) {
    const [tradeType, setTradeType] = React.useState('over-under');
    const [selectedDigit, setSelectedDigit] = React.useState<number>(5);

    const stats = React.useMemo(() => {
        const total = lastDigitTicks.length || 1;
        const overCount = lastDigitTicks.filter(d => d > selectedDigit).length;
        const underCount = lastDigitTicks.filter(d => d < selectedDigit).length;
        const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
        const oddCount = total - evenCount;
        
        let riseCount = 0;
        let fallCount = 0;
        for (let i = 0; i < priceHistory.length - 1; i++) {
            if (priceHistory[i] > priceHistory[i+1]) riseCount++;
            else if (priceHistory[i] < priceHistory[i+1]) fallCount++;
        }
        const rfTotal = (riseCount + fallCount) || 1;

        const matchCount = lastDigitTicks.filter(d => d === selectedDigit).length;
        const differCount = total - matchCount;

        let val1 = 0;
        let val2 = 0;
        let label1 = "ALPHA";
        let label2 = "BETA";

        switch (tradeType) {
            case 'over-under':
                label1 = `OVER ${selectedDigit}`;
                label2 = `UNDER ${selectedDigit}`;
                val1 = (overCount / total) * 100;
                val2 = (underCount / total) * 100;
                break;
            case 'even-odd':
                label1 = "EVEN";
                label2 = "ODD";
                val1 = (evenCount / total) * 100;
                val2 = (oddCount / total) * 100;
                break;
            case 'rise-fall':
                label1 = "RISE";
                label2 = "FALL";
                val1 = (riseCount / rfTotal) * 100;
                val2 = (fallCount / rfTotal) * 100;
                break;
            case 'matches-differs':
                label1 = "MATCHES";
                label2 = "DIFFERS";
                val1 = (matchCount / total) * 100;
                val2 = (differCount / total) * 100;
                break;
        }

        return {
            val1,
            val2,
            label1,
            label2,
            delta: Math.abs(val1 - val2)
        };
    }, [lastDigitTicks, priceHistory, selectedDigit, tradeType]);

    const renderPattern = () => {
        const slice = [...lastDigitTicks.slice(0, 15)].reverse();
        const pivotIndex = slice.length - 1;
        
        return slice.map((digit, i) => {
            const isPivot = i === pivotIndex;
            const isMatch = digit === selectedDigit;
            const isOver = digit > selectedDigit;
            
            let colorClass = "bg-rose-500 border-rose-400/30 text-white"; // Default Under
            if (isMatch) colorClass = "bg-blue-600 border-blue-400/30 text-white"; // Match = Blue
            else if (isOver) colorClass = "bg-emerald-500 border-emerald-400/30 text-white"; // Over = Green
            
            return (
                <motion.div 
                    key={i} 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                        "w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-black text-sm sm:text-2xl border transition-all duration-300 relative overflow-hidden group",
                        isPivot ? "ring-4 ring-white ring-offset-4 ring-offset-slate-950 z-10 shadow-[0_0_40px_rgba(255,255,255,0.4)]" : colorClass
                    )}
                >
                    <span className="relative z-10">{digit}</span>
                    {isPivot && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                </motion.div>
            );
        });
    };

    return (
        <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            {/* Strategy Configuration */}
            <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3.5rem] border border-white/5">
                <CardContent className="p-8 sm:p-14 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">MARKET</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-14 sm:h-16 bg-black/50 border-white/10 rounded-2xl font-black text-xs sm:text-base">
                                    <SelectValue placeholder="Select Market" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
                                    {syntheticIndices.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold">{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">STRATEGY</Label>
                            <Select value={tradeType} onValueChange={setTradeType}>
                                <SelectTrigger className="h-14 sm:h-16 bg-black/50 border-white/10 rounded-2xl font-black text-xs sm:text-base">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
                                    <SelectItem value="over-under" className="font-bold">Over/Under</SelectItem>
                                    <SelectItem value="even-odd" className="font-bold">Even/Odd</SelectItem>
                                    <SelectItem value="matches-differs" className="font-bold">Matches/Differs</SelectItem>
                                    <SelectItem value="rise-fall" className="font-bold">Rise/Fall</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">TACTICAL SIGNAL GRID</Label>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
                            {Array.from({ length: 10 }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDigit(i)}
                                    className={cn(
                                        "h-10 sm:h-16 rounded-xl font-black text-sm sm:text-xl transition-all border",
                                        selectedDigit === i 
                                            ? "bg-primary border-white/20 text-white scale-110 shadow-[0_0_20px_rgba(var(--primary),0.5)]" 
                                            : "bg-black/40 border-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tactical HUD */}
            <Card className="border-none bg-slate-950/80 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3.5rem] border border-white/5 shadow-2xl">
                <CardContent className="p-8 sm:p-14">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="text-center lg:text-left space-y-3">
                            <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase">TACTICAL VECTOR</h3>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                                <Badge className="bg-primary/20 text-primary border-none font-black tracking-widest text-[9px] sm:text-xs px-4 py-1 uppercase">{stats.label1} vs {stats.label2}</Badge>
                                <Badge className="bg-blue-500/10 text-blue-400 border-none font-black tracking-widest text-[9px] sm:text-xs px-4 py-1 uppercase">SIGNAL: {selectedDigit}</Badge>
                            </div>
                        </div>
                        
                        <div className="flex gap-8 sm:gap-16 items-center justify-center">
                            <div className="text-center space-y-1">
                                <p className="text-[9px] sm:text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">LIVE PIVOT</p>
                                <p className="text-3xl sm:text-6xl font-black text-white tabular-nums tracking-tighter">{price.toFixed(decimalPlaces)}</p>
                            </div>
                            <div className="w-px h-16 sm:h-24 bg-white/10" />
                            <div className="text-center space-y-1">
                                <p className="text-[9px] sm:text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">TACTICAL DELTA</p>
                                <p className="text-3xl sm:text-6xl font-black text-emerald-400 tabular-nums tracking-tighter">{stats.delta.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sequence Flux Scanner */}
            <Card className="border-none shadow-2xl bg-slate-900/40 border border-white/10 p-8 sm:p-14 rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
                    <h3 className="text-sm sm:text-lg font-black uppercase tracking-[0.4em] text-white">SEQUENCE FLUX</h3>
                    <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_#60a5fa]" />
                         <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">SIGNAL SYNC ACTIVE</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                    {renderPattern()}
                </div>
            </Card>

            {/* Matrix HUD (Alpha & Beta Vectors) */}
            <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden border border-white/5">
                <CardContent className="p-10 sm:p-16 space-y-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">VECTOR ALPHA</p>
                                    <h4 className="text-base sm:text-xl font-black text-white/60">{stats.label1}</h4>
                                </div>
                                <span className="text-3xl sm:text-6xl font-black text-emerald-400 tabular-nums">{stats.val1.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.val1} className="h-4 sm:h-5 bg-black/60 [&>div]:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-1">VECTOR BETA</p>
                                    <h4 className="text-base sm:text-xl font-black text-white/60">{stats.label2}</h4>
                                </div>
                                <span className="text-3xl sm:text-6xl font-black text-rose-500 tabular-nums">{stats.val2.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.val2} className="h-4 sm:h-5 bg-black/60 [&>div]:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]" />
                        </div>
                    </div>

                    <div className="p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] bg-slate-900/80 border border-white/10 text-center shadow-2xl">
                        <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-6 flex items-center justify-center gap-3">
                            <Zap className="h-5 w-5" /> TACTICAL SUMMARY
                        </h4>
                        <p className="text-base sm:text-2xl font-medium text-white/90 leading-relaxed italic drop-shadow-md">
                            "Matrix synchronization identifies a <span className={cn("font-black px-3 py-1 rounded-xl", stats.val1 > stats.val2 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10")}>{stats.val1 > stats.val2 ? stats.label1 : stats.label2}</span> bias. Variance detected at <span className="text-primary font-black underline underline-offset-4 decoration-primary/40">{stats.delta.toFixed(1)}%</span> from signal pivot."
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
