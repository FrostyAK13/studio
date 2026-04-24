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
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                        <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600">HIGH FREQUENCY</h4>
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
                                    "h-16 sm:h-24 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden",
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
                                            className="absolute top-1 flex items-center gap-1"
                                        >
                                            <div className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
                                            <span className="text-[6px] font-black text-blue-500 uppercase tracking-widest">LIVE</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className={cn(
                                    "text-xl sm:text-3xl font-black tabular-nums leading-none mb-0.5 transition-all",
                                    isLive ? "scale-110" : ""
                                )}>{item.digit}</span>
                                <span className="text-[6px] sm:text-[9px] font-black uppercase tracking-widest opacity-80">{item.percentage.toFixed(1)}%</span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2 px-3">
                    <div className="flex items-center gap-1.5">
                        <TrendingDown className="h-3 w-3 text-rose-600" />
                        <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-rose-600">LOW FREQUENCY</h4>
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
                                    "h-16 sm:h-24 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 relative overflow-hidden",
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
                                            className="absolute top-1 flex items-center gap-1"
                                        >
                                            <div className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
                                            <span className="text-[6px] font-black text-blue-500 uppercase tracking-widest">LIVE</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span className={cn(
                                    "text-xl sm:text-3xl font-black tabular-nums leading-none mb-0.5 transition-all",
                                    isLive ? "scale-110" : ""
                                )}>{item.digit}</span>
                                <span className="text-[6px] sm:text-[9px] font-black uppercase tracking-widest opacity-80">{item.percentage.toFixed(1)}%</span>
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
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <Card className="xl:col-span-3 border-none shadow-sm bg-card overflow-hidden relative rounded-xl border border-border">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">MARKET VECTOR</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-8 bg-muted/50 border-border rounded-lg font-black text-[10px] px-4">
                                    <SelectValue placeholder="Select Index" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    {syntheticIndices.map((index) => (
                                    <SelectItem key={index.id} value={index.id} className="font-black text-[10px]">
                                        {index.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">DATA HORIZON</Label>
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-8 bg-muted/50 border-border rounded-lg font-black text-xs text-primary text-center"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">LIVE PRICE</Label>
                            <div className="h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-md px-4 border border-white/10 overflow-hidden">
                                <span className="text-xs font-black tabular-nums">{price.toFixed(decimalPlaces)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card rounded-xl p-4 flex flex-col justify-between border border-border relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Radio size={24} className="text-primary" /></div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary mb-2">MARKET BIAS</p>
                        <span className="text-2xl font-black text-foreground tracking-tighter tabular-nums">{globalBias.toFixed(0)}</span>
                    </div>
                    <div className="space-y-1 mt-2">
                        <div className="flex justify-between text-[6px] font-black uppercase tracking-widest text-muted-foreground">
                            <span>BEARISH</span>
                            <span>BULLISH</span>
                        </div>
                        <Progress value={globalBias} className="h-1.5 bg-muted [&>div]:bg-gradient-to-r [&>div]:from-rose-500 [&>div]:via-primary [&>div]:to-emerald-500 shadow-sm" />
                    </div>
                </Card>
            </div>

            <div className="space-y-4 pb-24">
                <div className="flex items-center gap-2 px-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground">ACTIVE SURVEILLANCE</h2>
                </div>

                <DigitFrequencyCircles 
                    ticks={lastDigitTicks} 
                    selectedDigit={selectedDigit}
                    onDigitSelect={setSelectedDigit}
                    selectedMarket={selectedMarket}
                />

                <div className="px-1">
                    <TacticalHeatMap ticks={lastDigitTicks} />
                </div>
            </div>
        </div>
    )
}
