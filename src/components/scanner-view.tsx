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
import { Activity, Radio, TrendingUp, TrendingDown, Target, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
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
        const mapped = counts.map((count, index) => ({ digit: index, count, percentage: (count / total) * 100 }));
        const sorted = [...mapped].sort((a, b) => b.percentage - a.percentage);
        return { highers: sorted.slice(0, 4), lowers: [...sorted].reverse().slice(0, 4) };
    }, [ticks]);

    const GreenLevels = ["bg-emerald-500 text-white", "bg-emerald-400 text-white", "bg-emerald-300 text-emerald-900", "bg-emerald-100 dark:bg-emerald-900"];
    const RedLevels = ["bg-rose-500 text-white", "bg-rose-400 text-white", "bg-rose-300 text-rose-900", "bg-rose-100 dark:bg-rose-900"];

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
                            <motion.div key={item.digit} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("h-16 sm:h-24 rounded-2xl flex flex-col items-center justify-center border transition-all", GreenLevels[idx], isLive ? "ring-2 ring-primary ring-offset-2 z-20 shadow-lg" : "")}>
                                <span className={cn("text-xl sm:text-3xl font-black tabular-nums leading-none mb-0.5", isLive ? "scale-110" : "")}>{item.digit}</span>
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
                            <motion.div key={item.digit} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn("h-16 sm:h-24 rounded-2xl flex flex-col items-center justify-center border transition-all", RedLevels[idx], isLive ? "ring-2 ring-primary ring-offset-2 z-20 shadow-lg" : "")}>
                                <span className={cn("text-xl sm:text-3xl font-black tabular-nums leading-none mb-0.5", isLive ? "scale-110" : "")}>{item.digit}</span>
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
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                <Card className="xl:col-span-3 border-none shadow-sm bg-card overflow-hidden relative rounded-xl border border-border">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">MARKET</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-8 bg-muted/50 border-border rounded-lg font-black text-[10px] px-4">
                                    <SelectValue placeholder="Select Index" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    {syntheticIndices.map((index) => (
                                    <SelectItem key={index.id} value={index.id} className="font-black text-[10px]">{index.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">TICKS</Label>
                            <Input type="number" min="1" max="1000" value={maxTicks === 0 ? '' : maxTicks} onChange={handleMaxTicksChange} onBlur={handleMaxTicksBlur} className="h-8 bg-muted/50 border-border rounded-lg font-black text-xs text-primary text-center" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">PRICE</Label>
                            <div className="h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-md px-4 overflow-hidden">
                                <span className="text-xs font-black tabular-nums">{price.toFixed(decimalPlaces)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-card rounded-xl p-4 flex flex-col justify-center border border-border relative overflow-hidden">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary mb-2">SAMPLE SIZE</p>
                    <span className="text-2xl font-black text-foreground tabular-nums">{lastDigitTicks.length}</span>
                </Card>
            </div>
            <div className="space-y-4 pb-24">
                <div className="flex items-center gap-2 px-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground">ANALYSIS</h2>
                </div>
                <DigitFrequencyCircles ticks={lastDigitTicks} selectedDigit={null} onDigitSelect={() => {}} selectedMarket={selectedMarket} />
                <div className="px-1"><TacticalHeatMap ticks={lastDigitTicks} /></div>
            </div>
        </div>
    )
}
