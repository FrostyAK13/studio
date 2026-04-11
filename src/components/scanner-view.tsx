'use client';
import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { syntheticIndices } from '@/lib/mock-data';
import { DigitFrequencyCircles } from './correlation-view';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Zap, ShieldAlert, BarChart3, Radio, TrendingUp, TrendingDown, Flame, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface ScannerViewProps {
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

const TacticalHeatMap = ({ ticks }: { ticks: number[] }) => {
    const latestDigit = ticks.length > 0 ? ticks[0] : null;

    const { highers, lowers } = React.useMemo(() => {
        const counts = Array(10).fill(0);
        ticks.forEach(d => counts[d]++);
        const total = ticks.length || 1;
        
        const mapped = counts.map((count, index) => ({
            digit: index,
            count,
            percentage: (count / total) * 100
        }));

        const sorted = [...mapped].sort((a, b) => b.percentage - a.percentage);
        
        return {
            highers: sorted.slice(0, 4), 
            lowers: [...sorted].reverse().slice(0, 4) 
        };
    }, [ticks]);

    const GreenLevels = [
        "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white border-emerald-400/50",
        "bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white/90 border-emerald-400/30",
        "bg-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.2)] text-white/70 border-emerald-400/20",
        "bg-emerald-500/40 text-white/50 border-emerald-400/10"
    ];

    const RedLevels = [
        "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] text-white border-rose-400/50",
        "bg-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.3)] text-white/90 border-rose-400/30",
        "bg-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.2)] text-white/70 border-rose-400/20",
        "bg-rose-500/40 text-white/50 border-rose-400/10"
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mt-8 sm:mt-16">
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4 px-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-emerald-400">HIGH FREQUENCY</h4>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                    {highers.map((item, idx) => {
                        const isLive = item.digit === latestDigit;
                        return (
                            <motion.div 
                                key={item.digit}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={cn(
                                    "h-24 sm:h-36 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden",
                                    GreenLevels[idx],
                                    isLive ? "ring-4 ring-cyan-400 ring-offset-4 ring-offset-slate-950 z-20 shadow-[0_0_40px_rgba(34,211,238,0.6)]" : ""
                                )}
                            >
                                <AnimatePresence>
                                    {isLive && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-2 flex items-center gap-1"
                                        >
                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                                            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">LIVE</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className={cn(
                                    "text-3xl sm:text-6xl font-black tabular-nums leading-none mb-1 transition-all",
                                    isLive ? "scale-110" : ""
                                )}>{item.digit}</span>
                                <span className="text-[8px] sm:text-[12px] font-black uppercase tracking-widest opacity-80">{item.percentage.toFixed(1)}%</span>
                                {isLive && (
                                    <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4 px-4">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-rose-500" />
                        <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-rose-500">LOW FREQUENCY</h4>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                    {lowers.map((item, idx) => {
                        const isLive = item.digit === latestDigit;
                        return (
                            <motion.div 
                                key={item.digit}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={cn(
                                    "h-24 sm:h-36 rounded-[1.5rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden",
                                    RedLevels[idx],
                                    isLive ? "ring-4 ring-cyan-400 ring-offset-4 ring-offset-slate-950 z-20 shadow-[0_0_40px_rgba(34,211,238,0.6)]" : ""
                                )}
                            >
                                <AnimatePresence>
                                    {isLive && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-2 flex items-center gap-1"
                                        >
                                            <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                                            <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">LIVE</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className={cn(
                                    "text-3xl sm:text-6xl font-black tabular-nums leading-none mb-1 transition-all",
                                    isLive ? "scale-110" : ""
                                )}>{item.digit}</span>
                                <span className="text-[8px] sm:text-[12px] font-black uppercase tracking-widest opacity-80">{item.percentage.toFixed(1)}%</span>
                                {isLive && (
                                    <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none" />
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export function ScannerView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
}: ScannerViewProps) {
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    const globalBias = React.useMemo(() => {
        if (lastDigitTicks.length < 10) return 50;
        const over = lastDigitTicks.filter(d => d > 4).length;
        const even = lastDigitTicks.filter(d => d % 2 === 0).length;
        const recent = lastDigitTicks.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        return ((over / lastDigitTicks.length) * 40) + ((even / lastDigitTicks.length) * 40) + (recent * 2);
    }, [lastDigitTicks]);

    return (
        <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-8">
                <Card className="xl:col-span-3 border-none shadow-[0_10px_40px_rgba(0,0,0,0.6)] bg-slate-900/40 backdrop-blur-[60px] overflow-hidden relative rounded-[2rem] sm:rounded-[4rem]">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    <CardContent className="p-6 sm:p-14 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12 items-end">
                        <div className="space-y-4 sm:space-y-6">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-primary ml-2 sm:ml-4">MARKET VECTOR SELECT</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-14 sm:h-20 bg-black/40 border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-sm sm:text-xl px-6 sm:px-10">
                                    <SelectValue placeholder="Select Index" />
                                </SelectTrigger>
                                <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-[1.5rem] sm:rounded-[2.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                    {syntheticIndices.map((index) => (
                                    <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 sm:py-4 font-black text-xs sm:text-base">
                                        {index.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-primary ml-2 sm:ml-4">DATA HORIZON (TICKS)</Label>
                            <div className="relative group">
                                <Input
                                    type="number"
                                    min="1"
                                    max="5000"
                                    value={maxTicks === 0 ? '' : maxTicks}
                                    onChange={handleMaxTicksChange}
                                    onBlur={handleMaxTicksBlur}
                                    className="h-14 sm:h-20 bg-black/40 border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] font-black text-xl sm:text-4xl text-primary text-center relative z-10"
                                />
                                <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-20"><Activity size={24} className="sm:w-8 sm:h-8" /></div>
                            </div>
                        </div>
                        <div className="space-y-4 sm:space-y-6">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-primary ml-2 sm:ml-4">LIVE PIVOT PRICE</Label>
                            <div className="h-14 sm:h-20 bg-gradient-to-br from-primary/80 to-blue-700 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center shadow-2xl px-6 sm:px-10 border border-white/10 relative overflow-hidden group">
                                <span className="text-xl sm:text-4xl font-black tabular-nums text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] relative">{price.toFixed(decimalPlaces)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-[0_10px_40px_rgba(0,0,0,0.6)] bg-slate-950/80 backdrop-blur-[60px] rounded-[2rem] sm:rounded-[4rem] p-6 sm:p-10 flex flex-col justify-between border-l border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10"><Radio size={48} className="text-primary sm:w-20 sm:h-20" /></div>
                    <div>
                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4 sm:mb-6 uppercase">MARKET BIAS</p>
                        <div className="flex items-end gap-2 sm:gap-3">
                            <span className="text-4xl sm:text-6xl font-black text-white tracking-tighter tabular-nums">{globalBias.toFixed(0)}</span>
                        </div>
                    </div>
                    <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-0">
                        <div className="flex justify-between text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>BEARISH SKEW</span>
                            <span>BULLISH SKEW</span>
                        </div>
                        <Progress value={globalBias} className="h-3 sm:h-4 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:via-primary [&>div]:to-emerald-500 shadow-[0_0_20px_rgba(var(--primary),0.3)]" />
                    </div>
                </Card>
            </div>

            <div className="space-y-6 sm:space-y-12 pb-32">
                <div className="flex items-center gap-4 sm:gap-6 px-4 sm:px-10">
                    <div className="h-8 sm:h-12 w-1 sm:w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),1)]" />
                    <div>
                        <h2 className="text-lg sm:text-2xl font-black uppercase tracking-[0.3em] sm:tracking-[0.6em] text-white leading-tight">ACTIVE SURVEILLANCE</h2>
                    </div>
                </div>

                <DigitFrequencyCircles 
                    ticks={lastDigitTicks} 
                    selectedDigit={selectedDigit}
                    onDigitSelect={setSelectedDigit}
                    selectedMarket={selectedMarket}
                />

                <div className="px-2 sm:px-10">
                    <TacticalHeatMap ticks={lastDigitTicks} />
                </div>
            </div>
        </div>
    )
}
