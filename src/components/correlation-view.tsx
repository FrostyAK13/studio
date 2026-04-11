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
        const max1 = sorted[0].count;
        const max2 = sorted[1]?.count;
        const min1 = sorted[sorted.length - 1].count;
        const min2 = sorted[sorted.length - 2]?.count;

        return {
            digitData: mapped.map(item => {
                let colorClass = "text-slate-200"; 
                if (total > 10) {
                    if (item.count === max1) colorClass = "text-[#2dd4bf]"; // 1st Hottest (Ice Green)
                    else if (item.count === max2 && max2 !== max1) colorClass = "text-[#3b82f6]"; // 2nd Hottest (Blue)
                    else if (item.count === min1) colorClass = "text-[#ea580c]"; // 1st Coldest (Orange)
                    else if (item.count === min2 && min2 !== min1) colorClass = "text-[#fb923c]"; // 2nd Coldest (Light Orange)
                }
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
                className="flex flex-col items-center relative cursor-pointer group transition-all duration-300 hover:scale-150 hover:z-50"
                onClick={() => onDigitSelect(digit)}
            >
                <div className={cn(
                    "relative w-16 h-16 sm:w-20 md:w-24 lg:w-28 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    isSelected ? "bg-black border-slate-700 shadow-2xl scale-110" : "bg-white border-transparent shadow-sm"
                )}>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle 
                            cx="50%" cy="50%" r="42%" 
                            stroke={isSelected ? "#1e293b" : "#f1f5f9"} 
                            strokeWidth="6" 
                            fill="transparent" 
                        />
                        <circle 
                            cx="50%" cy="50%" r="42%" 
                            stroke={isSelected ? "#ffffff" : "currentColor"} 
                            strokeWidth="8" 
                            fill="transparent" 
                            pathLength="100"
                            strokeDasharray="100" 
                            strokeDashoffset={100 - percentage} 
                            strokeLinecap="round" 
                            className={cn("transition-all duration-1000 ease-out", isSelected ? "" : colorClass)} 
                        />
                    </svg>
                    
                    <div className="flex flex-col items-center justify-center z-10 leading-none">
                        <span className={cn(
                            "text-xl sm:text-3xl md:text-4xl font-black transition-all",
                            isSelected ? "text-white" : "text-slate-900"
                        )}>
                            {digit}
                        </span>
                        <span className={cn(
                            "text-[8px] sm:text-[10px] md:text-xs font-bold mt-0.5",
                            isSelected ? "text-white/60" : "text-slate-400"
                        )}>
                            {percentage.toFixed(1)}%
                        </span>
                    </div>
                </div>
                
                <div className="h-4 mt-1 flex items-center justify-center">
                    {isLast && (
                        <Triangle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-slate-400 text-slate-400" />
                    )}
                </div>
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[1.5rem] sm:rounded-[3rem]">
            <div className="px-6 sm:px-12 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-slate-50 px-5 py-2 rounded-full text-[10px] text-slate-500 font-black border border-slate-100 uppercase tracking-widest shadow-sm">
                    <span>SAMPLE: {ticks.length}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>{marketName.toUpperCase()}</span>
                </div>
                <h2 className="text-sm sm:text-lg font-black uppercase tracking-[0.4em] text-slate-900">DIGIT FREQUENCY</h2>
            </div>
            <CardContent className="p-6 sm:p-12">
                <div className="space-y-8 sm:space-y-16">
                    <div className="grid grid-cols-5 gap-3 sm:gap-8">
                        {digitData.slice(0, 5).map((data) => (
                            <DigitCircle key={data.index} digit={data.index} percentage={data.percentage} colorClass={data.colorClass} isLast={lastDigit === data.index} isSelected={selectedDigit === data.index} />
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-3 sm:gap-8">
                        {digitData.slice(5, 10).map((data) => (
                            <DigitCircle key={data.index} digit={data.index} percentage={data.percentage} colorClass={data.colorClass} isLast={lastDigit === data.index} isSelected={selectedDigit === data.index} />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const DigitAnalysisMatrix = ({ digit, ticks }: { digit: number, ticks: number[] }) => {
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
        <div className="mt-4 sm:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-none bg-slate-950 shadow-2xl overflow-hidden relative rounded-[2rem] border border-white/5">
                <CardHeader className="pb-4 pt-6 px-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <Network className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-black text-white tracking-tight uppercase leading-none">DIGIT ANALYSIS</CardTitle>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex items-center gap-4 shadow-xl">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5 tracking-widest">SEQUENCES</p>
                                <p className="text-lg font-black text-white tabular-nums">{nexusAnalysis.totalFound}</p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-3 p-5 rounded-[1.5rem] bg-black/40 border border-white/5 shadow-inner">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Cpu className="h-4 w-4 text-emerald-400" /> SUCCESSION BIAS
                                </h4>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                {nexusAnalysis.results.slice(0, 5).map((res, idx) => (
                                    <div key={res.digit} className={cn("p-3 rounded-2xl border transition-all duration-500 text-center", idx === 0 ? "bg-emerald-500/20 border-emerald-500/50 scale-105 z-10" : "bg-white/5 border-white/5")}>
                                        <p className={cn("text-xl font-black mb-0", idx === 0 ? "text-white" : "text-white/60")}>{res.digit}</p>
                                        <p className={cn("text-[9px] font-black tabular-nums", idx === 0 ? "text-emerald-400" : "text-slate-600")}>{res.probability.toFixed(1)}%</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 p-5 rounded-[1.5rem] bg-black/40 border border-white/5 shadow-inner">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-cyan-400" /> RECURSION MATRIX
                                </h4>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {nexusAnalysis.chains.map((chain, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 shadow-md">
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary font-black text-sm">{digit}</span>
                                            <ArrowRight className="h-3 w-3 text-white/20" />
                                            <span className="text-white font-black text-base">{chain.chain}</span>
                                        </div>
                                        <span className="text-xs font-black text-emerald-400 tabular-nums">{chain.probability.toFixed(1)}%</span>
                                    </div>
                                ))}
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[2rem] border border-white/5">
                <CardContent className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">MARKET VECTOR</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-14 bg-black/60 border-white/10 rounded-[1.25rem] font-black text-base px-6 shadow-inner">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 px-6 font-black text-sm">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 text-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">LIVE PRICE</Label>
                        <div className="h-14 bg-gradient-to-br from-primary to-blue-800 rounded-[1.25rem] flex items-center justify-center shadow-2xl border border-white/10">
                             <span className="text-2xl font-black tabular-nums text-white drop-shadow-lg">{price.toFixed(decimalPlaces)}</span>
                        </div>
                    </div>
                    <div className="space-y-2 text-center">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">SAMPLE HORIZON</Label>
                        <div className="h-14 bg-black/60 border-white/10 rounded-[1.25rem] flex items-center justify-center font-black text-3xl text-primary shadow-inner border border-primary/20">{lastDigitTicks.length}</div>
                    </div>
                </CardContent>
            </Card>
            <DigitFrequencyCircles ticks={lastDigitTicks} selectedDigit={selectedDigit} onDigitSelect={setSelectedDigit} selectedMarket={selectedMarket} />
            {selectedDigit !== null && ( <DigitAnalysisMatrix digit={selectedDigit} ticks={lastDigitTicks} /> )}
        </div>
    );
}
