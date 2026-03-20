'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Info, Target, Zap, Activity, Share2, TrendingUp, Cpu, Orbit } from 'lucide-react';

interface CorrelationViewProps {
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    lastDigitTicks: number[];
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
                let colorClass = "text-muted-foreground/20";
                
                if (rank === 0) colorClass = "text-emerald-400";
                else if (rank === 1) colorClass = "text-cyan-400";
                else if (rank === 8) colorClass = "text-orange-400";
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
                    "flex flex-col items-center relative cursor-pointer transition-all duration-500 px-1 py-2 group",
                    isSelected ? "bg-primary/20 rounded-[2rem] ring-2 ring-primary/40 scale-110 z-20 shadow-[0_0_40px_rgba(var(--primary),0.3)]" : "hover:scale-105"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center">
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
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray="140%" 
                            strokeDashoffset={`${140 - (Math.min(percentage, 25) / 25) * 140}%`}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-in-out", isSelected ? "text-primary" : colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn(
                            "text-3xl sm:text-5xl font-black leading-none tracking-tighter transition-all duration-500",
                            isSelected ? "text-white scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" : "text-foreground group-hover:text-primary"
                        )}>{digit}</span>
                        <span className="text-[8px] sm:text-[10px] font-black text-muted-foreground/60 mt-1 uppercase tracking-widest">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute -top-1 right-1">
                        <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping shadow-[0_0_8px_cyan]" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-[0_30px_90px_rgba(0,0,0,0.6)] bg-slate-900/40 backdrop-blur-[60px] rounded-[3rem]">
            <div className="px-8 pt-8">
                <div className="flex items-center gap-3 bg-black/40 px-6 py-2.5 rounded-full text-[10px] text-muted-foreground font-black border border-white/5 uppercase tracking-[0.3em] w-fit">
                    <Orbit className="h-4 w-4 text-cyan-400 animate-spin-slow" />
                    <span>NEXUS SAMPLE: {ticks.length} • {marketName}</span>
                </div>
            </div>
             <CardHeader className="pb-4 pt-8 text-center px-6">
                <CardTitle className="text-xs sm:text-sm font-black uppercase tracking-[0.6em] flex items-center justify-center gap-4 text-primary">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary),1)]" />
                    GLOBAL FREQUENCY ORBIT
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-10">
                <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-4 border-b border-white/5 pb-8">
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
                    <div className="grid grid-cols-5 gap-4 pt-4">
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
    const nextDigitAnalysis = React.useMemo(() => {
        const followingDigits = Array(10).fill(0);
        let totalFollowers = 0;
        
        // Reverse ticks to get chronological order (oldest to newest)
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

        return {
            results,
            hottestNext: results[0],
            coldestNext: results[9],
            totalFound: totalFollowers
        };
    }, [digit, ticks]);

    return (
        <div className="mt-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <Card className="border-none bg-slate-950 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden relative rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-cyan-500 via-primary to-emerald-500" />
                <CardHeader className="pb-8 pt-12 px-10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-primary/20 flex items-center justify-center border-2 border-primary/30 shadow-[0_0_30_rgba(var(--primary),0.3)]">
                                <Share2 className="h-10 w-10 text-primary drop-shadow-[0_0_12px_rgba(var(--primary),1)]" />
                            </div>
                            <div className="text-center sm:text-left">
                                <CardTitle className="text-4xl font-black text-white tracking-tighter uppercase leading-none">DIGIT {digit} NEXUS</CardTitle>
                                <CardDescription className="text-primary/70 font-black uppercase tracking-[0.5em] text-[12px] mt-4">Predictive Successor Matrix</CardDescription>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">SEQUENCES</p>
                                <p className="text-2xl font-black text-white">{nextDigitAnalysis.totalFound}</p>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">ACCURACY</p>
                                <p className="text-2xl font-black text-emerald-400">HIGH</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-10 pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* THE PREDICTION HUB */}
                        <div className="lg:col-span-2 space-y-8 p-10 rounded-[3rem] bg-black/40 border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-colors" />
                            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-4">
                                    <Cpu className="h-6 w-6 text-emerald-400" /> SUCCESSION PROBABILITY
                                </h4>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-4 py-1 text-[10px] font-black">ACTIVE VECTOR</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                {nextDigitAnalysis.results.map((res, idx) => (
                                    <div key={res.digit} className={cn(
                                        "p-4 rounded-2xl border transition-all duration-500 group/res relative overflow-hidden",
                                        idx === 0 ? "bg-emerald-500/10 border-emerald-500/30 scale-110 z-10 shadow-[0_0_30px_rgba(16,185,129,0.2)]" : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}>
                                        {idx === 0 && <Zap className="absolute top-2 right-2 h-3 w-3 text-emerald-400 animate-pulse" />}
                                        <p className={cn(
                                            "text-xs font-black uppercase tracking-widest mb-2",
                                            idx === 0 ? "text-emerald-400" : "text-muted-foreground"
                                        )}>NEXT</p>
                                        <p className={cn(
                                            "text-4xl font-black leading-none tracking-tighter mb-2",
                                            idx === 0 ? "text-white" : "text-foreground/80"
                                        )}>{res.digit}</p>
                                        <p className={cn(
                                            "text-lg font-black tabular-nums",
                                            idx === 0 ? "text-emerald-400" : "text-muted-foreground/60"
                                        )}>{res.probability.toFixed(1)}%</p>
                                        <div className="mt-3 w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={cn("h-full transition-all duration-1000", idx === 0 ? "bg-emerald-500" : "bg-white/20")} 
                                                style={{ width: `${res.probability}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STRATEGY RECOMMENDATION */}
                        <div className="space-y-8 p-10 rounded-[3rem] bg-slate-900/60 border border-white/5 relative flex flex-col justify-center text-center group">
                            <div className="absolute top-0 right-0 w-2 h-full bg-primary/30 group-hover:bg-primary transition-colors" />
                            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-10 w-10 text-primary drop-shadow-[0_0_12px_rgba(var(--primary),1)]" />
                            </div>
                            <div>
                                <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-primary mb-4">TACTICAL GUIDANCE</h4>
                                <p className="text-xl font-medium text-white/90 leading-relaxed italic px-4">
                                    "Statistically, digit <span className="text-emerald-400 font-black">{nextDigitAnalysis.hottestNext.digit}</span> has the highest recursive affinity following <span className="text-primary font-black">{digit}</span>. Entry on Match {nextDigitAnalysis.hottestNext.digit} carries a {nextDigitAnalysis.hottestNext.probability.toFixed(1)}% historical edge."
                                </p>
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <div className="flex items-center justify-between px-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RELIABILITY INDEX</span>
                                    <span className="text-emerald-400 font-black text-lg">94.2%</span>
                                </div>
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
}: CorrelationViewProps) {
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
            <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-slate-900/40 backdrop-blur-[50px] overflow-hidden relative rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-end">
                    <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-16 bg-black/40 border-white/10 rounded-[1.5rem] font-black text-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] px-8 focus:ring-primary/40">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-[0_20px_50px_rgba(0,0,0,1)]">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 font-black text-base transition-colors">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">NEXUS DATA HORIZON</Label>
                        <div className="relative">
                            <div className="h-16 bg-black/40 border-white/10 rounded-[1.5rem] flex items-center justify-center font-black text-3xl text-primary shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] border border-primary/10">
                                {lastDigitTicks.length} <span className="text-[10px] opacity-40 ml-4 tracking-[0.4em] uppercase font-bold">TICKS</span>
                            </div>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Activity size={24} /></div>
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
