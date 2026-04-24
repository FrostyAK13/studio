'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Crosshair } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { DigitFrequencyCircles } from './correlation-view';

interface AnalyzerViewProps {
    price: number;
    lastDigitTicks: number[];
    priceHistory: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    decimalPlaces: number;
    tickTimestamps: number[];
}

export function AnalyzerView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
    tickTimestamps,
}: AnalyzerViewProps) {
    const [tradeType, setTradeType] = React.useState('over-under');
    const [selectedDigit, setSelectedDigit] = React.useState<number>(5);

    const stats = React.useMemo(() => {
        const total = lastDigitTicks.length || 1;
        const overCount = lastDigitTicks.filter(d => d > selectedDigit).length;
        const underCount = lastDigitTicks.filter(d => d < selectedDigit).length;
        const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
        const oddCount = total - evenCount;
        
        let riseCount = 0;
        let fallCount = 0;
        for (let i = 0; i < priceHistory.length - 1; i++) {
            if (priceHistory[i] > priceHistory[i+1]) riseCount++;
            else if (priceHistory[i] < priceHistory[i+1]) fallCount++;
        }
        const rfTotal = (riseCount + fallCount) || 1;

        const matchCount = lastDigitTicks.filter(d => d === selectedDigit).length;
        const differCount = total - matchCount;

        let val1 = 0;
        let val2 = 0;
        let label1 = "ALPHA";
        let label2 = "BETA";

        switch (tradeType) {
            case 'over-under':
                label1 = `OVER ${selectedDigit}`;
                label2 = `UNDER ${selectedDigit}`;
                val1 = (overCount / total) * 100;
                val2 = (underCount / total) * 100;
                break;
            case 'even-odd':
                label1 = "EVEN";
                label2 = "ODD";
                val1 = (evenCount / total) * 100;
                val2 = (oddCount / total) * 100;
                break;
            case 'rise-fall':
                label1 = "RISE";
                label2 = "FALL";
                val1 = (riseCount / rfTotal) * 100;
                val2 = (fallCount / rfTotal) * 100;
                break;
            case 'matches-differs':
                label1 = "MATCHES";
                label2 = "DIFFERS";
                val1 = (matchCount / total) * 100;
                val2 = (differCount / total) * 100;
                break;
        }

        return {
            val1,
            val2,
            label1,
            label2,
            delta: Math.abs(val1 - val2),
            overCount,
            underCount,
            overPerc: (overCount / total) * 100,
            underPerc: (underCount / total) * 100
        };
    }, [lastDigitTicks, priceHistory, selectedDigit, tradeType]);

    const renderPattern = () => {
        const slice = [...lastDigitTicks.slice(0, 15)].reverse();
        const pivotIndex = slice.length - 1;
        
        return slice.map((digit, i) => {
            const isPivot = i === pivotIndex;
            const isMatch = digit === selectedDigit;
            
            let colorClass = "bg-slate-100 text-slate-400"; 
            
            if (isMatch && (tradeType === 'matches-differs')) {
                colorClass = "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] z-20";
            } else {
                switch (tradeType) {
                    case 'even-odd':
                        colorClass = digit % 2 === 0 
                            ? "bg-emerald-500 border-emerald-400 text-white" 
                            : "bg-rose-500 border-rose-400 text-white";
                        break;
                    case 'over-under':
                        colorClass = digit > selectedDigit
                            ? "bg-emerald-500 border-emerald-400 text-white"
                            : "bg-rose-500 border-rose-400 text-white";
                        break;
                    case 'rise-fall':
                        colorClass = digit % 2 === 0 
                            ? "bg-emerald-500 border-emerald-400 text-white" 
                            : "bg-rose-500 border-rose-400 text-white";
                        break;
                    case 'matches-differs':
                        colorClass = isMatch 
                            ? "bg-blue-600 border-blue-400 text-white" 
                            : "bg-slate-100 border-slate-200 text-slate-400";
                        break;
                }
            }
            
            return (
                <motion.div 
                    key={i} 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                        "w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-[10px] sm:text-base border transition-all duration-300 relative overflow-hidden",
                        isPivot ? "ring-2 ring-primary ring-offset-2 ring-offset-white z-30 shadow-[0_0_15px_rgba(var(--primary),0.4)] bg-primary text-white" : colorClass
                    )}
                >
                    <span className="relative z-10">{digit}</span>
                    {isPivot && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                </motion.div>
            );
        });
    };

    const handleDigitSelect = (d: number) => {
        setSelectedDigit(d);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            {/* Market Selection Card */}
            <Card className="border-none shadow-sm bg-white rounded-xl sm:rounded-2xl border border-slate-200">
                <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">MARKET VECTOR</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-8 bg-slate-50 border-slate-200 rounded-lg font-black text-[10px]">
                                    <SelectValue placeholder="Select Market" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-950 rounded-xl">
                                    {syntheticIndices.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold text-[10px]">{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">STRATEGY</Label>
                            <Select value={tradeType} onValueChange={setTradeType}>
                                <SelectTrigger className="h-8 bg-slate-50 border-slate-200 rounded-lg font-black text-[10px]">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-slate-950 rounded-xl">
                                    <SelectItem value="over-under" className="font-bold text-[10px]">Over/Under</SelectItem>
                                    <SelectItem value="even-odd" className="font-bold text-[10px]">Even/Odd</SelectItem>
                                    <SelectItem value="matches-differs" className="font-bold text-[10px]">Matches/Differs</SelectItem>
                                    <SelectItem value="rise-fall" className="font-bold text-[10px]">Rise/Fall</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Consistently Consolidated Analysis HUD - Light Mode */}
            <Card className="border-none bg-white rounded-xl sm:rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-cyan-400 to-primary" />
                <CardContent className="p-4 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                        {/* Column 1: HUD Title & Badges */}
                        <div className="lg:col-span-3 text-center lg:text-left space-y-3">
                            <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                                <Crosshair className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-black text-slate-950 tracking-tight uppercase">ANALYSIS HUD</h3>
                            </div>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-1.5">
                                <Badge className="bg-primary/10 text-primary border-none font-black tracking-widest text-[8px] px-2.5 py-1 uppercase">{stats.label1} vs {stats.label2}</Badge>
                                <Badge className="bg-blue-500/10 text-blue-600 border-none font-black tracking-widest text-[8px] px-2.5 py-1 uppercase">TARGET: {selectedDigit}</Badge>
                            </div>
                        </div>
                        
                        {/* Column 2: Stability Progress Bars */}
                        <div className="lg:col-span-6 grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-0.5">
                                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.15em]">{stats.label1}</p>
                                    <p className="text-2xl font-black text-emerald-600 tabular-nums">{stats.val1.toFixed(1)}%</p>
                                </div>
                                <Progress value={stats.val1} className="h-4 bg-slate-100 [&>div]:bg-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-0.5">
                                    <p className="text-[10px] font-black uppercase text-rose-600 tracking-[0.15em]">{stats.label2}</p>
                                    <p className="text-2xl font-black text-rose-600 tabular-nums">{stats.val2.toFixed(1)}%</p>
                                </div>
                                <Progress value={stats.val2} className="h-4 bg-slate-100 [&>div]:bg-rose-500" />
                            </div>
                        </div>

                        {/* Column 3: Live Price & Variance */}
                        <div className="lg:col-span-3 flex gap-6 items-center justify-center lg:justify-end">
                            <div className="text-center space-y-0.5">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">LIVE PRICE</p>
                                <p className="text-xl sm:text-2xl font-black text-slate-950 tabular-nums tracking-tighter">{price.toFixed(decimalPlaces)}</p>
                            </div>
                            <div className="w-px h-10 bg-slate-200" />
                            <div className="text-center space-y-0.5">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VARIANCE</p>
                                <p className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums tracking-tighter">{stats.delta.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Row */}
                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] sm:text-sm font-medium text-slate-600 leading-relaxed italic text-center lg:text-left">
                            "SURVEILLANCE LOG: Engine identifies a <span className={cn("font-black px-2 py-0.5 rounded-md", stats.val1 > stats.val2 ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10")}>{stats.val1 > stats.val2 ? stats.label1 : stats.label2}</span> directional bias. Confirmed stability for current tactical execution."
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Stream Sequence */}
            <Card className="border-none shadow-sm bg-slate-50 border border-slate-200 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                    <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-950">STREAM SEQUENCE</h3>
                    <div className="flex items-center gap-1.5">
                         <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" />
                         <span className="text-[7px] font-black uppercase text-blue-500 tracking-widest">ACTIVE SYNC</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                    {renderPattern()}
                </div>
            </Card>

            {/* Digit Frequency Circles */}
            <DigitFrequencyCircles 
                ticks={lastDigitTicks} 
                selectedDigit={selectedDigit} 
                onDigitSelect={handleDigitSelect} 
                selectedMarket={selectedMarket} 
            />
        </div>
    );
}
