
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Info, Target, Zap, Activity, Share2, TrendingUp, Cpu, Orbit, ArrowUpRight, ArrowDownLeft, Fingerprint, Network, Sparkles, Crosshair, ArrowRight, ZapOff, Radio, Box, Layers } from 'lucide-react';

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
                        ? "bg-primary/20 rounded-[2.5rem] sm:rounded-[4rem] ring-[10px] ring-primary/80 scale-110 z-20 shadow-[0_0_60px_rgba(var(--primary),0.6)]" 
                        : "hover:scale-105"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-20 h-20 sm:w-40 sm:h-40 flex items-center justify-center">
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
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="100 100" 
                            strokeDashoffset={100 - percentage}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-out", isSelected ? "text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.8)]" : colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn(
                            "text-4xl sm:text-8xl font-black leading-none tracking-tighter transition-all duration-500",
                            isSelected ? "text-white scale-125 drop-shadow-[0_0_20px_white]" : "text-foreground"
                        )}>{digit}</span>
                        <span className="text-[12px] sm:text-[24px] font-black text-cyan-400 mt-2 uppercase tracking-widest drop-shadow-[0_4px_8px_rgba(0,0,0,1)]">
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute top-0 right-0">
                        <div className="h-6 w-6 sm:h-10 sm:w-10 rounded-full bg-cyan-400 animate-ping shadow-[0_0_30px_cyan] absolute" />
                        <div className="h-6 w-6 sm:h-10 sm:w-10 rounded-full bg-cyan-400 shadow-[0_0_20px_cyan] relative" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] sm:rounded-[5rem] border border-white/5">
            <div className="px-6 sm:px-16 pt-6 sm:pt-16">
                <div className="flex items-center gap-2 sm:gap-6 bg-black/60 px-6 sm:px-10 py-3 sm:py-4 rounded-full text-[12px] sm:text-[14px] text-muted-foreground font-black border border-white/10 uppercase tracking-[0.2em] w-fit shadow-xl">
                    <Orbit className="h-5 w-5 sm:h-7 sm:w-7 text-cyan-400" />
                    <span>SAMPLE: {ticks.length} • {marketName}</span>
                </div>
            </div>
             <CardHeader className="pb-4 sm:pb-12 pt-6 sm:pt-14 text-center px-6 sm:px-16">
                <CardTitle className="text-xs sm:text-2xl font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 text-primary">
                    <div className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_20px_rgba(var(--primary),1)]" />
                    GLOBAL FREQUENCY ORBIT
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-20">
                <div className="space-y-6 sm:space-y-16">
                    <div className="grid grid-cols-5 gap-3 sm:gap-12 border-b border-white/5 pb-6 sm:pb-16">
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
                    <div className="grid grid-cols-5 gap-3 sm:gap-12 pt-4">
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
    const nexusAnalysis = React.useMemo(() => {
        const followingDigits = Array(10).fill(0);
        const chain3Data: Record<string, number> = {};
        let totalFollowers = 0;
        
        const chronoTicks = [...ticks].reverse();
        
        for (let i = 0; i < chronoTicks.length - 2; i++) {
            if (chronoTicks[i] === digit) {
                // 2-Digit Next
                followingDigits[chronoTicks[i+1]]++;
                totalFollowers++;

                // 3-Digit Sequence Chain
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
            <Card className="border-none bg-slate-950/90 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden relative rounded-[2.5rem] sm:rounded-[5rem] border border-white/5">
                <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-cyan-500 via-primary to-emerald-500 shadow-[0_0_30px_rgba(var(--primary),0.5)]" />
                <CardHeader className="pb-6 sm:pb-16 pt-8 sm:pt-20 px-6 sm:px-20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-10 sm:gap-16">
                        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 text-center sm:text-left">
                            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-[2rem] sm:rounded-[3rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.4)]">
                                <Network className="h-10 w-10 sm:h-16 sm:w-16 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none flex items-center justify-center sm:justify-start gap-6">
                                    DIGIT {digit} NEXUS <Fingerprint className="h-8 w-8 sm:h-14 sm:w-14 text-primary opacity-40" />
                                </CardTitle>
                                <CardDescription className="text-primary/70 font-black uppercase tracking-[0.5em] text-[12px] sm:text-[14px] mt-4">PREDICTIVE INTELLIGENCE MATRIX</CardDescription>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-8 sm:px-16 py-6 sm:py-8 rounded-[2.5rem] flex items-center gap-10 sm:gap-14 shadow-2xl w-full lg:w-auto justify-center">
                            <div className="text-center">
                                <p className="text-[11px] sm:text-[13px] font-black text-muted-foreground uppercase tracking-widest mb-3">SEQUENCES</p>
                                <p className="text-2xl sm:text-4xl font-black text-white tabular-nums">{nexusAnalysis.totalFound}</p>
                            </div>
                            <div className="w-px h-14 sm:h-20 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[11px] sm:text-[13px] font-black text-muted-foreground uppercase tracking-widest mb-3">STATUS</p>
                                <div className="flex items-center gap-3 justify-center">
                                    <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_#10b981]" />
                                    <p className="text-2xl sm:text-4xl font-black text-emerald-400 tabular-nums uppercase">SYNC</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-6 sm:px-20 pb-16 sm:pb-24 space-y-16">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                        <div className="space-y-10 p-10 rounded-[4rem] bg-black/60 border border-white/10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 left-0 w-3 h-full bg-emerald-500/40" />
                            <div className="flex items-center justify-between border-b border-white/10 pb-8">
                                <h4 className="text-[12px] sm:text-[15px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-4">
                                    <Cpu className="h-8 w-8 text-emerald-400" /> SUCCESSION GATES
                                </h4>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-6 py-2 text-[11px] font-black uppercase">AFFINITY</Badge>
                            </div>
                            
                            <div className="grid grid-cols-5 gap-6">
                                {nexusAnalysis.results.slice(0, 5).map((res, idx) => (
                                    <div key={res.digit} className={cn(
                                        "p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden text-center",
                                        idx === 0 ? "bg-emerald-500/20 border-emerald-500/50 scale-110 z-10 shadow-[0_0_30px_rgba(16,185,129,0.3)]" : "bg-white/5 border-white/5"
                                    )}>
                                        <p className={cn("text-2xl sm:text-3xl font-black mb-2", idx === 0 ? "text-white" : "text-foreground/80")}>{res.digit}</p>
                                        <p className={cn("text-[12px] sm:text-[14px] font-black tabular-nums", idx === 0 ? "text-emerald-400" : "text-muted-foreground/40")}>{res.probability.toFixed(0)}%</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-10 p-10 rounded-[4rem] bg-black/60 border border-white/10 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-3 h-full bg-cyan-500/40" />
                            <div className="flex items-center justify-between border-b border-white/10 pb-8">
                                <h4 className="text-[12px] sm:text-[15px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-4">
                                    <Layers className="h-8 w-8 text-cyan-400" /> 3-DIGIT CHAINS
                                </h4>
                                <Badge className="bg-cyan-500/10 text-cyan-400 border-none px-6 py-2 text-[11px] font-black uppercase">RECURSION</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-8">
                                {nexusAnalysis.chains.map((chain, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/10 transition-all hover:bg-white/10 shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <span className="text-primary font-black text-lg sm:text-2xl">{digit}</span>
                                            <ArrowRight className="h-6 w-6 text-white/30" />
                                            <span className="text-white font-black text-xl sm:text-3xl">{chain.chain}</span>
                                        </div>
                                        <span className="text-base sm:text-xl font-black text-emerald-400 tabular-nums">{chain.probability.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-10 sm:p-16 rounded-[4rem] sm:rounded-[5rem] bg-slate-900/80 border border-white/10 text-center shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h4 className="text-[14px] sm:text-[16px] font-black uppercase tracking-[0.6em] text-primary mb-8 flex items-center justify-center gap-6">
                            <Crosshair className="h-8 w-8" /> TACTICAL PREDICTION ENGINE
                        </h4>
                        <p className="text-lg sm:text-3xl font-medium text-white/90 leading-relaxed italic max-w-5xl mx-auto drop-shadow-md">
                            "Neural nexus identifies <span className="text-emerald-400 font-black px-4 py-2 bg-emerald-500/10 rounded-2xl">Digit {nexusAnalysis.hottestNext.digit}</span> as the high-affinity successor. 3-Digit chain scan suggests recursive cycle towards <span className="text-cyan-400 font-black px-4 py-2 bg-cyan-500/10 rounded-2xl">{nexusAnalysis.chains[0]?.chain || '...'}</span>."
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
        <div className="space-y-8 sm:space-y-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-32">
            <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl overflow-hidden relative rounded-[2.5rem] sm:rounded-[5rem] border border-white/5">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
                <CardContent className="p-6 sm:p-20 grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-20 items-center">
                    <div className="space-y-6 sm:space-y-8">
                        <Label className="text-[14px] sm:text-[16px] font-black uppercase tracking-[0.5em] text-primary ml-3">MARKET VECTOR</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-16 sm:h-28 bg-black/60 border-white/10 rounded-[2rem] sm:rounded-[3rem] font-black text-sm sm:text-3xl px-8 sm:px-16 shadow-[inset_0_6px_30px_rgba(0,0,0,0.6)]">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={12} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[2.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-5 px-8 font-black text-xs sm:text-xl">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-6 sm:space-y-8">
                        <Label className="text-[14px] sm:text-[16px] font-black uppercase tracking-[0.5em] text-primary ml-3">LIVE PIVOT</Label>
                        <div className="h-16 sm:h-28 bg-gradient-to-br from-primary to-blue-800 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center shadow-[0_20px_50px_rgba(var(--primary),0.4)] border border-white/10">
                             <span className="text-2xl sm:text-6xl font-black tabular-nums text-white drop-shadow-2xl">
                                {price.toFixed(decimalPlaces)}
                             </span>
                        </div>
                    </div>
                    <div className="space-y-6 sm:space-y-8">
                        <Label className="text-[14px] sm:text-[16px] font-black uppercase tracking-[0.5em] text-primary ml-3">NEXUS HORIZON</Label>
                        <div className="h-16 sm:h-28 bg-black/60 border-white/10 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center font-black text-2xl sm:text-6xl text-primary shadow-[inset_0_6px_30px_rgba(0,0,0,0.6)] border border-primary/20">
                            {lastDigitTicks.length} <span className="text-[12px] sm:text-[16px] opacity-40 ml-6 tracking-[0.3em] uppercase font-black">TICKS</span>
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
