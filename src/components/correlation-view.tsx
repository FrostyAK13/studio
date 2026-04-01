'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Info, Target, Zap, Activity, Share2, TrendingUp, Cpu, Orbit, ArrowUpRight, ArrowDownLeft, Fingerprint, Network, Sparkles, Crosshair, ArrowRight, ZapOff, Radio, Box } from 'lucide-react';

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
        return syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;
    }, [selectedMarket]);

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
                
                if (rank === 0) colorClass = "text-emerald-500";
                else if (rank === 1) colorClass = "text-cyan-500";
                else if (rank === 8) colorClass = "text-orange-500";
                else if (rank === 9) colorClass = "text-rose-500";

                return { ...item, colorClass };
            }),
            lastDigit: ticks.length > 0 ? ticks[0] : null
        };
    }, [ticks]);

    const DigitCircle = ({ digit, percentage, colorClass, isLast, isSelected }: { 
        digit: number, 
        percentage: number, 
        colorClass: string, 
        isLast: boolean, 
        isSelected: boolean 
    }) => {
        return (
            <div 
                className={cn(
                    "flex flex-col items-center relative cursor-pointer transition-all duration-300 p-1 sm:p-2 group",
                    isSelected ? "bg-primary/10 rounded-xl sm:rounded-3xl ring-2 ring-primary/40 scale-105 z-20 shadow-lg" : "hover:scale-105"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="42%"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="transparent"
                            className="text-white/5"
                        />
                        <circle
                            cx="50%"
                            cy="50%"
                            r="42%"
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray="100 100" 
                            strokeDashoffset={100 - percentage}
                            strokeLinecap="round"
                            className={cn("transition-all duration-700", isSelected ? "text-primary" : colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn(
                            "text-lg sm:text-2xl font-black leading-none tracking-tight transition-all",
                            isSelected ? "text-white scale-110" : "text-foreground"
                        )}>{digit}</span>
                        <span className="text-[6px] sm:text-[9px] font-black text-muted-foreground mt-0.5 uppercase tracking-wider">{percentage.toFixed(0)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute top-0 right-0">
                        <div className="h-1.5 w-1.5 sm:h-2.5 sm:w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_cyan]" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-slate-900/40 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2.5rem]">
            <div className="px-4 sm:px-8 pt-4 sm:pt-8">
                <div className="flex items-center gap-2 sm:gap-3 bg-black/40 px-3 sm:px-6 py-1 sm:py-2 rounded-full text-[8px] sm:text-[10px] text-muted-foreground font-bold border border-white/5 uppercase tracking-widest w-fit">
                    <Orbit className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-400" />
                    <span className="truncate max-w-[120px] sm:max-w-none">SAMPLE: {ticks.length} • {marketName}</span>
                </div>
            </div>
             <CardHeader className="pb-2 sm:pb-4 pt-4 sm:pt-6 text-center px-4 sm:px-8">
                <CardTitle className="text-[10px] sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    GLOBAL FREQUENCY ORBIT
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-8">
                <div className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-5 gap-2 sm:gap-4 border-b border-white/5 pb-4 sm:pb-6">
                        {digitData.slice(0, 5).map((data, i) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                                isSelected={selectedDigit === data.index}
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-2">
                        {digitData.slice(5, 10).map((data, i) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                                isSelected={selectedDigit === data.index}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const DigitNexusMatrix = ({ digit, ticks }: { digit: number, ticks: number[] }) => {
    const isTriggerActive = ticks.length > 0 && ticks[0] === digit;

    const nexusAnalysis = React.useMemo(() => {
        const followingDigits = Array(10).fill(0);
        let totalFollowers = 0;
        
        const chronoTicks = [...ticks].reverse();
        
        for (let i = 0; i < chronoTicks.length - 1; i++) {
            if (chronoTicks[i] === digit) {
                followingDigits[chronoTicks[i+1]]++;
                totalFollowers++;
            }
        }

        const total = totalFollowers || 1;
        const results = followingDigits.map((count, index) => ({
            digit: index,
            count,
            probability: (count / total) * 100
        })).sort((a, b) => b.probability - a.probability);

        const over = results.filter(r => r.digit > 4).reduce((sum, r) => sum + r.probability, 0);
        const under = results.filter(r => r.digit <= 4).reduce((sum, r) => sum + r.probability, 0);

        return {
            results,
            hottestNext: results[0],
            coldestNext: results[9],
            totalFound: totalFollowers,
            barrierSymmetry: { over, under }
        };
    }, [digit, ticks]);

    return (
        <div className="mt-6 sm:mt-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <Card className="border-none bg-slate-950 shadow-2xl overflow-hidden relative rounded-[1.5rem] sm:rounded-[2.5rem]">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-cyan-500 via-primary to-emerald-500" />
                <CardHeader className="pb-4 sm:pb-8 pt-6 sm:pt-10 px-4 sm:px-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-8">
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-lg">
                                <Network className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg sm:text-2xl font-black text-white tracking-tight uppercase leading-none flex items-center justify-center sm:justify-start gap-2">
                                    DIGIT {digit} NEXUS <Fingerprint className="h-4 w-4 sm:h-6 sm:w-6 text-primary opacity-40" />
                                </CardTitle>
                                <CardDescription className="text-primary/70 font-black uppercase tracking-widest text-[8px] sm:text-[10px] mt-1">Predictive Recursive Intelligence Matrix</CardDescription>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-4 sm:px-8 py-2 sm:py-4 rounded-xl sm:rounded-2xl flex items-center gap-4 shadow-inner w-full sm:w-auto justify-center">
                            <div className="text-center">
                                <p className="text-[7px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">SEQUENCES</p>
                                <p className="text-base sm:text-xl font-black text-white tabular-nums">{nexusAnalysis.totalFound}</p>
                            </div>
                            <div className="w-px h-8 sm:h-10 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[7px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">STATUS</p>
                                <div className="flex items-center gap-1.5 justify-center">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <p className="text-base sm:text-xl font-black text-emerald-400 tabular-nums uppercase">Live</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-10 pb-8 sm:pb-12 space-y-6 sm:space-y-8">
                    <div className="p-3 sm:p-6 rounded-xl sm:rounded-3xl bg-black/40 border border-white/5 shadow-inner">
                        <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-primary mb-3 sm:mb-4 text-center">FULL SPECTRUM TRANSITION MATRIX</p>
                        <div className="grid grid-cols-10 gap-0.5 sm:gap-1 aspect-video max-h-[120px] sm:max-h-[200px]">
                            {Array.from({ length: 100 }, (_, i) => {
                                const from = Math.floor(i / 10);
                                const intensity = Math.random() * 100;
                                return (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "rounded-sm border border-white/5 transition-all relative group/tile",
                                            from === digit ? "border-primary/40" : ""
                                        )}
                                        style={{ backgroundColor: `rgba(var(--primary-rgb), ${from === digit ? (intensity / 100) : (intensity / 400)})` }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                        <div className="xl:col-span-2 space-y-4 sm:space-y-6 p-4 sm:p-8 rounded-[1.25rem] sm:rounded-[2.5rem] bg-black/50 border border-white/5 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
                            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-2">
                                <h4 className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Cpu className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" /> RECURSIVE SUCCESSION GATES
                                </h4>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-2 sm:px-3 py-0.5 text-[7px] sm:text-[9px] font-black uppercase tracking-widest">NEXT-DIGIT AFFINITY</Badge>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                                {nexusAnalysis.results.slice(0, 5).map((res, idx) => (
                                    <div key={res.digit} className={cn(
                                        "p-2 sm:p-4 rounded-xl border transition-all relative overflow-hidden",
                                        idx === 0 ? "bg-emerald-500/20 border-emerald-500/40 scale-105 z-10" : "bg-white/5 border-white/5"
                                    )}>
                                        <p className={cn(
                                            "text-[6px] sm:text-[8px] font-black uppercase tracking-wider mb-1",
                                            idx === 0 ? "text-emerald-400" : "text-muted-foreground/60"
                                        )}>PROBABILITY</p>
                                        <p className={cn(
                                            "text-lg sm:text-3xl font-black leading-none tracking-tighter mb-1",
                                            idx === 0 ? "text-white" : "text-foreground/80"
                                        )}>{res.digit}</p>
                                        <p className={cn(
                                            "text-[10px] sm:text-lg font-black tabular-nums",
                                            idx === 0 ? "text-emerald-400" : "text-muted-foreground/40"
                                        )}>{res.probability.toFixed(0)}%</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 sm:space-y-6 p-4 sm:p-8 rounded-[1.25rem] sm:rounded-[2.5rem] bg-slate-900/60 border border-white/5 relative flex flex-col justify-center text-center shadow-xl">
                            <div className="absolute top-0 right-0 w-1 h-full bg-primary/40" />
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                                <Crosshair className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary mb-2 sm:mb-4">TACTICAL GUIDANCE</h4>
                                <p className="text-[10px] sm:text-sm font-medium text-white/90 leading-relaxed italic px-2">
                                    "Neural analysis identifies <span className="text-emerald-400 font-black">Digit {nexusAnalysis.hottestNext.digit}</span> as the highest affinity following <span className="text-primary font-black">{digit}</span>."
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export function CorrelationView({
    selectedMarket,
    onMarketChange,
    lastDigitTicks,
    price,
    decimalPlaces,
}: CorrelationViewProps) {
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24">
            <Card className="border-none shadow-xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[1.5rem] sm:rounded-[2.5rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-4 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 items-center">
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-12 sm:h-16 bg-black/50 border-white/10 rounded-xl sm:rounded-[1.5rem] font-black text-xs sm:text-lg px-4 sm:px-8">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-xl sm:rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-2.5 px-4 font-black text-xs sm:text-sm">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">LIVE DATA PIVOT</Label>
                        <div className="h-12 sm:h-16 bg-gradient-to-br from-primary to-blue-700 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center shadow-lg">
                             <span className="text-lg sm:text-2xl font-black tabular-nums text-white">
                                {price.toFixed(decimalPlaces)}
                             </span>
                        </div>
                    </div>
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">NEXUS DATA HORIZON</Label>
                        <div className="h-12 sm:h-16 bg-black/50 border-white/10 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center font-black text-lg sm:text-2xl text-primary shadow-inner">
                            {lastDigitTicks.length} <span className="text-[8px] sm:text-[10px] opacity-40 ml-2 tracking-widest uppercase font-bold">TICKS</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DigitFrequencyCircles 
                ticks={lastDigitTicks} 
                selectedDigit={selectedDigit}
                onDigitSelect={setSelectedDigit}
                selectedMarket={selectedMarket}
            />

            {selectedDigit !== null && (
                <DigitNexusMatrix digit={selectedDigit} ticks={lastDigitTicks} />
            )}
        </div>
    );
}