
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
        
        const mapped = counts.map((count, index) => {
            let gap = 0;
            for (let i = 0; i < ticks.length; i++) {
                if (ticks[i] === index) break;
                gap++;
            }
            return { index, count, percentage: (count / total) * 100, gap };
        });

        const sorted = [...mapped].sort((a, b) => b.count - a.count);
        
        return {
            digitData: mapped.map(item => {
                let colorClass = "text-muted-foreground"; 
                if (total > 20) {
                    if (item.count === sorted[0].count) colorClass = "text-emerald-600";
                    else if (item.count === sorted[sorted.length - 1].count) colorClass = "text-rose-600";
                }
                return { ...item, colorClass };
            }),
            lastDigit: ticks.length > 0 ? ticks[0] : null
        };
    }, [ticks]);

    const DigitCard = ({ digit, percentage, colorClass, isLast, isSelected, gap }: { 
        digit: number, percentage: number, colorClass: string, isLast: boolean, isSelected: boolean, gap: number 
    }) => {
        return (
            <div 
                onClick={() => onDigitSelect(digit)}
                className={cn(
                    "relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-[1.2rem] border transition-all cursor-pointer group shadow-sm min-h-[100px]",
                    isSelected 
                        ? "bg-foreground text-background border-foreground scale-105 z-10 shadow-xl" 
                        : "bg-card border-primary/20 hover:border-primary/50 hover:bg-muted/30"
                )}
            >
                <span className={cn(
                    "text-xl sm:text-3xl font-black mb-1",
                    isSelected ? "text-background" : "text-foreground"
                )}>
                    {digit}
                </span>
                <span className={cn(
                    "text-[10px] sm:text-[12px] font-black tabular-nums",
                    isSelected ? "text-background/60" : colorClass
                )}>
                    {percentage.toFixed(1)}%
                </span>
                
                {isLast && (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 right-2"
                    >
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.8)]" />
                    </motion.div>
                )}
                
                {isSelected && (
                    <div className="absolute top-2 right-2 flex flex-col items-end opacity-40">
                        <span className="text-[6px] font-black uppercase tracking-widest text-background/50">GAP</span>
                        <span className="text-[8px] font-black text-background leading-none">{gap}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-sm bg-card rounded-[2rem] border border-primary/10">
            <div className="px-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">LAST DIGIT PREDICTION</h2>
                <div className="flex items-center gap-3 bg-muted px-5 py-2 rounded-full text-[10px] text-muted-foreground font-black uppercase tracking-widest border border-primary/10 shadow-sm">
                    <span>SAMPLE: {ticks.length}</span>
                    <span className="w-1 h-1 rounded-full bg-primary/20" />
                    <span>{marketName.toUpperCase()}</span>
                </div>
            </div>
            <CardContent className="p-6 sm:p-10">
                <div className="grid grid-cols-5 gap-3 sm:gap-4">
                    {digitData.map((data) => (
                        <DigitCard 
                            key={data.index} 
                            digit={data.index} 
                            percentage={data.percentage} 
                            colorClass={data.colorClass} 
                            isLast={lastDigit === data.index} 
                            isSelected={selectedDigit === data.index}
                            gap={data.gap}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
