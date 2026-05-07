'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Network, Cpu, Layers, ArrowRight, Triangle } from 'lucide-react';

interface CorrelationViewProps {
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    lastDigitTicks: number[];
    price: number;
    decimalPlaces: number;
}

export const DigitFrequencyCircles = ({ 
    ticks, 
    selectedDigit, 
    onDigitSelect,
    selectedMarket
}: { 
    ticks: number[], 
    selectedDigit: number | null, 
    onDigitSelect: (d: number) => void,
    selectedMarket: string
}) => {
    const marketName = React.useMemo(() => {
        const found = syntheticIndices.find(m => m.id === selectedMarket);
        return found ? found.name : selectedMarket;
    }, [selectedMarket]);

    const { digitData, lastDigit } = React.useMemo(() => {
        const counts = Array(10).fill(0);
        ticks.forEach(d => { if (d >= 0 && d <= 9) counts[d]++; });
        const total = ticks.length || 1;
        const mapped = counts.map((count, index) => ({ index, count, percentage: (count / total) * 100 }));
        const sorted = [...mapped].sort((a, b) => b.count - a.count);
        return {
            digitData: mapped.map(item => {
                let colorClass = "text-muted-foreground"; 
                if (total > 50) {
                    if (item.count === sorted[0].count) colorClass = "text-[#2dd4bf]";
                    else if (item.count === sorted[sorted.length - 1].count) colorClass = "text-[#ea580c]";
                }
                return { ...item, colorClass };
            }),
            lastDigit: ticks.length > 0 ? ticks[0] : null
        };
    }, [ticks]);

    const DigitCircle = ({ digit, percentage, colorClass, isLast, isSelected }: { 
        digit: number, percentage: number, colorClass: string, isLast: boolean, isSelected: boolean 
    }) => {
        return (
            <div className="flex flex-col items-center relative cursor-pointer group transition-all" onClick={() => onDigitSelect(digit)}>
                <div className={cn("relative w-16 h-16 sm:w-20 md:w-24 rounded-full flex items-center justify-center border-2", isSelected ? "bg-muted/50 border-primary scale-110" : "bg-card border-transparent")}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/20" />
                        <circle cx="50%" cy="50%" r="42%" stroke={isSelected ? "hsl(var(--primary))" : "currentColor"} strokeWidth="8" fill="transparent" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - percentage} strokeLinecap="round" className={cn("transition-all duration-1000", isSelected ? "" : colorClass)} />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10 leading-none">
                        <span className={cn("text-xl sm:text-2xl font-black", isSelected ? "text-primary" : "text-foreground")}>{digit}</span>
                        <span className={cn("text-[8px] sm:text-[10px] font-bold mt-0.5", isSelected ? "text-primary/60" : "text-muted-foreground")}>{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                <div className="h-4 mt-1">{isLast && <Triangle className="w-2.5 h-2.5 fill-muted-foreground text-muted-foreground" />}</div>
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-sm bg-card rounded-2xl border border-border">
            <div className="px-6 sm:px-12 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-muted px-5 py-2 rounded-full text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                    <span>SAMPLE: {ticks.length}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{marketName.toUpperCase()}</span>
                </div>
                <h2 className="text-sm font-black uppercase tracking-[0.4em] text-foreground">FREQUENCY</h2>
            </div>
            <CardContent className="p-6 sm:p-10">
                <div className="space-y-8 sm:space-y-12">
                    <div className="grid grid-cols-5 gap-3 sm:gap-6">{digitData.slice(0, 5).map((data) => (<DigitCircle key={data.index} digit={data.index} percentage={data.percentage} colorClass={data.colorClass} isLast={lastDigit === data.index} isSelected={selectedDigit === data.index} />))}</div>
                    <div className="grid grid-cols-5 gap-3 sm:gap-6">{digitData.slice(5, 10).map((data) => (<DigitCircle key={data.index} digit={data.index} percentage={data.percentage} colorClass={data.colorClass} isLast={lastDigit === data.index} isSelected={selectedDigit === data.index} />))}</div>
                </div>
            </CardContent>
        </Card>
    );
};
