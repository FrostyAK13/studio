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
import { Hash, Activity, Flame, BarChartHorizontal } from 'lucide-react';
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
        let bgClass = "bg-card";
        let rating = "STABLE";

        if (zScore > 2) {
            colorClass = "text-rose-600";
            bgClass = "bg-rose-50 dark:bg-rose-950/20";
            rating = "SATURATED";
        } else if (zScore < -2) {
            colorClass = "text-cyan-600";
            bgClass = "bg-cyan-50 dark:bg-cyan-950/20";
            rating = "DUE";
        } else if (freq > 11.5) {
            colorClass = "text-orange-600";
            bgClass = "bg-orange-50 dark:bg-orange-950/20";
            rating = "TRENDING";
        }

        return { freq, tsl, colorClass, bgClass, rating, zScore };
    }, [digit, ticks]);

    return (
        <div 
            onClick={() => onSelect(digit)}
            className={cn(
                "relative group cursor-pointer transition-all duration-300 rounded-xl border p-2 flex flex-col justify-between h-20 sm:h-32 overflow-hidden",
                stats.bgClass,
                isSelected ? "ring-1 ring-primary scale-105 z-20" : "hover:bg-muted/30"
            )}
        >
            <div className="flex justify-between items-start relative z-10">
                <span className={cn(
                    "text-lg sm:text-2xl font-black transition-all",
                    isSelected ? "text-primary" : stats.colorClass
                )}>
                    {digit}
                </span>
                <div className="text-right">
                    <Badge variant="outline" className={cn(
                        "text-[5px] sm:text-[7px] font-black tracking-widest px-1 py-0 border-none uppercase",
                        stats.colorClass
                    )}>
                        {stats.rating}
                    </Badge>
                    <p className={cn("text-[8px] sm:text-base font-black tabular-nums mt-0.5", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <p className="text-[5px] sm:text-[7px] font-black text-muted-foreground uppercase tracking-widest opacity-60">GAP</p>
                    <p className="text-xs sm:text-xl font-black text-foreground tabular-nums leading-none mt-0.5">
                        {stats.tsl}
                    </p>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-muted">
                <div 
                    className={cn("h-full transition-all duration-700", stats.colorClass.replace('text-', 'bg-'))} 
                    style={{ width: `${Math.min(stats.freq * 6, 100)}%` }} 
                />
            </div>
        </div>
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

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-24">
            <Card className="border-none shadow-sm bg-card rounded-xl border border-border">
                <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1">
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
                    <div className="space-y-1">
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
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Flame className="h-3 w-3 text-rose-600" />
                    <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground">STATISTICAL Z-CORE MATRIX</h3>
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
