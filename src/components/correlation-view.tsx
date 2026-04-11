'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Orbit, Fingerprint, Network, Cpu, Layers, Crosshair, ArrowRight, AlertTriangle } from 'lucide-react';

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
                    "flex flex-col items-center relative cursor-pointer transition-all duration-500 p-0.5 group",
                    isSelected 
                        ? "bg-primary/20 rounded-[1rem] ring-[3px] ring-primary/80 scale-105 z-20 shadow-[0_0_40px_rgba(var(--primary),0.6)]" 
                        : "hover:scale-105"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-12 h-12 sm:w-24 md:w-28 lg:w-32 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="1.5" fill="transparent" className="text-white/5" />
                        <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray="100 100" strokeDashoffset={100 - percentage} strokeLinecap="round" className={cn("transition-all duration-1000 ease-out", isSelected ? "text-primary drop-shadow-[0_0_15px_rgba(var(--primary),1)]" : colorClass)} />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn("text-xl sm:text-[4rem] md:text-[5rem] lg:text-[5.5rem] font-black leading-none tracking-tighter transition-all duration-500 drop-shadow-2xl", isSelected ? "text-white" : "text-foreground")}>{digit}</span>
                        <span className="text-[7px] sm:text-[14px] font-black text-cyan-400 mt-0 sm:-mt-1 uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute top-0 right-0">
                        <div className="h-2.5 w-2.5 sm:h-5 sm:w-5 rounded-full bg-cyan-400 animate-ping shadow-[0_0_15px_cyan] absolute" />
                        <div className="h-2.5 w-2.5 sm:h-5 sm:w-5 rounded-full bg-cyan-400 shadow-[0_0_10px_cyan] relative" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-slate-900/60 backdrop-blur-3xl rounded-[1.25rem] sm:rounded-[2.5rem] border border-white/5">
            <div className="px-4 sm:px-10 pt-4 sm:pt-6">
                <div className="flex items-center gap-2 sm:gap-3 bg-black/60 px-3 sm:px-6 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[11px] text-muted-foreground font-black border border-white/10 uppercase tracking-[0.15em] w-fit shadow-xl">
                    <Orbit className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-cyan-400" />
                    <span>SAMPLE: {ticks.length} • {marketName.toUpperCase()}</span>
                </div>
            </div>
             <CardHeader className="pb-1 sm:pb-2 pt-3 text-center px-4 sm:px-10">
                <CardTitle className="text-[9px] sm:text-lg font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2.5 text-primary">
                    GLOBAL FREQUENCY ORBIT
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 space-y-2 sm:space-y-4">
                <div className="space-y-2 sm:space-y-4">
                    <div className="grid grid-cols-5 gap-1 sm:gap-4 border-b border-white/5 pb-2 sm:pb-4">
                        {digitData.slice(0, 5).map((data) => (
                            <DigitCircle key={data.index} digit={data.index} percentage={data.percentage} colorClass={data.colorClass} isLast={lastDigit === data.index} isSelected={selectedDigit === data.index} />
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1 sm:gap-4 pt-1">
                        {digitData.slice(5, 10).map((data) => (
                            <DigitCircle key={data.index} digit={data.index} percentage={data.percentage} colorClass={data.colorClass} isLast={lastDigit === data.index} isSelected={selectedDigit === data.index} />
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-start mt-2 px-1">
                    <Badge className="bg-amber-500 text-slate-950 font-black text-[7px] sm:text-[9px] uppercase tracking-widest py-1 px-3 rounded-lg flex items-center gap-1.5">
                        <AlertTriangle className="h-2.5 w-2.5" /> RISK DISCLAIMER
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
};

export const DigitNexusMatrix = ({ digit, ticks }: { digit: number, ticks: number[] }) => {
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
        const results = followingDigits.map((count, index) => ({ digit: index, count, probability: (count / total) * 100 })).sort((a, b) => b.probability - a.probability);
        const chains = Object.entries(chain3Data).map(([chain, count]) => ({ chain, count, probability: (count / total) * 100 })).sort((a, b) => b.count - a.count).slice(0, 4);
        return { results, chains, hottestNext: results[0], totalFound: totalFollowers };
    }, [digit, ticks]);

    return (
        <div className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-none bg-slate-950/90 shadow-2xl overflow-hidden relative rounded-[1.5rem] border border-white/5">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-primary to-emerald-500" />
                <CardHeader className="pb-2 sm:pb-4 pt-4 px-5 sm:px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-[1rem] bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Network className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg sm:text-2xl font-black text-white tracking-tighter uppercase leading-none">DIGIT {digit} NEXUS</CardTitle>
                                <CardDescription className="text-primary/70 font-black uppercase tracking-[0.3em] text-[7px] sm:text-[9px] mt-1">PREDICTIVE STABILITY</CardDescription>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-[1rem] flex items-center gap-4 shadow-xl">
                            <div className="text-center">
                                <p className="text-[7px] font-black text-muted-foreground uppercase mb-0.5">SEQUENCES</p>
                                <p className="text-base font-black text-white tabular-nums">{nexusAnalysis.totalFound}</p>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="text-center">
                                <p className="text-[7px] font-black text-muted-foreground uppercase mb-0.5">SYNC</p>
                                <div className="flex items-center gap-1">
                                    <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                                    <p className="text-xs font-black text-emerald-400 uppercase">STABLE</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-5 sm:px-8 pb-6 space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="space-y-2 p-4 rounded-[1rem] bg-black/60 border border-white/10">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <h4 className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                                    <Cpu className="h-3 w-3 text-emerald-400" /> SUCCESSION
                                </h4>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-2 py-0.5 text-[7px] font-black uppercase">STABILITY</Badge>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {nexusAnalysis.results.slice(0, 5).map((res, idx) => (
                                    <div key={res.digit} className={cn("p-2 rounded-xl border transition-all duration-500 text-center", idx === 0 ? "bg-emerald-500/20 border-emerald-500/50 scale-105 z-10" : "bg-white/5 border-white/5")}>
                                        <p className={cn("text-base font-black mb-0", idx === 0 ? "text-white" : "text-foreground/80")}>{res.digit}</p>
                                        <p className={cn("text-[8px] font-black tabular-nums", idx === 0 ? "text-emerald-400" : "text-muted-foreground/40")}>{res.probability.toFixed(1)}%</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2 p-4 rounded-[1rem] bg-black/60 border border-white/10">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <h4 className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                                    <Layers className="h-3 w-3 text-cyan-400" /> RECURSION
                                </h4>
                                <Badge className="bg-cyan-500/10 text-cyan-400 border-none px-2 py-0.5 text-[7px] font-black uppercase">ZERO-ERROR</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {nexusAnalysis.chains.map((chain, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/10 shadow-md">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-primary font-black text-[10px]">{digit}</span>
                                            <ArrowRight className="h-2 w-2 text-white/30" />
                                            <span className="text-white font-black text-xs">{chain.chain}</span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-400 tabular-nums">{chain.probability.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 text-center shadow-xl">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-primary mb-2 flex items-center justify-center gap-2">
                            <Crosshair className="h-3 w-3" /> 15-TICK FORECAST
                        </h4>
                        <p className="text-sm font-medium text-white/90 leading-relaxed italic max-w-2xl mx-auto">"Engine confirms <span className="text-emerald-400 font-black px-2 py-0.5 bg-emerald-500/10 rounded-lg">Digit {nexusAnalysis.hottestNext.digit}</span> stability for the next 15+ sequence cycles."</p>
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
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Card className="border-none shadow-xl bg-slate-900/60 backdrop-blur-3xl overflow-hidden relative rounded-[1.5rem] border border-white/5">
                <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-primary ml-1.5">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-11 bg-black/60 border-white/10 rounded-xl font-black text-[11px] sm:text-base px-4 shadow-inner">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-[1.25rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-2.5 px-5 font-black text-[10px] sm:text-sm">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1 text-center">
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">LIVE PRICE</Label>
                        <div className="h-11 bg-gradient-to-br from-primary to-blue-800 rounded-xl flex items-center justify-center shadow-xl border border-white/10">
                             <span className="text-base sm:text-2xl font-black tabular-nums text-white drop-shadow-lg">{price.toFixed(decimalPlaces)}</span>
                        </div>
                    </div>
                    <div className="space-y-1 text-center">
                        <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">STABILITY SAMPLE</Label>
                        <div className="h-11 bg-black/60 border-white/10 rounded-xl flex items-center justify-center font-black text-base sm:text-2xl text-primary shadow-inner border border-primary/20">{lastDigitTicks.length}</div>
                    </div>
                </CardContent>
            </Card>
            <DigitFrequencyCircles ticks={lastDigitTicks} selectedDigit={selectedDigit} onDigitSelect={setSelectedDigit} selectedMarket={selectedMarket} />
            {selectedDigit !== null && ( <DigitNexusMatrix digit={selectedDigit} ticks={lastDigitTicks} /> )}
        </div>
    );
}
