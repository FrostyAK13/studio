'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Crosshair, Zap, Activity, ShieldCheck, Flame, TrendingUp, TrendingDown, Target, Triangle, ShieldAlert, Cpu } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
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
        let signalLabel = "";
        let signalActive = false;
        let signalDirection: 'up' | 'down' | 'neutral' = 'neutral';

        // Advanced Pattern Recognition logic
        switch (tradeType) {
            case 'over-under':
                label1 = `OVER ${selectedDigit}`;
                label2 = `UNDER ${selectedDigit}`;
                val1 = (overCount / total) * 100;
                val2 = (underCount / total) * 100;
                if (val1 > 60) { signalLabel = `OVER ${selectedDigit}`; signalActive = true; signalDirection = 'up'; }
                else if (val2 > 60) { signalLabel = `UNDER ${selectedDigit}`; signalActive = true; signalDirection = 'down'; }
                break;
            case 'even-odd':
                label1 = "EVEN";
                label2 = "ODD";
                val1 = (evenCount / total) * 100;
                val2 = (oddCount / total) * 100;
                if (val1 > 60) { signalLabel = "EVEN"; signalActive = true; signalDirection = 'up'; }
                else if (val2 > 60) { signalLabel = "ODD"; signalActive = true; signalDirection = 'down'; }
                break;
            case 'rise-fall':
                label1 = "RISE";
                label2 = "FALL";
                val1 = (riseCount / rfTotal) * 100;
                val2 = (fallCount / rfTotal) * 100;
                if (val1 > 60) { signalLabel = "RISE"; signalActive = true; signalDirection = 'up'; }
                else if (val2 > 60) { signalLabel = "FALL"; signalActive = true; signalDirection = 'down'; }
                break;
            case 'matches-differs':
                label1 = "MATCHES";
                label2 = "DIFFERS";
                val1 = (matchCount / total) * 100;
                val2 = (differCount / total) * 100;
                if (val2 > 94) { signalLabel = `DIFFERS ${selectedDigit}`; signalActive = true; signalDirection = 'neutral'; }
                break;
        }

        const delta = Math.abs(val1 - val2);
        const confidence = Math.max(val1, val2);
        
        // Safety Index Calculation: Higher Delta + High Confidence = High Safety
        const safetyIndex = Math.min(100, (delta * 1.5) + (confidence * 0.5));
        const isStable = safetyIndex > 85;

        return {
            val1,
            val2,
            label1,
            label2,
            delta,
            signalLabel,
            signalActive: signalActive && isStable,
            signalDirection,
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
                        <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-primary ml-2">MARKET VECTOR</Label>
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
                        <Label className="text-[9px] font-black uppercase tracking-[0.4em] text-primary ml-2">TACTICAL STRATEGY</Label>
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
                <CardContent className="p-6 sm:p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Crosshair className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-foreground tracking-[0.3em] uppercase leading-none">ANALYSIS HUD</h3>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{analysis.summary}</p>
                                </div>
                            </div>
                            <div className="pt-2">
                                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                                    "STABILITY PROTOCOL: Safety index identifies a <span className={cn("font-black px-1.5 py-0.5 rounded-md", analysis.isStable ? "text-emerald-600 bg-emerald-500/10" : "text-amber-600 bg-amber-500/10")}>{analysis.isStable ? "HIGH" : "LOW"}</span> reliability vector for manual engagement."
                                </p>
                            </div>
                        </div>
                        
                        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <p className="text-[12px] font-black uppercase text-emerald-600 tracking-[0.2em]">{analysis.label1}</p>
                                    <p className="text-xl font-black text-emerald-600 tabular-nums leading-none">{analysis.val1.toFixed(1)}%</p>
                                </div>
                                <Progress value={analysis.val1} className="h-4 bg-muted/50 [&>div]:bg-emerald-500 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <p className="text-[12px] font-black uppercase text-rose-600 tracking-[0.2em]">{analysis.label2}</p>
                                    <p className="text-xl font-black text-rose-600 tabular-nums leading-none">{analysis.val2.toFixed(1)}%</p>
                                </div>
                                <Progress value={analysis.val2} className="h-4 bg-muted/50 [&>div]:bg-rose-500 rounded-full" />
                            </div>
                        </div>

                        <div className="lg:col-span-3 flex gap-8 items-center justify-center lg:justify-end bg-muted/30 p-4 rounded-2xl border border-border">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">LIVE PRICE</p>
                                <p className="text-xl font-black text-foreground tabular-nums tracking-tighter leading-none">{price.toFixed(decimalPlaces)}</p>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <div className="text-center">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">DELTA BIAS</p>
                                <p className="text-xl font-black text-emerald-600 tabular-nums tracking-tighter leading-none">{analysis.delta.toFixed(1)}%</p>
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

            <Card className={cn(
                "border-none rounded-[2rem] border overflow-hidden relative transition-all duration-700 shadow-2xl group",
                analysis.signalActive ? "bg-emerald-500 dark:bg-emerald-600 shadow-emerald-500/30 border-emerald-400" : "bg-card border-border"
            )}>
                <CardContent className="p-6 sm:p-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-8">
                            <div className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-700 shadow-inner",
                                analysis.signalActive ? "bg-white/20 text-white animate-pulse" : "bg-muted/50 text-muted-foreground/30"
                            )}>
                                {analysis.signalActive ? <Zap className="h-10 w-10 fill-current" /> : <Activity className="h-10 w-10" />}
                            </div>
                            <div className="space-y-2">
                                <h4 className={cn(
                                    "text-sm font-black uppercase tracking-[0.4em] transition-colors",
                                    analysis.signalActive ? "text-white" : "text-muted-foreground"
                                )}>
                                    {analysis.signalActive ? "SIGNAL DETECTED" : "SCANNING FLOW"}
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-2.5 w-2.5 rounded-full", analysis.signalActive ? "bg-white animate-pulse shadow-[0_0_10px_white]" : "bg-muted-foreground/20")} />
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.3em] transition-colors",
                                        analysis.signalActive ? "text-white/80" : "text-muted-foreground/40"
                                    )}>
                                        {analysis.signalActive ? "ZERO-ERROR GATE LOCKED" : "AWAITING STABILITY THRESHOLD"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {analysis.signalActive ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="flex flex-col items-center md:items-end text-white text-center md:text-right"
                            >
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-3 text-white/60">ENTRY VECTOR</p>
                                <div className="flex items-center gap-4">
                                    {analysis.signalDirection === 'up' && <TrendingUp className="h-8 w-8 text-white" />}
                                    {analysis.signalDirection === 'down' && <TrendingDown className="h-8 w-8 text-white" />}
                                    <span className="text-5xl font-black tracking-tighter uppercase leading-none">{analysis.signalLabel}</span>
                                    <ShieldCheck className="h-10 w-10 text-white" />
                                </div>
                                <div className="mt-4 flex flex-wrap justify-center md:justify-end gap-3">
                                    <div className="flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full border border-white/10">
                                        <Target className="h-4 w-4 text-white" />
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">SAFETY: {analysis.safetyIndex.toFixed(0)}%</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full border border-white/10">
                                        <Cpu className="h-4 w-4 text-white" />
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">CONFIDENCE: {analysis.confidence.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center md:items-end opacity-20 text-center md:text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-3">ENTRY VECTOR</p>
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl font-black tracking-tighter uppercase leading-none">WAITING</span>
                                    <Activity className="h-10 w-10" />
                                </div>
                                <div className="mt-4 flex items-center gap-3 bg-muted px-6 py-2 rounded-full border border-border">
                                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">STABILITY: {analysis.safetyIndex.toFixed(0)}%</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
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

