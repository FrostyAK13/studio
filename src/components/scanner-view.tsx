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
import { Activity, Radio, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

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
        "bg-emerald-500 text-white border-emerald-400",
        "bg-emerald-400 text-white border-emerald-300",
        "bg-emerald-300 text-emerald-900 border-emerald-200",
        "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 border-emerald-100"
    ];

    const RedLevels = [
        "bg-rose-500 text-white border-rose-400",
        "bg-rose-400 text-white border-rose-300",
        "bg-rose-300 text-rose-900 border-rose-200",
        "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-100 border-rose-100"
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-10">
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2 px-3">
                    <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-600">HIGH FREQUENCY</h4>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {highers.map((item, idx) => {
                        const isLive = item.digit === latestDigit;
                        return (
                            <motion.div 
                                key={item.digit}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={cn(
                                    "h-20 sm:h-28 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden",
                                    GreenLevels[idx],
                                    isLive ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background z-20 shadow-lg" : ""
                                )}
                            >
                                <AnimatePresence>
                                    {isLive && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-1.5 flex items-center gap-1"
                                        >
                                            <div className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
                                            <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">LIVE</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className={cn(
                                    "text-2xl sm:text-4xl font-black tabular-nums leading-none mb-0.5 transition-all",
                                    isLive ? "scale-110" : ""
                                )}>{item.digit}</span>
                                <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">{item.percentage.toFixed(1)}%</span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2 px-3">
                    <div className="flex items-center gap-1.5">
                        <TrendingDown className="h-4 w-4 text-rose-600" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-600">LOW FREQUENCY</h4>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {lowers.map((item, idx) => {
                        const isLive = item.digit === latestDigit;
                        return (
                            <motion.div 
                                key={item.digit}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={cn(
                                    "h-20 sm:h-28 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden",
                                    RedLevels[idx],
                                    isLive ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background z-20 shadow-lg" : ""
                                )}
                            >
                                <AnimatePresence>
                                    {isLive && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-1.5 flex items-center gap-1"
                                        >
                                            <div className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
                                            <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">LIVE</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className={cn(
                                    "text-2xl sm:text-4xl font-black tabular-nums leading-none mb-0.5 transition-all",
                                    isLive ? "scale-110" : ""
                                )}>{item.digit}</span>
                                <span className="text-[7px] sm:text-[10px] font-black uppercase tracking-widest opacity-80">{item.percentage.toFixed(1)}%</span>
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
                <Card className="xl:col-span-3 border-none shadow-sm bg-card overflow-hidden relative rounded-2xl border border-border">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    <CardContent className="p-5 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-10 items-end">
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary ml-2">MARKET VECTOR SELECT</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-12 bg-muted/50 border-border rounded-xl font-black text-xs px-5">
                                    <SelectValue placeholder="Select Index" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    {syntheticIndices.map((index) => (
                                    <SelectItem key={index.id} value={index.id} className="focus:bg-primary/10 font-black text-xs">
                                        {index.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary ml-2">DATA HORIZON (TICKS)</Label>
                            <div className="relative group">
                                <Input
                                    type="number"
                                    min="1"
                                    max="5000"
                                    value={maxTicks === 0 ? '' : maxTicks}
                                    onChange={handleMaxTicksChange}
                                    onBlur={handleMaxTicksBlur}
                                    className="h-12 bg-muted/50 border-border rounded-xl font-black text-lg text-primary text-center relative z-10"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-20"><Activity size={20} /></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary ml-2">LIVE PIVOT PRICE</Label>
                            <div className="h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md px-5 border border-white/10 relative overflow-hidden group">
                                <span className="text-lg font-black tabular-nums drop-shadow-sm relative">{price.toFixed(decimalPlaces)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card rounded-2xl p-5 sm:p-8 flex flex-col justify-between border border-border relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10"><Radio size={36} className="text-primary" /></div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-3">MARKET BIAS</p>
                        <div className="flex items-end gap-1.5">
                            <span className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter tabular-nums">{globalBias.toFixed(0)}</span>
                        </div>
                    </div>
                    <div className="space-y-2 mt-4 sm:mt-0">
                        <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>BEARISH SKEW</span>
                            <span>BULLISH SKEW</span>
                        </div>
                        <Progress value={globalBias} className="h-2.5 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:via-primary [&>div]:to-emerald-500 shadow-sm" />
                    </div>
                </Card>
            </div>

            <div className="space-y-6 pb-32">
                <div className="flex items-center gap-3 px-4 sm:px-8">
                    <div className="h-6 w-1 bg-primary rounded-full shadow-sm" />
                    <div>
                        <h2 className="text-sm sm:text-xl font-black uppercase tracking-[0.2em] text-foreground leading-tight">ACTIVE SURVEILLANCE</h2>
                    </div>
                </div>

                <DigitFrequencyCircles 
                    ticks={lastDigitTicks} 
                    selectedDigit={selectedDigit}
                    onDigitSelect={setSelectedDigit}
                    selectedMarket={selectedMarket}
                />

                <div className="px-2 sm:px-8">
                    <TacticalHeatMap ticks={lastDigitTicks} />
                </div>
            </div>
        </div>
    )
}