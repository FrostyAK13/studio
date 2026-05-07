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

const TacticalRecommendation = ({ ticks }: { ticks: number[] }) => {
    const recommendation = React.useMemo(() => {
        if (ticks.length < 50) return { status: 'INSUFFICIENT DATA', type: 'NONE', entry: null, confidence: 0, reasoning: 'Minimum 50 ticks required for high-precision mathematical analysis.' };
        
        // Step 1: Normalize the distribution
        const counts = Array(10).fill(0);
        ticks.forEach(d => counts[d]++);
        const total = ticks.length;
        const P = counts.map(c => (c / total) * 100);
        const D = P.map(p => p - 10);

        // Step 2: Compute weighted directional strength
        // Under 8 (Digits 0-7)
        let under8_score = 0;
        for (let i = 0; i <= 7; i++) under8_score += D[i];
        for (let i = 8; i <= 9; i++) under8_score -= Math.abs(D[i]);

        // Over 1 (Digits 2-9)
        let over1_score = 0;
        for (let i = 2; i <= 9; i++) over1_score += D[i];
        for (let i = 0; i <= 1; i++) over1_score -= Math.abs(D[i]);

        const direction = under8_score > over1_score ? 'Under 8' : 'Over 1';

        // Step 3: Apply stability filter
        const mean = 10;
        const variance = P.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / 10;
        const stdDev = Math.sqrt(variance);
        
        // Moderate spread threshold: 0.5 to 6.0
        if (stdDev < 0.5 || stdDev > 6.0) {
            return { status: 'STABILITY ALERT', type: 'NONE', entry: null, confidence: 0, reasoning: `Distribution variance (${stdDev.toFixed(2)}) is outside moderate stable parameters.` };
        }

        // Step 4: Filter valid entry digits
        let candidates: number[] = [];
        if (direction === 'Under 8') {
            candidates = [0, 1, 2, 3, 4, 5, 6, 7];
        } else {
            candidates = [2, 3, 4, 5, 6, 7, 8, 9];
        }

        // Exclude top 2 highest and bottom 2 lowest percentages
        const sortedWithIndices = P.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
        const top2 = [sortedWithIndices[0].i, sortedWithIndices[1].i];
        const bottom2 = [sortedWithIndices[8].i, sortedWithIndices[9].i];
        
        candidates = candidates.filter(i => !top2.includes(i) && !bottom2.includes(i));

        if (candidates.length === 0) {
            return { status: 'GATES LOCKED', type: 'NONE', entry: null, confidence: 0, reasoning: 'No digits met the scoring criteria after outlier exclusion.' };
        }

        // Step 5: Score remaining digits
        // Score[i]=(10−P[i])×(1−∣D[i+1]−D[i−1]∣)
        // Using wrap-around for neighbor indices
        const scores = candidates.map(i => {
            const nextIdx = (i + 1) % 10;
            const prevIdx = (i + 9) % 10;
            const neighborVariance = Math.abs(D[nextIdx] - D[prevIdx]);
            const score = (10 - P[i]) * (1 - neighborVariance);
            return { digit: i, score };
        });

        // Step 6: Select entry digit
        const best = scores.sort((a, b) => b.score - a.score)[0];
        
        // Final Confidence Calculation (Derived from directional strength and score)
        const rawConfidence = Math.max(under8_score, over1_score);
        const confidence = Math.min(99.9, 50 + rawConfidence + (best.score * 2));

        return {
            status: 'TRADE NOW',
            type: direction,
            entry: best.digit,
            confidence: confidence,
            reasoning: `Selected ${direction} at Digit ${best.digit}. Distribution shows stable zones (StdDev: ${stdDev.toFixed(2)}) with minimal neighbor variance scoring.`
        };
    }, [ticks]);

    return (
        <Card className="border-none shadow-2xl bg-card rounded-[1.5rem] border border-border overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-cyan-400 to-primary opacity-30" />
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                            recommendation.status === 'TRADE NOW' ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-muted border border-border"
                        )}>
                            {recommendation.status === 'TRADE NOW' ? <Zap className="h-6 w-6 text-white animate-pulse" /> : <AlertTriangle className="h-6 w-6 text-muted-foreground/40" />}
                        </div>
                        <div>
                            <h3 className={cn(
                                "text-[10px] font-black uppercase tracking-[0.4em] leading-none mb-2",
                                recommendation.status === 'TRADE NOW' ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                            )}>
                                {recommendation.status}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-xl sm:text-2xl font-black tracking-tighter uppercase",
                                    recommendation.type !== 'NONE' ? "text-foreground" : "text-muted-foreground/30"
                                )}>
                                    {recommendation.type !== 'NONE' ? `${recommendation.type} @ ${recommendation.entry}` : 'AWAITING LOCK'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 max-w-md">
                        <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                           "{recommendation.reasoning}"
                        </p>
                    </div>

                    <div className="flex items-center gap-8 bg-muted/30 px-6 py-3 rounded-2xl border border-border">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">STABILITY</p>
                            <p className={cn(
                                "text-lg font-black tabular-nums leading-none",
                                recommendation.status === 'TRADE NOW' ? "text-emerald-600" : "text-primary"
                            )}>
                                {recommendation.confidence.toFixed(1)}%
                            </p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-center">
                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">100+1</p>
                            <p className="text-lg font-black text-primary leading-none">100+1</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
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
        if (lastDigitTicks.length < 5) return 50;
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
                        <div className="space-y-2">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">HORIZON</Label>
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
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary mb-2">BIAS</p>
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
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground">TACTICAL</h2>
                </div>

                <TacticalRecommendation ticks={lastDigitTicks} />

                <div className="flex items-center gap-2 px-2 mt-8">
                    <Activity className="h-4 w-4 text-primary" />
                    <h2 className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground">SURVEILLANCE</h2>
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