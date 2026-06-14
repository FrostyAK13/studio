'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Activity, Info, ShieldCheck, Zap, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { DigitFrequencyCircles } from './correlation-view';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

const HeroPrice = ({ price, decimalPlaces }: { price: number; decimalPlaces: number }) => {
    const priceStr = price.toFixed(decimalPlaces);
    const mainPart = priceStr.slice(0, -1);
    const lastDigit = priceStr.slice(-1);

    return (
        <div className="flex flex-col items-center justify-center py-12 bg-transparent select-none">
            <div className="flex items-baseline font-black tracking-tighter transition-all duration-300">
                <span className="text-6xl sm:text-8xl text-foreground">{mainPart}</span>
                <span className="text-7xl sm:text-9xl icy-gold-text ml-1">{lastDigit}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-muted px-4 py-1.5 rounded-full border">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">LIVE TICK FEED</span>
            </div>
        </div>
    );
};

const CheatSheet = ({ type }: { type: string }) => {
    const guides: Record<string, { title: string, logic: string, tip: string }> = {
        'over-under': {
            title: 'OVER/UNDER',
            logic: 'Monitors barrier saturation. 100+1 logic triggers when a 15%+ frequency skew is detected in specific digit ranges.',
            tip: 'Target Over 2 when Under 2 digits show extreme exhaustion.'
        },
        'even-odd': {
            title: 'EVEN/ODD',
            logic: 'Tracks recursive binary patterns. Probability pivots after 4-5 consecutive streaks of a single parity.',
            tip: 'Wait for 5x Even streak before entering Odd for immediate mean reversion.'
        },
        'matches-differs': {
            title: 'MATCH/DIFF',
            logic: 'Zero-Error protocol focusing on the 90% probability of Differ. Analyzes cold-digit cycles.',
            tip: 'Differ the "Hottest" digit for maximum stability.'
        },
        'rise-fall': {
            title: 'MOMENTUM',
            logic: 'Calculates Rate of Change (ROC) and EMA crossovers in the last 10 ticks.',
            tip: 'Execution is safest during high-flow intervals.'
        }
    };

    const guide = guides[type] || guides['over-under'];

    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-primary" /> {guide.title}
            </h4>
            <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                "{guide.logic}"
            </p>
            <div className="bg-primary/5 p-2 rounded-lg border">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" /> PRO TIP
                </p>
                <p className="text-[9px] font-bold text-foreground/90">{guide.tip}</p>
            </div>
        </div>
    );
};

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

    const getDigitColor = (digit: number, prevDigit: number | null) => {
        switch (tradeType) {
            case 'over-under':
                if (digit > selectedDigit) return 'bg-emerald-500 border-emerald-600 text-white';
                if (digit < selectedDigit) return 'bg-rose-500 border-rose-600 text-white';
                return 'bg-muted border-muted-foreground text-muted-foreground';
            case 'even-odd':
                return digit % 2 === 0 
                    ? 'bg-emerald-500 border-emerald-600 text-white' 
                    : 'bg-rose-500 border-rose-600 text-white';
            case 'matches-differs':
                return digit === selectedDigit 
                    ? 'bg-emerald-500 border-emerald-600 text-white' 
                    : 'bg-rose-500 border-rose-600 text-white';
            case 'rise-fall':
                if (prevDigit === null) return 'bg-muted border-muted-foreground text-muted-foreground';
                return digit > prevDigit 
                    ? 'bg-emerald-500 border-emerald-600 text-white' 
                    : digit < prevDigit 
                        ? 'bg-rose-500 border-rose-600 text-white'
                        : 'bg-muted border-muted-foreground text-muted-foreground';
            default:
                return 'bg-background border-muted text-muted-foreground';
        }
    };

    const vectorSequence = [...lastDigitTicks.slice(0, 15)].reverse();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            <HeroPrice price={price} decimalPlaces={decimalPlaces} />
            
            <Card className="shadow-sm bg-card rounded-xl border">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-2">MARKET</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-11 bg-muted/30 border rounded-xl font-black text-xs px-5">
                                <SelectValue placeholder="Select Market" />
                            </SelectTrigger>
                            <SelectContent className="bg-card text-foreground rounded-xl border shadow-xl">
                                {syntheticIndices.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="font-bold text-xs py-2">{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">TACTICAL</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-muted">
                                        <Info className="h-3 w-3" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-card border shadow-2xl rounded-2xl p-4">
                                    <CheatSheet type={tradeType} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Select value={tradeType} onValueChange={setTradeType}>
                            <SelectTrigger className="h-11 bg-muted/30 border rounded-xl font-black text-xs px-5">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-card text-foreground rounded-xl border shadow-xl">
                                <SelectItem value="over-under" className="font-bold text-xs py-2">OVER/UNDER</SelectItem>
                                <SelectItem value="even-odd" className="font-bold text-xs py-2">EVEN/ODD</SelectItem>
                                <SelectItem value="matches-differs" className="font-bold text-xs py-2">MATCHES/DIFFERS</SelectItem>
                                <SelectItem value="rise-fall" className="font-bold text-xs py-2">RISE/FALL</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <DigitFrequencyCircles ticks={lastDigitTicks} selectedDigit={selectedDigit} onDigitSelect={setSelectedDigit} selectedMarket={selectedMarket} />

            <Card className="shadow-sm bg-muted/10 border p-8 rounded-2xl overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">ACTIVE VECTOR SEQUENCE</h3>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-2 bg-muted rounded-full border">
                         <Cpu className="h-3.5 w-3.5 text-primary animate-spin" />
                         <span className="text-[10px] font-black uppercase text-foreground tracking-widest">TACTICAL SYNC ON</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                    {vectorSequence.map((digit, i) => {
                        const isTrigger = i === vectorSequence.length - 1; 
                        const prevDigit = i > 0 ? vectorSequence[i - 1] : null;
                        const colorClasses = getDigitColor(digit, prevDigit);

                        return (
                            <motion.div 
                                key={`${i}-${digit}`} 
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                className={cn(
                                    "w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-sm sm:text-xl border transition-all",
                                    colorClasses,
                                    isTrigger && "ring-2 ring-primary ring-offset-2 scale-110 z-10 shadow-lg"
                                )}
                            >
                                {digit}
                            </motion.div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}