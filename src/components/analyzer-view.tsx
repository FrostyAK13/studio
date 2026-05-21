'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Crosshair, Activity, Info, ShieldCheck, Zap, Cpu, Terminal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
                <span className="text-6xl sm:text-8xl icy-gold-text">{mainPart}</span>
                <span className="text-7xl sm:text-9xl text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.7)] ml-1">{lastDigit}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-full border border-white/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white opacity-90">LIVE TICK FEED</span>
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
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> {guide.title}
            </h4>
            <p className="text-[9px] font-medium text-white leading-relaxed italic border-l-2 border-white/30 pl-3">
                "{guide.logic}"
            </p>
            <div className="bg-primary/40 p-2 rounded-lg border border-white/20">
                <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" /> PRO TIP
                </p>
                <p className="text-[9px] font-bold text-white/90">{guide.tip}</p>
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

    const analysis = React.useMemo(() => {
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

        const delta = Math.abs(val1 - val2);
        const confidence = Math.max(val1, val2);
        const safetyIndex = Math.min(100, (delta * 1.5) + (confidence * 0.5));
        const isStable = safetyIndex > 85;

        // Neural Prompt Logic
        const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;
        const bestDirection = val1 >= val2 ? label1 : label2;
        const trigger = lastDigitTicks[0];
        const exactPrompt = `PROMPT EXECUTION: LOAD 100+1 ACCURACY VECTOR FOR ${marketName.toUpperCase()}. TRIGGER ON DIGIT ${trigger}. INITIALIZE ${bestDirection} ENTRY WITH ${confidence.toFixed(1)}% CONFIDENCE. STATUS: ${isStable ? 'STABLE FLOW' : 'RECOVERY MODE'}.`;

        return {
            val1, val2, label1, label2, delta, confidence, safetyIndex, isStable, exactPrompt,
            summary: `${label1} [${val1.toFixed(1)}%] VS ${label2} [${val2.toFixed(1)}%]`
        };
    }, [lastDigitTicks, priceHistory, selectedDigit, tradeType, selectedMarket]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            <HeroPrice price={price} decimalPlaces={decimalPlaces} />
            
            <Card className="border-none shadow-sm bg-card rounded-xl border border-white/30">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] white-header-text ml-2">MARKET</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-11 bg-black/10 border-white/20 rounded-xl font-black text-xs px-5 text-white">
                                <SelectValue placeholder="Select Market" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/20 text-foreground rounded-xl">
                                {syntheticIndices.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="font-bold text-xs py-2">{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.4em] white-header-text">TACTICAL</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-primary/30 text-white">
                                        <Info className="h-3 w-3" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-primary border-white/30 shadow-2xl rounded-2xl p-4">
                                    <CheatSheet type={tradeType} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Select value={tradeType} onValueChange={setTradeType}>
                            <SelectTrigger className="h-11 bg-black/10 border-white/20 rounded-xl font-black text-xs px-5 text-white">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/20 text-foreground rounded-xl">
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

            <Card className="border-none bg-card rounded-2xl border border-white/40 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-white opacity-40" />
                <CardContent className="p-6 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                                    <Terminal className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black white-header-text tracking-[0.4em] uppercase leading-none">NEURAL TACTICAL PROMPT</h3>
                                    <p className="text-[7px] font-bold icy-gold-text uppercase tracking-widest mt-2">100+1 ACCURACY PROTOCOL</p>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-black/20 rounded-2xl border border-white/10 font-mono shadow-inner">
                                <p className="text-[11px] sm:text-[13px] text-white leading-relaxed italic">
                                    "{analysis.exactPrompt}"
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end px-1">
                                        <p className="text-[9px] font-black uppercase white-header-text tracking-widest">{analysis.label1}</p>
                                        <p className="text-sm font-black icy-gold-text tabular-nums">{analysis.val1.toFixed(1)}%</p>
                                    </div>
                                    <Progress value={analysis.val1} className="h-2.5 bg-black/20 [&>div]:bg-emerald-400 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end px-1">
                                        <p className="text-[9px] font-black uppercase white-header-text tracking-widest">{analysis.label2}</p>
                                        <p className="text-sm font-black icy-gold-text tabular-nums">{analysis.val2.toFixed(1)}%</p>
                                    </div>
                                    <Progress value={analysis.val2} className="h-2.5 bg-black/20 [&>div]:bg-rose-400 rounded-full" />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-black/20 p-6 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center text-center">
                                <p className="text-[8px] font-black white-header-text uppercase tracking-[0.5em] mb-2 opacity-60">STABILITY INDEX</p>
                                <span className="text-4xl font-black icy-gold-text tabular-nums tracking-tighter">{analysis.confidence.toFixed(1)}%</span>
                                <div className="mt-4 flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", analysis.isStable ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-rose-400")} />
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{analysis.isStable ? 'LOCKED' : 'DRIFTING'}</span>
                                </div>
                            </div>
                            <div className="bg-black/20 p-6 rounded-[2rem] border border-white/10 flex flex-col items-center justify-center text-center">
                                <p className="text-[8px] font-black white-header-text uppercase tracking-[0.5em] mb-2 opacity-60">PRICE DELTA</p>
                                <span className="text-2xl font-black icy-gold-text tabular-nums tracking-tighter">±{analysis.delta.toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-black/20 border border-white/20 p-8 rounded-2xl overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_12px_white]" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] white-header-text">ACTIVE VECTOR SEQUENCE</h3>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-2 bg-black/30 rounded-full border border-white/20">
                         <Cpu className="h-3.5 w-3.5 text-white animate-spin" />
                         <span className="text-[10px] font-black uppercase text-white tracking-widest">NEURAL SYNC ON</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                    {[...lastDigitTicks.slice(0, 15)].reverse().map((digit, i) => {
                        const isTrigger = i === 14; // Last digit
                        return (
                            <motion.div 
                                key={i} 
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                className={cn(
                                    "w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-sm sm:text-xl border transition-all",
                                    isTrigger 
                                        ? "bg-white border-white text-primary scale-110 z-10 shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                                        : "bg-black/20 border-white/10 text-white opacity-60 hover:opacity-100"
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
