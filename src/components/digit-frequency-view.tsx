'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EvenOddAnalysis } from './even-odd-analysis';
import { Flame, Activity, Binary, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

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
                "relative group cursor-pointer transition-all duration-300 rounded-xl border p-1.5 flex flex-col justify-between h-16 sm:h-24 overflow-hidden",
                stats.bgClass,
                isSelected ? "ring-1 ring-primary scale-105 z-20" : "hover:bg-muted/30"
            )}
        >
            <div className="flex justify-between items-start relative z-10">
                <span className={cn(
                    "text-sm sm:text-xl font-black transition-all",
                    isSelected ? "text-primary" : stats.colorClass
                )}>
                    {digit}
                </span>
                <div className="text-right">
                    <Badge variant="outline" className={cn(
                        "text-[5px] sm:text-[6px] font-black tracking-widest px-1 py-0 border-none uppercase",
                        stats.colorClass
                    )}>
                        {stats.rating}
                    </Badge>
                    <p className={cn("text-[8px] sm:text-[11px] font-black tabular-nums mt-0.5", stats.colorClass)}>
                        {stats.freq.toFixed(1)}%
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <p className="text-[5px] sm:text-[6px] font-black text-muted-foreground uppercase tracking-widest opacity-60">GAP</p>
                    <p className="text-[9px] sm:text-sm font-black text-foreground tabular-nums leading-none mt-0.5">
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

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-24 max-w-[1600px] mx-auto">
            <Card className="border-none shadow-sm bg-card rounded-xl border border-border">
                <CardContent className="p-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="space-y-1">
                        <Label className="text-[7px] font-black uppercase tracking-[0.3em] text-primary ml-1">MARKET</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-7 bg-muted/50 border-border rounded-lg font-black text-[9px] px-3">
                                <SelectValue placeholder="Market" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="font-black text-[9px]">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[7px] font-black uppercase tracking-[0.3em] text-primary ml-1">HORIZON</Label>
                        <Input
                            type="number"
                            min="1"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                            className="h-7 bg-muted/50 border-border rounded-lg font-black text-[9px] text-primary text-center"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[7px] font-black uppercase tracking-[0.3em] text-primary ml-1">LIVE PRICE</Label>
                        <div className="h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-black text-[9px] shadow-sm px-3">
                            {price.toFixed(decimalPlaces)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Flame className="h-3 w-3 text-rose-600" />
                        <h3 className="text-[7px] font-black uppercase tracking-[0.4em] text-foreground">Z-CORE</h3>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-primary">
                                <Info className="h-3 w-3" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-card border-border shadow-2xl rounded-xl p-3">
                            <h4 className="text-[8px] font-black text-primary uppercase tracking-widest mb-2">Z-CORE GUIDE</h4>
                            <p className="text-[8px] font-medium leading-relaxed italic text-muted-foreground">
                                "SATURATED" (Red) indicates high probability of immediate mean-reversion. "DUE" (Cyan) identifies digits that have not appeared in long sequences.
                            </p>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="grid grid-cols-5 gap-1.5 px-1">
                    {Array.from({ length: 10 }, (_, i) => (
                        <DigitHeatCard 
                            key={i} 
                            digit={i} 
                            ticks={lastDigitTicks} 
                            isSelected={selectedDigit === i} 
                            isLatest={lastDigitTicks[0] === i}
                            onSelect={setSelectedDigit} 
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                        <Binary className="h-3 w-3 text-blue-600" />
                        <h3 className="text-[7px] font-black uppercase tracking-[0.4em] text-foreground">PARITY</h3>
                    </div>
                    <EvenOddAnalysis 
                        lastDigitTicks={lastDigitTicks}
                        selectedMarket={selectedMarket}
                        price={price}
                        decimalPlaces={decimalPlaces}
                    />
                </div>
            </div>
        </div>
    );
}