'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RiseFallAnalysis } from './rise-fall-analysis';
import { Hash, Activity, Flame, BarChartHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DigitFrequencyViewProps {
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

const DigitHeatCard = ({ digit, ticks, isSelected, isLatest, onSelect }: { 
    digit: number, 
    ticks: number[], 
    isSelected: boolean, 
    isLatest: boolean,
    onSelect: (d: number) => void 
}) => {
    const stats = React.useMemo(() => {
        const total = ticks.length || 1;
        const matches = ticks.filter(t => t === digit).length;
        const freq = (matches / total) * 100;
        
        const mean = total / 10;
        const variance = total * 0.1 * 0.9;
        const stdDev = Math.sqrt(variance);
        const zScore = (matches - mean) / (stdDev || 1);

        let tsl = 0;
        for (let i = 0; i < ticks.length; i++) {
            if (ticks[i] === digit) break;
            tsl++;
        }

        let colorClass = "text-muted-foreground";
        let glowClass = "";
        let bgClass = "bg-card";
        let rating = "STABLE";

        if (zScore > 2) {
            colorClass = "text-rose-600";
            glowClass = "border-rose-200 dark:border-rose-900 shadow-sm";
            bgClass = "bg-rose-50 dark:bg-rose-950/20";
            rating = "OVER-SATURATED";
        } else if (zScore < -2) {
            colorClass = "text-cyan-600";
            glowClass = "border-cyan-200 dark:border-cyan-900 shadow-sm";
            bgClass = "bg-cyan-50 dark:bg-cyan-950/20";
            rating = "STATISTICALLY DUE";
        } else if (freq > 11.5) {
            colorClass = "text-orange-600";
            glowClass = "border-orange-200 dark:border-orange-900 shadow-sm";
            bgClass = "bg-orange-50 dark:bg-orange-950/20";
            rating = "TRENDING";
        }

        return { freq, tsl, colorClass, glowClass, bgClass, rating, zScore };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-300 rounded-xl border p-2 flex flex-col justify-between h-20 sm:h-36 overflow-hidden",
                stats.bgClass,
                stats.glowClass || "border-border",
                isSelected ? "ring-2 ring-primary scale-105 z-20 shadow-md" : "hover:scale-[1.02]"
            )}
        >
            {isLatest && (
                <div className="absolute inset-0 z-30 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-blue-500/50 rounded-[inherit]" />
                </div>
            )}

            <div className="absolute top-0 right-0 p-1 opacity-10">
                <Hash className={cn("w-5 h-5 sm:w-12 sm:h-12", stats.colorClass)} />
            </div>

            <div className="flex justify-between items-start relative z-10">
                <span className={cn(
                    "text-lg sm:text-3xl font-black tracking-tighter transition-all",
                    isSelected ? "text-primary" : stats.colorClass
                )}>
                    {digit}
                </span>
                <div className="text-right">
                    <Badge variant="outline" className={cn(
                        "text-[5px] sm:text-[7px] font-black tracking-widest px-1 py-0 border-none",
                        stats.colorClass
                    )}>
                        {stats.rating}
                    </Badge>
                    <p className={cn("text-[8px] sm:text-lg font-black tabular-nums tracking-tighter mt-0.5", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <p className="text-[5px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-60">GAP</p>
                    <p className="text-xs sm:text-2xl font-black text-foreground tabular-nums tracking-tighter leading-none mt-0.5">
                        {stats.tsl}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[5px] sm:text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Z-SCORE</p>
                    <p className={cn("text-[7px] sm:text-[10px] font-black", Math.abs(stats.zScore) > 2 ? stats.colorClass : "text-muted-foreground/50")}>
                        {stats.zScore.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-muted overflow-hidden">
                <div 
                    className={cn("h-full transition-all duration-700", stats.colorClass.replace('text-', 'bg-'))} 
                    style={{ width: `${Math.min(stats.freq * 6, 100)}%` }} 
                />
            </div>
        </div>
    );
};

const DigitDetailInsights = ({ digit, ticks }: { digit: number, ticks: number[] }) => {
    const stats = React.useMemo(() => {
        const total = ticks.length || 1;
        const matches = ticks.filter(t => t === digit).length;
        const actualFreq = (matches / total) * 100;
        const over = ticks.filter(t => t > digit).length;
        const under = ticks.filter(t => t < digit).length;
        const ouTotal = (over + under) || 1;

        return {
            actualFreq,
            matches,
            differs: total - matches,
            over: (over / ouTotal) * 100,
            under: (under / ouTotal) * 100,
        };
    }, [digit, ticks]);

    return (
        <Card className="mt-4 border-none bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700 rounded-2xl border border-border">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-primary to-emerald-600" />
            <CardHeader className="pb-3 pt-5 px-4 sm:px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-base sm:text-lg font-black text-foreground tracking-tight uppercase">DIGIT {digit} INTEL</CardTitle>
                        <CardDescription className="text-primary/70 font-black uppercase tracking-widest text-[7px] sm:text-[8px] mt-0.5">Precision Volumetric Matrix</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                <div className="p-3 sm:p-5 rounded-xl bg-muted/30 border border-border space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                        <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Hash className="h-3 w-3 text-emerald-600" /> ACCURACY GATE
                        </h4>
                        <span className="text-sm sm:text-xl font-black text-emerald-600 tabular-nums">{stats.actualFreq.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[6px] sm:text-[8px] font-black uppercase tracking-widest">
                                <span className="text-emerald-600">MATCHES</span>
                                <span className="text-muted-foreground">{stats.matches} TICKS</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-1 sm:h-1.5 bg-muted [&>div]:bg-emerald-500" />
                        </div>
                    </div>
                </div>

                <div className="p-3 sm:p-5 rounded-xl bg-muted/30 border border-border space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                        <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <BarChartHorizontal className="h-3 w-3 text-cyan-600" /> BARRIER SYMMETRY
                        </h4>
                        <span className="text-sm sm:text-xl font-black text-cyan-600 tabular-nums">{stats.over.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[6px] sm:text-[8px] font-black uppercase tracking-widest">
                                <span className="text-cyan-600">OVER {digit} WEIGHT</span>
                                <span className="text-muted-foreground">{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-1 sm:h-1.5 bg-muted [&>div]:bg-cyan-500" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export function DigitFrequencyView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
}: DigitFrequencyViewProps) {
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    const latestDigit = lastDigitTicks.length > 0 ? lastDigitTicks[0] : null;

    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks;
        if (ticks.length < 2) return null;

        const total = ticks.length;
        const evenCount = ticks.filter(d => d % 2 === 0).length;
        const evenPercentage = (evenCount / total) * 100;
        const oddPercentage = 100 - evenPercentage;
        
        const lowerCount = ticks.filter(d => d <= 4).length;
        const lowerPercentage = (lowerCount / total) * 100;
        const higherPercentage = 100 - lowerPercentage;
        
        return {
            evenOdd: { even: evenPercentage, odd: oddPercentage },
            overUnder: { lower: lowerPercentage, higher: higherPercentage }
        };
    }, [lastDigitTicks]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24">
            <Card className="border-none shadow-sm bg-card overflow-hidden relative rounded-xl border border-border">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-10 bg-muted/50 border-border rounded-lg font-black text-[11px] px-4">
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
                        <Label className="text-[9px] font-black uppercase tracking-widest text-primary ml-1">DATA HORIZON</Label>
                        <Input
                            type="number"
                            min="1"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                            className="h-10 bg-muted/50 border-border rounded-lg font-black text-sm text-primary text-center"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-4">
                    <div className="p-1.5 bg-rose-100 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900">
                        <Flame className="h-4 w-4 text-rose-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">STATISTICAL Z-CORE MATRIX</h3>
                        <p className="text-[6px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Statistical Edge & Deviation Analysis</p>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 px-1">
                    {Array.from({ length: 10 }, (_, i) => (
                        <DigitHeatCard 
                            key={i} 
                            digit={i} 
                            ticks={lastDigitTicks} 
                            isSelected={selectedDigit === i} 
                            isLatest={latestDigit === i}
                            onSelect={setSelectedDigit} 
                        />
                    ))}
                </div>
            </div>

            {selectedDigit !== null && (
                <DigitDetailInsights digit={selectedDigit} ticks={lastDigitTicks} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
                {marketDirectionAnalysis && (
                    <>
                        <div className="p-3 rounded-xl bg-card border border-border shadow-sm relative overflow-hidden">
                            <h4 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-3 flex items-center gap-1.5">
                                <Activity className="h-3 w-3 text-chart-1" /> EVEN / ODD GATES
                            </h4>
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[6px] font-black uppercase tracking-widest">
                                        <span className="text-chart-1">EVEN</span>
                                        <span className="text-foreground text-[10px] tabular-nums">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.even} className="h-1 bg-muted [&>div]:bg-chart-1" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[6px] font-black uppercase tracking-widest">
                                        <span className="text-chart-3">ODD</span>
                                        <span className="text-foreground text-[10px] tabular-nums">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.evenOdd.odd} className="h-1 bg-muted [&>div]:bg-chart-3" />
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-card border border-border shadow-sm relative overflow-hidden">
                            <h4 className="text-[8px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-2 mb-3 flex items-center gap-1.5">
                                <BarChartHorizontal className="h-3 w-3 text-accent" /> BARRIER SYMMETRY
                            </h4>
                            <div className="space-y-3 pt-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[6px] font-black uppercase tracking-widest">
                                        <span className="text-accent">UNDER 5</span>
                                        <span className="text-foreground text-[10px] tabular-nums">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.lower} className="h-1 bg-muted [&>div]:bg-accent" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[6px] font-black uppercase tracking-widest">
                                        <span className="text-rose-600">OVER 4</span>
                                        <span className="text-foreground text-[10px] tabular-nums">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={marketDirectionAnalysis.overUnder.higher} className="h-1 bg-muted [&>div]:bg-rose-500" />
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-center text-center">
                            <p className="text-[7px] font-black uppercase text-primary tracking-widest mb-1.5">TECHNICAL HUD FLUX</p>
                            <p className="text-sm font-black text-foreground tabular-nums tracking-tighter leading-none mb-3">
                                {price.toFixed(decimalPlaces)}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 py-1.5 rounded-lg">
                                    <p className="text-[5px] font-black text-emerald-600 uppercase tracking-widest">BULLISH</p>
                                    <p className="text-[10px] font-black text-foreground">{marketDirectionAnalysis.overUnder.higher.toFixed(0)}%</p>
                                </div>
                                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 py-1.5 rounded-lg">
                                    <p className="text-[5px] font-black text-rose-600 uppercase tracking-widest">BEARISH</p>
                                    <p className="text-[10px] font-black text-foreground">{marketDirectionAnalysis.overUnder.lower.toFixed(0)}%</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <RiseFallAnalysis 
                priceHistory={priceHistory}
                selectedMarket={selectedMarket}
                price={price}
                decimalPlaces={decimalPlaces}
                variant="compact"
            />
        </div>
    );
}