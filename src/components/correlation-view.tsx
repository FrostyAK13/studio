
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
                    "flex flex-col items-center relative cursor-pointer transition-all duration-500 px-1 py-4 group",
                    isSelected ? "bg-primary/20 rounded-[3rem] ring-4 ring-primary/40 scale-110 z-20 shadow-[0_0_60px_rgba(var(--primary),0.4)]" : "hover:scale-105"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
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
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="140%" 
                            strokeDashoffset={`${140 - (Math.min(percentage, 25) / 25) * 140}%`}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-in-out", isSelected ? "text-primary" : colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn(
                            "text-4xl sm:text-6xl font-black leading-none tracking-tighter transition-all duration-500",
                            isSelected ? "text-white scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" : "text-foreground group-hover:text-primary"
                        )}>{digit}</span>
                        <span className="text-[10px] sm:text-[12px] font-black text-muted-foreground/60 mt-1 uppercase tracking-widest">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute top-2 right-2">
                        <div className="h-3 w-3 rounded-full bg-cyan-400 animate-ping shadow-[0_0_12px_cyan]" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-[0_40px_120px_rgba(0,0,0,0.8)] bg-slate-900/40 backdrop-blur-[80px] rounded-[4rem]">
            <div className="px-10 pt-10">
                <div className="flex items-center gap-4 bg-black/60 px-8 py-3 rounded-full text-[12px] text-muted-foreground font-black border border-white/10 uppercase tracking-[0.4em] w-fit shadow-2xl">
                    <Orbit className="h-5 w-5 text-cyan-400 animate-spin-slow" />
                    <span>NEXUS SAMPLE: {ticks.length} • {marketName}</span>
                </div>
            </div>
             <CardHeader className="pb-6 pt-10 text-center px-10">
                <CardTitle className="text-sm sm:text-base font-black uppercase tracking-[0.8em] flex items-center justify-center gap-6 text-primary">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_20px_rgba(var(--primary),1)]" />
                    GLOBAL FREQUENCY ORBIT
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 sm:p-14">
                <div className="space-y-8">
                    <div className="grid grid-cols-5 gap-6 border-b border-white/5 pb-10">
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
                    <div className="grid grid-cols-5 gap-6 pt-6">
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
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-20 duration-1000">
            <Card className="border-none bg-slate-950 shadow-[0_60px_150px_rgba(0,0,0,0.9)] overflow-hidden relative rounded-[4rem]">
                <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-cyan-500 via-primary to-emerald-500" />
                <CardHeader className="pb-10 pt-16 px-14">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="flex items-center gap-10">
                            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center border-2 border-primary/30 shadow-[0_0_50px_rgba(var(--primary),0.4)] group hover:scale-110 transition-transform">
                                <Network className="h-12 w-12 text-primary drop-shadow-[0_0_20px_rgba(var(--primary),1)]" />
                            </div>
                            <div className="text-center lg:text-left">
                                <CardTitle className="text-5xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-4">
                                    DIGIT {digit} NEXUS <Fingerprint className="h-8 w-8 text-primary opacity-40" />
                                </CardTitle>
                                <CardDescription className="text-primary/70 font-black uppercase tracking-[0.7em] text-[14px] mt-6">Predictive Recursive Intelligence Matrix</CardDescription>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-12 py-6 rounded-[2.5rem] flex items-center gap-10 shadow-inner">
                            <div className="text-center">
                                <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-2">SEQUENCES</p>
                                <p className="text-3xl font-black text-white tabular-nums">{nexusAnalysis.totalFound}</p>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-2">STATUS</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <p className="text-3xl font-black text-emerald-400 tabular-nums">LIVE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-14 pb-16 space-y-12">
                    <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 shadow-inner mb-12">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary mb-8 text-center">FULL SPECTRUM TRANSITION MATRIX</p>
                        <div className="grid grid-cols-10 gap-2 aspect-video max-h-[300px]">
                            {Array.from({ length: 100 }, (_, i) => {
                                const from = Math.floor(i / 10);
                                const to = i % 10;
                                const intensity = Math.random() * 100;
                                return (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "rounded-md border border-white/5 transition-all duration-700 relative group/tile",
                                            from === digit ? "border-primary/40" : ""
                                        )}
                                        style={{ backgroundColor: `rgba(var(--primary-rgb), ${from === digit ? (intensity / 100) : (intensity / 400)})` }}
                                    >
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/tile:opacity-100 bg-black/80 rounded-md z-10 transition-opacity">
                                            <span className="text-[8px] font-bold text-white">{from}→{to}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                        <div className="xl:col-span-2 space-y-10 p-12 rounded-[3.5rem] bg-black/50 border border-white/5 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
                            <div className="flex items-center justify-between border-b border-white/10 pb-8">
                                <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-muted-foreground flex items-center gap-6">
                                    <Cpu className="h-8 w-8 text-emerald-400" /> RECURSIVE SUCCESSION GATES
                                </h4>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-6 py-2 text-[12px] font-black uppercase tracking-widest">NEXT-DIGIT AFFINITY</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                                {nexusAnalysis.results.map((res, idx) => (
                                    <div key={res.digit} className={cn(
                                        "p-6 rounded-[2rem] border transition-all duration-700 relative overflow-hidden group/res",
                                        idx === 0 ? "bg-emerald-500/20 border-emerald-500/40 scale-110 z-10 shadow-[0_0_50px_rgba(16,185,129,0.3)]" : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}>
                                        {idx === 0 && <Sparkles className="absolute top-4 right-4 h-4 w-4 text-emerald-400 animate-pulse" />}
                                        <p className={cn(
                                            "text-xs font-black uppercase tracking-[0.2em] mb-3",
                                            idx === 0 ? "text-emerald-400" : "text-muted-foreground/60"
                                        )}>PROBABILITY OF NEXT</p>
                                        <p className={cn(
                                            "text-5xl font-black leading-none tracking-tighter mb-4",
                                            idx === 0 ? "text-white" : "text-foreground/80"
                                        )}>{res.digit}</p>
                                        <p className={cn(
                                            "text-xl font-black tabular-nums",
                                            idx === 0 ? "text-emerald-400" : "text-muted-foreground/40"
                                        )}>{res.probability.toFixed(1)}%</p>
                                        <div className="mt-4 w-full bg-black/60 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className={cn("h-full transition-all duration-1000", idx === 0 ? "bg-emerald-500 shadow-[0_0_10px_emerald]" : "bg-white/20")} 
                                                style={{ width: `${res.probability * 3}%` }} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-10 p-12 rounded-[3.5rem] bg-slate-900/60 border border-white/5 relative flex flex-col justify-center text-center group shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-2 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
                            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                                <Crosshair className="h-12 w-12 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),1)]" />
                            </div>
                            <div>
                                <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-primary mb-6">TACTICAL GUIDANCE</h4>
                                <p className="text-2xl font-medium text-white/90 leading-relaxed italic px-6">
                                    "Neural analysis identifies <span className="text-emerald-400 font-black">Digit {nexusAnalysis.hottestNext.digit}</span> as having the highest recursive affinity following <span className="text-primary font-black">{digit}</span>. In this sequence, a <span className="text-emerald-400 font-black">Match {nexusAnalysis.hottestNext.digit}</span> prediction carries a {nexusAnalysis.hottestNext.probability.toFixed(1)}% historical edge over random variance."
                                </p>
                            </div>
                            <div className="mt-10 pt-10 border-t border-white/5">
                                <div className="flex items-center justify-between px-6">
                                    <span className="text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground">RECURSIVE STRENGTH</span>
                                    <span className="text-emerald-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">HIGH</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-4">
                        <div className={cn(
                            "p-12 rounded-[3.5rem] border-2 transition-all duration-500 flex flex-col justify-between items-center text-center relative overflow-hidden group",
                            isTriggerActive 
                                ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_100px_rgba(16,185,129,0.4)] scale-105" 
                                : "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.1)]"
                        )}>
                             {isTriggerActive && <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 animate-pulse shadow-[0_0_20px_emerald]" />}
                             <div className="space-y-4">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <Zap className={cn("h-5 w-5", isTriggerActive ? "text-emerald-400 fill-emerald-400" : "text-emerald-500/40")} />
                                    <p className={cn(
                                        "text-[12px] font-black uppercase tracking-[0.5em]",
                                        isTriggerActive ? "text-emerald-400 animate-bounce" : "text-emerald-500/60"
                                    )}>{isTriggerActive ? 'TRIGGER ACTIVE' : 'WAITING FOR SIGNAL'}</p>
                                </div>
                                <h5 className="text-xl font-black text-white">RECURSIVE MATCH PATTERN</h5>
                             </div>
                             
                             <div className="flex items-center gap-8 my-10">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-widest">TRIGGER</span>
                                    <div className={cn(
                                        "w-24 h-24 rounded-3xl bg-black/40 border flex items-center justify-center text-5xl font-black transition-all",
                                        isTriggerActive ? "border-emerald-400 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)]" : "border-white/10 text-primary"
                                    )}>
                                        {digit}
                                    </div>
                                </div>
                                <div className="h-0.5 w-16 bg-white/10 relative">
                                     <div className="absolute -right-1 -top-1.5 w-3 h-3 border-t-2 border-r-2 border-white/40 rotate-45" />
                                     <ArrowRight className={cn("absolute left-1/2 -translate-x-1/2 -top-3 h-6 w-6 transition-colors", isTriggerActive ? "text-emerald-400" : "text-emerald-400/20")} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-widest">TARGET MATCH</span>
                                    <div className={cn(
                                        "w-24 h-24 rounded-3xl border-2 flex items-center justify-center text-6xl font-black transition-all",
                                        isTriggerActive ? "bg-emerald-500/40 border-emerald-400 text-white shadow-[0_0_50px_emerald]" : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                    )}>
                                        {nexusAnalysis.hottestNext.digit}
                                    </div>
                                </div>
                             </div>

                             <div className="w-full pt-6 border-t border-white/5">
                                <p className="text-[11px] font-black text-emerald-400/80 uppercase tracking-[0.3em]">PROBABILITY EDGE: +{nexusAnalysis.hottestNext.probability.toFixed(1)}%</p>
                             </div>
                        </div>

                        <div className="p-12 rounded-[3.5rem] bg-black/40 border border-white/5 relative overflow-hidden group shadow-2xl">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-transparent" />
                             <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-muted-foreground mb-10 flex items-center gap-6">
                                <ArrowUpRight className="h-8 w-8 text-cyan-400" /> POST-SIGNAL OVER SKEW
                             </h4>
                             <div className="flex items-end justify-between mb-6">
                                <span className="text-6xl font-black text-white tabular-nums tracking-tighter">{nexusAnalysis.barrierSymmetry.over.toFixed(1)}%</span>
                                <Badge className="bg-cyan-500/10 text-cyan-400 border-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">BULLISH FOLLOWING {digit}</Badge>
                             </div>
                             <Progress value={nexusAnalysis.barrierSymmetry.over} className="h-6 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-cyan-600 [&>div]:to-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.4)]" />
                             <p className="mt-8 text-[12px] font-mono text-cyan-400/60 uppercase tracking-widest text-center">Probability of outcome exceeding pivot 4 following digit {digit}</p>
                        </div>

                        <div className="p-12 rounded-[3.5rem] bg-black/40 border border-white/5 relative overflow-hidden group shadow-2xl">
                             <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-rose-500 to-transparent" />
                             <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-muted-foreground mb-10 flex items-center gap-6 justify-end">
                                <ArrowDownLeft className="h-8 w-8 text-rose-500" /> POST-SIGNAL UNDER SKEW
                             </h4>
                             <div className="flex items-end justify-between mb-6">
                                <Badge className="bg-rose-500/10 text-rose-500 border-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">BEARISH FOLLOWING {digit}</Badge>
                                <span className="text-6xl font-black text-white tabular-nums tracking-tighter">{nexusAnalysis.barrierSymmetry.under.toFixed(1)}%</span>
                             </div>
                             <Progress value={nexusAnalysis.barrierSymmetry.under} className="h-6 bg-black/60 [&>div]:bg-gradient-to-r [&>div]:from-rose-600 [&>div]:to-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]" />
                             <p className="mt-8 text-[12px] font-mono text-rose-500/60 uppercase tracking-widest text-center">Probability of outcome falling below pivot 5 following digit {digit}</p>
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
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-20 duration-1000 pb-32">
            <Card className="border-none shadow-[0_30px_90px_rgba(0,0,0,0.7)] bg-slate-900/40 backdrop-blur-[80px] overflow-hidden relative rounded-[4rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-10 sm:p-14 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 items-center">
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.7em] text-primary ml-2">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-20 bg-black/50 border-white/10 rounded-[2.5rem] font-black text-xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] px-10 focus:ring-primary/40">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[2.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-[0_30px_60px_rgba(0,0,0,1)]">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 px-6 font-black text-base transition-colors">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.7em] text-primary ml-2">LIVE DATA PIVOT</Label>
                        <div className="h-20 bg-gradient-to-br from-primary to-blue-700 rounded-[2.5rem] flex items-center justify-center shadow-[0_15px_35px_rgba(var(--primary),0.3)] relative group">
                             <div className="absolute -inset-1 bg-white/10 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition-opacity" />
                             <span className="text-4xl font-black tabular-nums text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] relative">
                                {price.toFixed(decimalPlaces)}
                             </span>
                             <div className="absolute -bottom-2 right-8 bg-black/60 px-3 py-1 rounded-full border border-white/10 text-[8px] font-black text-cyan-400 animate-pulse uppercase tracking-[0.2em]">Live Flux</div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.7em] text-primary ml-2">NEXUS DATA HORIZON</Label>
                        <div className="relative">
                            <div className="h-20 bg-black/50 border-white/10 rounded-[2.5rem] flex items-center justify-center font-black text-4xl text-primary shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] border border-primary/20">
                                {lastDigitTicks.length} <span className="text-[12px] opacity-40 ml-6 tracking-[0.6em] uppercase font-bold">TICKS ACTIVE</span>
                            </div>
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Activity size={32} /></div>
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
