'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, Zap, Activity, Layers, ShieldAlert, Gauge, RefreshCw, Hash, Target, History } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DigitFrequencyCircles } from './correlation-view';
import { Progress } from '@/components/ui/progress';

interface InsightViewProps {
    price: number;
    decimalPlaces: number;
    lastDigitTicks: number[];
    priceHistory: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    maxTicks: number;
}

export function InsightView({ price, decimalPlaces, lastDigitTicks, priceHistory, selectedMarket, onMarketChange, maxTicks }: InsightViewProps) {
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    const marketName = React.useMemo(() => {
        return syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;
    }, [selectedMarket]);

    const repAnalysis = React.useMemo(() => {
        if (lastDigitTicks.length < 50) return null;

        const ticks = [...lastDigitTicks];
        const total = ticks.length;
        
        // Step 1: Normalize & Compute Concentration Index (CI)
        const counts = Array(10).fill(0);
        ticks.forEach(d => counts[d]++);
        const P = counts.map(c => (c / total) * 100);
        const CI = P.reduce((sum, p) => sum + Math.pow(p - 10, 2), 0);

        // Step 2: Dominant Digits (P[i] > 10)
        const dominantDigits = P.map((p, i) => p > 10 ? i : null).filter(d => d !== null) as number[];

        // Step 3: Measure Repetition Pressure (RP)
        let repeatCount = 0;
        for (let i = 0; i < ticks.length - 1; i++) {
            if (ticks[i] === ticks[i + 1]) repeatCount++;
        }
        const RP = (repeatCount / (total - 1)); // Ratio of repeats

        // Thresholds for high/low
        const CI_THRESHOLD_HIGH = 18; // Sensible threshold for high concentration
        const CI_THRESHOLD_LOW = 10;
        const RP_THRESHOLD_HIGH = 0.12; // >12% immediate repeats is high
        const RP_THRESHOLD_LOW = 0.08;

        const isCIHigh = CI > CI_THRESHOLD_HIGH;
        const isCILow = CI < CI_THRESHOLD_LOW;
        const isRPHigh = RP > RP_THRESHOLD_HIGH;
        const isRPLow = RP < RP_THRESHOLD_LOW;

        // Step 4: Direction Decision
        let tradeType: 'MATCHES' | 'DIFFERS' | 'NO TRADE' = 'NO TRADE';
        if (isCIHigh && isRPHigh) tradeType = 'MATCHES';
        else if (isCILow && isRPLow) tradeType = 'DIFFERS';

        // Step 5: Entry Digit Selection
        const lastDigit = ticks[0];
        let entryCondition = '';
        let canExecute = false;

        if (tradeType === 'MATCHES') {
            const isDominant = P[lastDigit] > 10 && dominantDigits.includes(lastDigit);
            const inRecent = ticks.slice(1, 15).includes(lastDigit);
            if (isDominant && inRecent) {
                entryCondition = `LAST DIGIT ${lastDigit}`;
                canExecute = true;
            } else {
                entryCondition = 'AWAITING DOMINANT REPEAT';
            }
        } else if (tradeType === 'DIFFERS') {
            const isWeak = P[lastDigit] < 10 && !dominantDigits.includes(lastDigit);
            if (isWeak) {
                entryCondition = `LAST DIGIT ${lastDigit}`;
                canExecute = true;
            } else {
                entryCondition = 'AWAITING WEAK DIGIT';
            }
        }

        // Step 6: Stability Filter
        const extremeDominant = P.some(p => p > 12.5);
        const tooFlat = CI < 5;
        let stabilityStatus = 'STABLE';
        if (extremeDominant) {
            tradeType = 'NO TRADE';
            stabilityStatus = 'ERRATIC SPIKES';
        } else if (tooFlat) {
            tradeType = 'NO TRADE';
            stabilityStatus = 'NO EDGE (FLAT)';
        }

        return {
            CI,
            RP,
            tradeType,
            entryCondition,
            canExecute,
            stabilityStatus,
            explanation: tradeType === 'NO TRADE' 
                ? `System paused: ${stabilityStatus}. CI [${CI.toFixed(1)}] vs RP [${(RP * 100).toFixed(1)}%] mismatch.`
                : `${tradeType} protocol active. Concentration [${CI.toFixed(1)}] and Repetition behavior [${(RP * 100).toFixed(1)}%] in sync.`
        };
    }, [lastDigitTicks]);

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-24 max-w-[1600px] mx-auto">
             <Card className="border-none shadow-sm bg-card overflow-hidden relative rounded-xl border border-border">
                <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">MARKET</Label>
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
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">HORIZON</Label>
                        <div className="h-8 bg-muted/50 border-border rounded-lg flex items-center justify-center font-black text-xs text-primary shadow-inner">
                            {maxTicks} <span className="text-[6px] opacity-40 ml-1 tracking-widest uppercase">TICKS</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground">MATCHES/DIFFERS REPETITION MODEL</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <DigitFrequencyCircles 
                        ticks={lastDigitTicks} 
                        selectedDigit={selectedDigit}
                        onDigitSelect={setSelectedDigit}
                        selectedMarket={selectedMarket}
                    />

                    {!repAnalysis ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-muted/10 rounded-[2rem] border border-dashed border-border gap-4 opacity-40">
                             <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" />
                             <p className="text-[10px] font-black uppercase tracking-[0.4em]">ACCUMULATING TICK STREAM (MIN 50)</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <Card className="p-5 rounded-[1.5rem] bg-card border border-border shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Layers className="h-3 w-3" /> CONCENTRATION (CI)
                                    </h4>
                                    <Badge variant="outline" className="text-[8px] font-black border-none bg-primary/10 text-primary uppercase">
                                        {repAnalysis.CI > 15 ? 'HIGH' : 'LOW'}
                                    </Badge>
                                </div>
                                <div className="text-center py-2">
                                    <p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{repAnalysis.CI.toFixed(1)}</p>
                                    <p className="text-[6px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">CI INDEX</p>
                                </div>
                                <Progress value={Math.min(100, (repAnalysis.CI / 40) * 100)} className="h-1.5 bg-muted [&>div]:bg-primary" />
                            </Card>

                            <Card className="p-5 rounded-[1.5rem] bg-card border border-border shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-[8px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                        <History className="h-3 w-3" /> PRESSURE (RP)
                                    </h4>
                                    <Badge variant="outline" className="text-[8px] font-black border-none bg-emerald-500/10 text-emerald-600 uppercase">
                                        {repAnalysis.RP > 0.1 ? 'ACTIVE' : 'STAGNANT'}
                                    </Badge>
                                </div>
                                <div className="text-center py-2">
                                    <p className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{(repAnalysis.RP * 100).toFixed(1)}%</p>
                                    <p className="text-[6px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">REPEAT RATE</p>
                                </div>
                                <Progress value={Math.min(100, repAnalysis.RP * 400)} className="h-1.5 bg-muted [&>div]:bg-emerald-500" />
                            </Card>

                            <Card className={cn(
                                "p-5 rounded-[1.5rem] border shadow-md flex flex-col justify-between transition-all duration-500",
                                repAnalysis.tradeType === 'NO TRADE' ? "bg-muted/30 border-border" : 
                                repAnalysis.canExecute ? "bg-primary/5 border-primary shadow-primary/10" : "bg-card border-border"
                            )}>
                                <div className="flex justify-between items-start">
                                    <h4 className={cn(
                                        "text-[8px] font-black uppercase tracking-widest flex items-center gap-2",
                                        repAnalysis.tradeType === 'NO TRADE' ? "text-muted-foreground" : "text-primary"
                                    )}>
                                        <Target className="h-3 w-3" /> TACTICAL LOCK
                                    </h4>
                                    {repAnalysis.canExecute && (
                                        <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                                    )}
                                </div>
                                
                                <div className="text-center py-2">
                                    <p className={cn(
                                        "text-xl sm:text-2xl font-black tracking-tighter uppercase leading-none",
                                        repAnalysis.tradeType === 'NO TRADE' ? "text-muted-foreground/30" : "text-foreground"
                                    )}>
                                        {repAnalysis.tradeType === 'NO TRADE' ? 'STANDBY' : repAnalysis.tradeType}
                                    </p>
                                    <p className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.2em] mt-2",
                                        repAnalysis.canExecute ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {repAnalysis.entryCondition}
                                    </p>
                                </div>

                                <div className="flex justify-center">
                                     <Badge className={cn(
                                         "text-[7px] font-black uppercase tracking-widest px-3 border-none",
                                         repAnalysis.canExecute ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                     )}>
                                         {repAnalysis.canExecute ? 'TRADE NOW' : 'WAITING FOR GATE'}
                                     </Badge>
                                </div>
                            </Card>
                        </div>
                    )}

                    {repAnalysis && (
                        <HackerAnimation title={`REPETITION INTELLIGENCE`}>
                            <div className="text-left space-y-4 animate-in fade-in duration-700">
                                <div className={cn(
                                    "p-4 rounded-xl border shadow-inner",
                                    repAnalysis.tradeType === 'NO TRADE' ? "bg-rose-500/5 border-rose-500/10" : "bg-emerald-500/5 border-emerald-500/10"
                                )}>
                                    <div className="flex items-center gap-3 mb-2">
                                        {repAnalysis.tradeType === 'NO TRADE' ? (
                                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                                        ) : (
                                            <Zap className="h-4 w-4 text-emerald-500" />
                                        )}
                                        <p className="font-black text-[9px] uppercase tracking-widest">
                                            {repAnalysis.tradeType === 'NO TRADE' ? 'PROTOCOL SUSPENDED' : 'PROTOCOL ACTIVE'}
                                        </p>
                                    </div>
                                    <p className="text-[10px] sm:text-[12px] font-medium text-foreground leading-relaxed italic">
                                        "{repAnalysis.explanation}"
                                    </p>
                                </div>
                            </div>
                        </HackerAnimation>
                    )}
                </div>
            </div>
        </div>
    );
}
