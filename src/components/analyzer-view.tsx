
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Activity, Layers, SignalHigh, Hash, Boxes, Timer, BarChart3, Scale, LayoutGrid, Target, ArrowRightLeft, Sparkles, TrendingUp, TrendingDown, Crosshair, Zap, ArrowUp, ArrowDown } from 'lucide-react';
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

const digitColors = [
    "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500", 
    "bg-teal-500", "bg-cyan-500", "bg-blue-500", "bg-violet-500", "bg-fuchsia-500"
];

const digitTextColors = [
    "text-rose-500", "text-orange-500", "text-amber-500", "text-lime-500", "text-emerald-500", 
    "text-teal-500", "text-cyan-500", "text-blue-500", "text-violet-500", "text-fuchsia-500"
];

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

        return {
            overCount, underCount,
            overPerc: (overCount / total) * 100,
            underPerc: (underCount / total) * 100,
            evenPerc: (evenCount / total) * 100,
            oddPerc: (oddCount / total) * 100,
            risePerc: (riseCount / rfTotal) * 100,
            fallPerc: (fallCount / rfTotal) * 100,
            matchPerc: (matchCount / total) * 100,
            differPerc: (differCount / total) * 100,
        };
    }, [lastDigitTicks, priceHistory, selectedDigit]);

    const deltaInfo = React.useMemo(() => {
        switch (tradeType) {
            case 'over-under':
                return { label: `OVER vs UNDER ${selectedDigit}`, val1: stats.overPerc, val2: stats.underPerc, delta: Math.abs(stats.overPerc - stats.underPerc) };
            case 'even-odd':
                return { label: "EVEN vs ODD", val1: stats.evenPerc, val2: stats.oddPerc, delta: Math.abs(stats.evenPerc - stats.oddPerc) };
            case 'rise-fall':
                return { label: "RISE vs FALL", val1: stats.risePerc, val2: stats.fallPerc, delta: Math.abs(stats.risePerc - stats.fallPerc) };
            case 'matches-differs':
                return { label: `MATCH vs DIFFER ${selectedDigit}`, val1: stats.matchPerc, val2: stats.differPerc, delta: Math.abs(stats.matchPerc - stats.differPerc) };
            default:
                return { label: "DELTA", val1: 0, val2: 0, delta: 0 };
        }
    }, [tradeType, stats, selectedDigit]);

    const renderPattern = () => {
        const slice = [...lastDigitTicks.slice(0, 24)].reverse();
        const pivot = lastDigitTicks[0];
        return slice.map((digit, i) => {
            const isPivot = digit === pivot;
            const colorClass = digitColors[digit];
            
            return (
                <motion.div 
                    key={i} 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                        "w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-sm sm:text-xl border transition-all duration-300 backdrop-blur-xl relative overflow-hidden group",
                        colorClass,
                        isPivot ? "ring-4 ring-white scale-110 z-10 shadow-[0_0_20px_white] text-white" : "border-white/10 text-white/90"
                    )}
                >
                    <span className="relative z-10 drop-shadow-md">{digit}</span>
                </motion.div>
            );
        });
    };

    return (
        <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            {/* Control Grid */}
            <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] sm:rounded-[4rem] border border-white/5">
                <CardContent className="p-8 sm:p-14 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">MARKET VECTOR</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-16 bg-black/50 border-white/10 rounded-[1.5rem] font-black text-sm sm:text-lg">
                                    <SelectValue placeholder="Select Market" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-[1.5rem]">
                                    {syntheticIndices.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold">{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">TRADE STRATEGY</Label>
                            <Select value={tradeType} onValueChange={setTradeType}>
                                <SelectTrigger className="h-16 bg-black/50 border-white/10 rounded-[1.5rem] font-black text-sm sm:text-lg">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-[1.5rem]">
                                    <SelectItem value="over-under" className="font-bold text-sm sm:text-base">Over/Under</SelectItem>
                                    <SelectItem value="even-odd" className="font-bold text-sm sm:text-base">Even/Odd</SelectItem>
                                    <SelectItem value="matches-differs" className="font-bold text-sm sm:text-base">Matches/Differs</SelectItem>
                                    <SelectItem value="rise-fall" className="font-bold text-sm sm:text-base">Rise/Fall</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">TACTICAL PIVOT SELECT</Label>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-4">
                            {Array.from({ length: 10 }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDigit(i)}
                                    className={cn(
                                        "h-12 sm:h-16 rounded-xl font-black text-lg transition-all border",
                                        selectedDigit === i 
                                            ? "bg-primary border-white/20 text-white scale-110 shadow-[0_0_20px_rgba(var(--primary),0.6)]" 
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

            {/* Pivot Engine HUD */}
            <Card className="border-none bg-primary/10 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] border border-primary/20 shadow-2xl">
                <CardContent className="p-8 sm:p-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-2">TACTICAL DELTA ENGINE</h3>
                            <Badge className="bg-primary/20 text-primary border-none font-black tracking-widest">{deltaInfo.label}</Badge>
                        </div>
                        <div className="flex gap-8 sm:gap-16 items-center">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">DELTA VARIANCE</p>
                                <p className="text-4xl sm:text-6xl font-black text-emerald-400 tabular-nums tracking-tighter">{deltaInfo.delta.toFixed(1)}%</p>
                            </div>
                            <div className="w-px h-16 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">LIVE PRICE</p>
                                <p className="text-2xl sm:text-4xl font-black text-white tabular-nums">{price.toFixed(decimalPlaces)}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sequence Scanner */}
            <Card className="border-none shadow-2xl bg-slate-900/40 border border-white/10 p-10 sm:p-20 rounded-[2.5rem] sm:rounded-[5rem] overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                    <h3 className="text-xl font-black uppercase tracking-[0.4em] text-white">SEQUENCE FLUX SCANNER</h3>
                    <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                         <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">STREAMING ACTIVE</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                    {renderPattern()}
                </div>
            </Card>

            {/* Matrix HUD */}
            <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[5rem] overflow-hidden border border-white/5">
                <CardContent className="p-10 sm:p-20 space-y-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">VECTOR ALPHA</p>
                                <span className="text-3xl font-black text-emerald-400 tabular-nums">{deltaInfo.val1.toFixed(1)}%</span>
                            </div>
                            <Progress value={deltaInfo.val1} className="h-4 bg-black/60 [&>div]:bg-emerald-500" />
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">VECTOR BETA</p>
                                <span className="text-3xl font-black text-rose-500 tabular-nums">{deltaInfo.val2.toFixed(1)}%</span>
                            </div>
                            <Progress value={deltaInfo.val2} className="h-4 bg-black/60 [&>div]:bg-rose-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

