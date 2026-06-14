'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { DigitFrequencyCircles } from './correlation-view';

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
            <div className="mt-4 flex items-center gap-2 bg-muted/30 px-5 py-1.5 rounded-full border border-primary/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">LIVE FEED</span>
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
                return 'bg-gray-400 border-gray-500 text-white';
            case 'even-odd':
                return digit % 2 === 0 
                    ? 'bg-emerald-500 border-emerald-600 text-white'
                    : 'bg-rose-500 border-rose-600 text-white';
            case 'matches-differs':
                return digit === selectedDigit 
                    ? 'bg-emerald-500 border-emerald-600 text-white'
                    : 'bg-rose-500 border-rose-600 text-white';
            case 'rise-fall':
                if (prevDigit === null) return 'bg-gray-400 border-gray-500 text-white';
                if (digit > prevDigit) return 'bg-emerald-500 border-emerald-600 text-white';
                if (digit < prevDigit) return 'bg-rose-500 border-rose-600 text-white';
                return 'bg-gray-400 border-gray-500 text-white';
            default:
                return 'bg-muted border-muted text-muted-foreground';
        }
    };

    const sequence = [...lastDigitTicks.slice(0, 15)].reverse();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            <HeroPrice price={price} decimalPlaces={decimalPlaces} />
            
            <Card className="shadow-sm bg-card rounded-3xl border border-primary/5">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 ml-2">MARKET</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-11 bg-muted/50 border-primary/5 rounded-2xl font-black text-xs px-5">
                                <SelectValue placeholder="Select Market" />
                            </SelectTrigger>
                            <SelectContent className="bg-card text-foreground rounded-2xl border shadow-xl">
                                {syntheticIndices.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="font-bold text-xs py-2">{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">TYPE</Label>
                        </div>
                        <Select value={tradeType} onValueChange={setTradeType}>
                            <SelectTrigger className="h-11 bg-muted/50 border-primary/5 rounded-2xl font-black text-xs px-5">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-card text-foreground rounded-2xl border shadow-xl">
                                <SelectItem value="over-under" className="font-bold text-xs py-2">OVER/UNDER</SelectItem>
                                <SelectItem value="even-odd" className="font-bold text-xs py-2">EVEN/ODD</SelectItem>
                                <SelectItem value="matches-differs" className="font-bold text-xs py-2">MATCHES/DIFFERS</SelectItem>
                                <SelectItem value="rise-fall" className="font-bold text-xs py-2">RISE/FALL</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <DigitFrequencyCircles ticks={lastDigitTicks} selectedMarket={selectedMarket} selectedDigit={selectedDigit} onDigitSelect={setSelectedDigit} />

            <Card className="shadow-sm bg-muted/5 border-primary/5 p-8 rounded-[2.5rem] overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(197,160,89,0.5)]" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">ACTIVE SEQUENCE</h3>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-2 bg-card rounded-full border border-primary/5 shadow-sm">
                         <Cpu className="h-3.5 w-3.5 text-primary animate-pulse" />
                         <span className="text-[10px] font-black uppercase text-foreground tracking-widest">REAL-TIME FLOW</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                    {sequence.map((digit, i) => {
                        const isTrigger = i === sequence.length - 1; 
                        const prevDigit = i > 0 ? sequence[i - 1] : null;
                        const colorClasses = getDigitColor(digit, prevDigit);

                        return (
                            <motion.div 
                                key={`${i}-${digit}`} 
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                className={cn(
                                    "w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-sm sm:text-xl border transition-all shadow-sm",
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
