
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Orbit, Fingerprint, Network, Cpu, Layers, Crosshair, ArrowRight } from 'lucide-react';

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
                    "flex flex-col items-center relative cursor-pointer transition-all duration-500 p-2 sm:p-6 group",
                    isSelected 
                        ? "bg-primary/20 rounded-[2rem] sm:rounded-[4rem] ring-[16px] ring-primary/80 scale-110 z-20 shadow-[0_0_80px_rgba(var(--primary),0.8)]" 
                        : "hover:scale-105"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-24 h-24 sm:w-64 sm:h-64 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="42%"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-white/5"
                        />
                        <circle
                            cx="50%"
                            cy="50%"
                            r="42%"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray="100 100" 
                            strokeDashoffset={100 - percentage}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-out", isSelected ? "text-primary drop-shadow-[0_0_35px_rgba(var(--primary),1)]" : colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn(
                            "text-6xl sm:text-[11rem] font-black leading-none tracking-tighter transition-all duration-500 drop-shadow-2xl",
                            isSelected ? "text-white scale-110" : "text-foreground"
                        )}>{digit}</span>
                        <span className="text-[16px] sm:text-[32px] font-black text-cyan-400 mt-2 uppercase tracking-[0.2em] drop-shadow-[0_4px_15px_rgba(0,0,0,1)]">
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute top-0 right-0">
                        <div className="h-8 w-8 sm:h-16 sm:w-16 rounded-full bg-cyan-400 animate-ping shadow-[0_0_40px_cyan] absolute" />
                        <div className="h-8 w-8 sm:h-16 sm:w-16 rounded-full bg-cyan-400 shadow-[0_0_30px_cyan] relative" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] sm:rounded-[4rem] border border-white/5">
            <div className="px-6 sm:px-16 pt-6 sm:pt-16">
                <div className="flex items-center gap-2 sm:gap-6 bg-black/60 px-6 sm:px-10 py-3 sm:py-4 rounded-full text-[12px] sm:text-[14px] text-muted-foreground font-black border border-white/10 uppercase tracking-[0.2em] w-fit shadow-xl">
                    <Orbit className="h-5 w-5 sm:h-7 sm:w-7 text-cyan-400" />
                    <span>SAMPLE: {ticks.length} • {marketName}</span>
                </div>
            </div>
             <CardHeader className="pb-4 sm:pb-12 pt-6 sm:pt-14 text-center px-6 sm:px-16">
                <CardTitle className="text-xs sm:text-2xl font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 text-primary">
                    GLOBAL FREQUENCY ORBIT
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-20">
                <div className="space-y-6 sm:space-y-16">
                    <div className="grid grid-cols-5 gap-3 sm:gap-12 border-b border-white/5 pb-6 sm:pb-16">
                        {digitData.slice(0, 5).map((data) => (
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
                    <div className="grid grid-cols-5 gap-3 sm:gap-12 pt-4">
                        {digitData.slice(5, 10).map((data) => (
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
    const nexusAnalysis = React.useMemo(() => {
        const followingDigits = Array(10).fill(0);
        const chain3Data: Record<string, number> = {};
        let totalFollowers = 0;
        
        const chronoTicks = [...ticks].reverse();
        
        for (let i = 0; i < chronoTicks.length - 2; i++) {
            if (chronoTicks[i] === digit) {
                followingDigits[chronoTicks[i+1]]++;
                totalFollowers++;
                const chain = `${chronoTicks[i+1]}→${chronoTicks[i+2]}`;
                chain3Data[chain] = (chain3Data[chain] || 0) + 1;
            }
        }

        const total = totalFollowers || 1;
        const results = followingDigits.map((count, index) => ({
            digit: index,
            count,
            probability: (count / total) * 100
        })).sort((a, b) => b.probability - a.probability);

        const chains = Object.entries(chain3Data)
            .map(([chain, count]) => ({ chain, count, probability: (count / total) * 100 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

        return {
            results,
            chains,
            hottestNext: results[0],
            totalFound: totalFollowers,
        };
    }, [digit, ticks]);

    return (
        <div className="mt-8 sm:mt-20 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Card className="border-none bg-slate-950/90 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden relative rounded-[2.5rem] sm:rounded-[4rem] border border-white/5">
                <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-cyan-500 via-primary to-emerald-500 shadow-[0_0_30px_rgba(var(--primary),0.5)]" />
                <CardHeader className="pb-6 sm:pb-12 pt-8 sm:pt-16 px-6 sm:px-20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-10 text-center sm:text-left">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[2rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.4)]">
                                <Network className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                                    DIGIT {digit} NEXUS
                                </CardTitle>
                                <CardDescription className="text-primary/70 font-black uppercase tracking-[0.5em] text-[10px] sm:text-[12px] mt-4">PREDICTIVE INTELLIGENCE</CardDescription>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-8 sm:px-12 py-6 rounded-[2rem] flex items-center gap-8 shadow-2xl">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">SEQUENCES</p>
                                <p className="text-xl sm:text-3xl font-black text-white tabular-nums">{nexusAnalysis.totalFound}</p>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">SYNC</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
                                    <p className="text-xl sm:text-3xl font-black text-emerald-400 tabular-nums uppercase">LIVE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-6 sm:px-20 pb-16 space-y-12">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        <div className="space-y-8 p-8 rounded-[3rem] bg-black/60 border border-white/10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/40" />
                            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                    <Cpu className="h-6 w-6 text-emerald-400" /> SUCCESSION
                                </h4>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-4 py-1 text-[10px] font-black uppercase">AFFINITY</Badge>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-4">
                                {nexusAnalysis.results.slice(0, 5).map((res, idx) => (
                                    <div key={res.digit} className={cn(
                                        "p-4 rounded-[1.5rem] border transition-all duration-500 text-center",
                                        idx === 0 ? "bg-emerald-500/20 border-emerald-500/50 scale-110 z-10 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 border-white/5"
                                    )}>
                                        <p className={cn("text-xl sm:text-2xl font-black mb-1", idx === 0 ? "text-white" : "text-foreground/80")}>{res.digit}</p>
                                        <p className={cn("text-[10px] sm:text-[12px] font-black tabular-nums", idx === 0 ? "text-emerald-400" : "text-muted-foreground/40")}>{res.probability.toFixed(0)}%</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8 p-8 rounded-[3rem] bg-black/60 border border-white/10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-2 h-full bg-cyan-500/40" />
                            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                <h4 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                    <Layers className="h-6 w-6 text-cyan-400" /> 3-DIGIT CHAINS
                                </h4>
                                <Badge className="bg-cyan-500/10 text-cyan-400 border-none px-4 py-1 text-[10px] font-black uppercase">RECURSION</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {nexusAnalysis.chains.map((chain, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-[1.5rem] border border-white/10 shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <span className="text-primary font-black text-sm sm:text-xl">{digit}</span>
                                            <ArrowRight className="h-4 w-4 text-white/30" />
                                            <span className="text-white font-black text-base sm:text-2xl">{chain.chain}</span>
                                        </div>
                                        <span className="text-sm sm:text-lg font-black text-emerald-400 tabular-nums">{chain.probability.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-10 rounded-[3rem] sm:rounded-[4rem] bg-slate-900/80 border border-white/10 text-center shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h4 className="text-[12px] sm:text-[14px] font-black uppercase tracking-[0.6em] text-primary mb-6 flex items-center justify-center gap-4">
                            <Crosshair className="h-6 w-6" /> PREDICTION
                        </h4>
                        <p className="text-base sm:text-2xl font-medium text-white/90 leading-relaxed italic max-w-4xl mx-auto drop-shadow-md">
                            "Neural nexus identifies <span className="text-emerald-400 font-black px-3 py-1 bg-emerald-500/10 rounded-xl">Digit {nexusAnalysis.hottestNext.digit}</span> as the high-affinity successor."
                        </p>
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
        <div className="space-y-8 sm:space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-32">
            <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl overflow-hidden relative rounded-[2.5rem] sm:rounded-[4rem] border border-white/5">
                <CardContent className="p-6 sm:p-16 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                    <div className="space-y-4">
                        <Label className="text-[12px] sm:text-[14px] font-black uppercase tracking-[0.4em] text-primary ml-3">MARKET VECTOR</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-14 sm:h-20 bg-black/60 border-white/10 rounded-2xl sm:rounded-[2rem] font-black text-sm sm:text-2xl px-6 sm:px-12 shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)]">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={12} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[2rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 px-8 font-black text-xs sm:text-lg">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4 text-center">
                        <Label className="text-[12px] sm:text-[14px] font-black uppercase tracking-[0.4em] text-primary ml-3">LIVE PIVOT</Label>
                        <div className="h-14 sm:h-20 bg-gradient-to-br from-primary to-blue-800 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
                             <span className="text-xl sm:text-4xl font-black tabular-nums text-white drop-shadow-2xl">
                                {price.toFixed(decimalPlaces)}
                             </span>
                        </div>
                    </div>
                    <div className="space-y-4 text-center">
                        <Label className="text-[12px] sm:text-[14px] font-black uppercase tracking-[0.4em] text-primary ml-3">TICKS ANALYZED</Label>
                        <div className="h-14 sm:h-20 bg-black/60 border-white/10 rounded-2xl sm:rounded-[2rem] flex items-center justify-center font-black text-xl sm:text-4xl text-primary shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)] border border-primary/20">
                            {lastDigitTicks.length}
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
