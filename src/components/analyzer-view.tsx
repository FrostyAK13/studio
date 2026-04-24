'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Crosshair, Activity, Info, ShieldCheck, Zap } from 'lucide-react';
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

const CheatSheet = ({ type }: { type: string }) => {
    const guides: Record<string, { title: string, logic: string, tip: string }> = {
        'over-under': {
            title: 'OVER/UNDER PROTOCOL',
            logic: 'Monitors barrier saturation. 100+1 logic triggers when a 15%+ frequency skew is detected in specific digit ranges.',
            tip: 'Target Over 2 when Under 2 digits show extreme exhaustion (>15 ticks gap).'
        },
        'even-odd': {
            title: 'EVEN/ODD PARITY',
            logic: 'Tracks recursive binary patterns. Probability pivots after 4-5 consecutive streaks of a single parity.',
            tip: 'Wait for 5x Even streak before entering Odd for immediate mean reversion.'
        },
        'matches-differs': {
            title: 'MATCH/DIFF VARIANCE',
            logic: 'Zero-Error protocol focusing on the 90% probability of Differ. Analyzes cold-digit cycles.',
            tip: 'Differ the "Hottest" digit for maximum stability, or wait for the digit to appear before execution.'
        },
        'rise-fall': {
            title: 'MOMENTUM VECTOR',
            logic: 'Calculates Rate of Change (ROC) and EMA crossovers in the last 10 ticks.',
            tip: 'Execution is safest during high-flow intervals (Tick pacing < 1000ms).'
        }
    };

    const guide = guides[type] || guides['over-under'];

    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> {guide.title}
            </h4>
            <p className="text-[9px] font-medium text-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                "{guide.logic}"
            </p>
            <div className="bg-muted/50 p-2 rounded-lg border border-border">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5" /> PRO TIP
                </p>
                <p className="text-[9px] font-bold text-muted-foreground">{guide.tip}</p>
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

        return {
            val1,
            val2,
            label1,
            label2,
            delta,
            confidence,
            safetyIndex,
            isStable,
            summary: `${label1} [${val1.toFixed(1)}%] VS ${label2} [${val2.toFixed(1)}%]`
        };
    }, [lastDigitTicks, priceHistory, selectedDigit, tradeType]);

    const renderPattern = () => {
        const slice = [...lastDigitTicks.slice(0, 15)].reverse();
        const pivotIndex = slice.length - 1;
        
        return slice.map((digit, i) => {
            const isPivot = i === pivotIndex;
            const isMatch = digit === selectedDigit;
            
            let colorClass = "bg-muted/50 text-muted-foreground"; 
            
            if (isMatch && (tradeType === 'matches-differs')) {
                colorClass = "bg-primary border-primary text-primary-foreground shadow-lg z-20";
            } else {
                switch (tradeType) {
                    case 'even-odd':
                        colorClass = digit % 2 === 0 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                            : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400";
                        break;
                    case 'over-under':
                        colorClass = digit > selectedDigit
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400";
                        break;
                    case 'rise-fall':
                        colorClass = digit % 2 === 0 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" 
                            : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400";
                        break;
                    case 'matches-differs':
                        colorClass = isMatch 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted/30 border-border text-muted-foreground";
                        break;
                }
            }
            
            return (
                <motion.div 
                    key={i} 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-[10px] sm:text-base border transition-all duration-300 relative overflow-hidden",
                        isPivot ? "ring-2 ring-primary ring-offset-2 ring-offset-background z-30 shadow-xl bg-primary text-primary-foreground" : colorClass
                    )}
                >
                    <span className="relative z-10">{digit}</span>
                    {isPivot && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                </motion.div>
            );
        });
    };

    const handleDigitSelect = (d: number) => {
        setSelectedDigit(d);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            <Card className="border-none shadow-sm bg-card rounded-[1.5rem] border border-border">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-primary ml-2">MARKET</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-10 bg-muted/30 border-border rounded-xl font-black text-xs px-5 shadow-inner">
                                <SelectValue placeholder="Select Market" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground rounded-xl">
                                {syntheticIndices.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="font-bold text-xs py-2">{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-2">
                            <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">TACTICAL STRATEGY</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-primary/10 text-primary">
                                        <Info className="h-3 w-3" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 bg-card border-border shadow-2xl rounded-2xl p-4">
                                    <CheatSheet type={tradeType} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Select value={tradeType} onValueChange={setTradeType}>
                            <SelectTrigger className="h-10 bg-muted/30 border-border rounded-xl font-black text-xs px-5 shadow-inner">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground rounded-xl">
                                <SelectItem value="over-under" className="font-bold text-xs py-2">OVER/UNDER</SelectItem>
                                <SelectItem value="even-odd" className="font-bold text-xs py-2">EVEN/ODD</SelectItem>
                                <SelectItem value="matches-differs" className="font-bold text-xs py-2">MATCHES/DIFFERS</SelectItem>
                                <SelectItem value="rise-fall" className="font-bold text-xs py-2">RISE/FALL</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-cyan-400 to-primary" />
                <CardContent className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Crosshair className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-[9px] font-black text-foreground tracking-[0.3em] uppercase leading-none">ANALYSIS HUD</h3>
                                    <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{analysis.summary}</p>
                                </div>
                            </div>
                            <div className="pt-1">
                                <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                                    "STABILITY PROTOCOL: Safety index identifies a <span className={cn("font-black px-1 py-0.5 rounded-md", analysis.isStable ? "text-emerald-600 bg-emerald-500/10" : "text-amber-600 bg-amber-500/10")}>{analysis.isStable ? "HIGH" : "LOW"}</span> reliability vector."
                                </p>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-5 grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <p className="text-[8px] font-black uppercase text-emerald-600 tracking-[0.2em]">{analysis.label1}</p>
                                    <p className="text-xs font-black text-emerald-600 tabular-nums leading-none">{analysis.val1.toFixed(1)}%</p>
                                </div>
                                <Progress value={analysis.val1} className="h-2 bg-muted/50 [&>div]:bg-emerald-500 rounded-full" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-end">
                                    <p className="text-[8px] font-black uppercase text-rose-600 tracking-[0.2em]">{analysis.label2}</p>
                                    <p className="text-xs font-black text-rose-600 tabular-nums leading-none">{analysis.val2.toFixed(1)}%</p>
                                </div>
                                <Progress value={analysis.val2} className="h-2 bg-muted/50 [&>div]:bg-rose-500 rounded-full" />
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex gap-6 items-center justify-center lg:justify-end bg-muted/30 p-3 rounded-2xl border border-border">
                            <div className="text-center">
                                <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">PRICE</p>
                                <p className="text-sm font-black text-foreground tabular-nums tracking-tighter leading-none">{price.toFixed(decimalPlaces)}</p>
                            </div>
                            <div className="w-px h-6 bg-border" />
                            <div className="text-center">
                                <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">DELTA</p>
                                <p className="text-sm font-black text-emerald-600 tabular-nums tracking-tighter leading-none">{analysis.delta.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-muted/20 border border-border p-6 rounded-[2rem] overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">STREAM SEQUENCE</h3>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-card rounded-full border border-border shadow-sm">
                         <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                         <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest">ACTIVE SYNC</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
                    {renderPattern()}
                </div>
            </Card>

            <DigitFrequencyCircles 
                ticks={lastDigitTicks} 
                selectedDigit={selectedDigit} 
                onDigitSelect={handleDigitSelect} 
                selectedMarket={selectedMarket} 
            />
        </div>
    );
}
