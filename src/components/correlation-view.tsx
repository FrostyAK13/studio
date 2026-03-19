'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface CorrelationViewProps {
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    lastDigitTicks: number[];
}

const DigitFrequencyCircles = ({ ticks }: { ticks: number[] }) => {
    const { digitData, lastDigit } = React.useMemo(() => {
        const counts = Array(10).fill(0);
        ticks.forEach(d => counts[d]++);
        const total = ticks.length || 1;
        
        const mapped = counts.map((count, index) => ({
            index,
            count,
            percentage: (count / total) * 100
        }));

        const sorted = [...mapped].sort((a, b) => b.count - a.count);

        return {
            digitData: mapped.map(item => {
                const rank = sorted.findIndex(s => s.index === item.index);
                let colorClass = "text-muted-foreground/40";
                
                if (rank === 0) colorClass = "text-green-500"; // Most
                else if (rank === 1) colorClass = "text-blue-500"; // 2nd Most
                else if (rank === 8) colorClass = "text-orange-500"; // 2nd Lowest
                else if (rank === 9) colorClass = "text-red-500"; // Lowest

                return { ...item, colorClass };
            }),
            lastDigit: ticks.length > 0 ? ticks[0] : null
        };
    }, [ticks]);

    const DigitCircle = ({ digit, percentage, colorClass, isLast }: { digit: number, percentage: number, colorClass: string, isLast: boolean }) => {
        const radius = 26;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (Math.min(percentage, 20) / 20) * circumference;

        return (
            <div className="flex flex-col items-center relative py-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-muted-foreground/10"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-in-out", colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className="text-xl font-black leading-tight">{digit}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute -bottom-1 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[10px] border-b-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
             <CardHeader className="pb-2 text-center">
                <CardTitle className="text-base font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Real-Time Digit Ranks
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-2 border-b border-white/5 pb-4">
                        {digitData.slice(0, 5).map((data) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 pt-4">
                        {digitData.slice(5, 10).map((data) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export function CorrelationView({
    selectedMarket,
    onMarketChange,
    lastDigitTicks,
}: CorrelationViewProps) {
    return (
        <div className="space-y-6">
            <Card className="border-none shadow-sm">
                <CardContent className="p-6">
                    <Label htmlFor="correlation-market-select" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Synthetic Market</Label>
                    <Select value={selectedMarket} onValueChange={onMarketChange}>
                        <SelectTrigger id="correlation-market-select" className="mt-2 h-12 text-lg font-semibold bg-background/50 border-none shadow-inner">
                            <SelectValue placeholder="Select Index" />
                        </SelectTrigger>
                        <SelectContent>
                            {syntheticIndices.map((index) => (
                            <SelectItem key={index.id} value={index.id}>
                                {index.name}
                            </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <DigitFrequencyCircles ticks={lastDigitTicks} />
        </div>
    );
}
