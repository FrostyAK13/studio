'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Zap, Crosshair, TrendingUp, TrendingDown, Target, Cpu } from 'lucide-react';
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
            
            let colorClass = "bg-slate-800 text-white/40"; 
            
            if (isMatch && (tradeType === 'matches-differs')) {
                colorClass = "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] z-20";
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
                            : "bg-slate-800 border-white/5 text-white/40";
                        break;
                }
            }
            
            return (
                <motion.div 
                    key={i} 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                        "w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-xs sm:text-lg border transition-all duration-300 relative overflow-hidden",
                        isPivot ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 z-30 shadow-[0_0_20px_rgba(255,255,255,0.6)] bg-white text-black" : colorClass
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
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            <Card className="border-none shadow-xl bg-slate-900/60 backdrop-blur-3xl rounded-2xl sm:rounded-3xl border border-white/5">
                <CardContent className="p-4 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-primary ml-2">MARKET VECTOR</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-10 bg-black/50 border-white/10 rounded-xl font-black text-xs sm:text-sm">
                                    <SelectValue placeholder="Select Market" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-xl">
                                    {syntheticIndices.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold">{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-[0.3em] text-primary ml-2">STRATEGY</Label>
                            <Select value={tradeType} onValueChange={setTradeType}>
                                <SelectTrigger className="h-10 bg-black/50 border-white/10 rounded-xl font-black text-xs sm:text-sm">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-xl">
                                    <SelectItem value="over-under" className="font-bold">Over/Under</SelectItem>
                                    <SelectItem value="even-odd" className="font-bold">Even/Odd</SelectItem>
                                    <SelectItem value="matches-differs" className="font-bold">Matches/Differs</SelectItem>
                                    <SelectItem value="rise-fall" className="font-bold">Rise/Fall</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DigitFrequencyCircles 
                ticks={lastDigitTicks} 
                selectedDigit={selectedDigit} 
                onDigitSelect={handleDigitSelect} 
                selectedMarket={selectedMarket} 
            />

            <Card className="border-none bg-slate-950/80 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] border border-white/5 shadow-xl">
                <CardContent className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                        <div className="text-center lg:text-left space-y-2">
                            <div className="flex items-center gap-2 justify-center lg:justify-start">
                                <Crosshair className="h-5 w-5 text-primary" />
                                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">ANALYSIS HUD</h3>
                            </div>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                                <Badge className="bg-primary/20 text-primary border-none font-black tracking-widest text-[8px] sm:text-[9px] px-2 py-0.5 uppercase">{stats.label1} vs {stats.label2}</Badge>
                                <Badge className="bg-blue-500/10 text-blue-400 border-none font-black tracking-widest text-[8px] sm:text-[9px] px-2 py-0.5 uppercase">TARGET: {selectedDigit}</Badge>
                            </div>
                        </div>
                        
                        <div className="flex col-span-1 lg:col-span-2 gap-6 sm:gap-12 items-center justify-center lg:justify-end">
                            <div className="text-center space-y-1">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">LIVE PRICE</p>
                                <p className="text-2xl sm:text-4xl font-black text-white tabular-nums tracking-tighter">{price.toFixed(decimalPlaces)}</p>
                            </div>
                            <div className="w-px h-10 sm:h-16 bg-white/10" />
                            <div className="text-center space-y-1">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">VARIANCE</p>
                                <p className="text-2xl sm:text-4xl font-black text-emerald-400 tabular-nums tracking-tighter">{stats.delta.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-slate-900/40 border border-white/10 p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] overflow-hidden relative">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                    <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-white">STREAM SEQUENCE</h3>
                    <div className="flex items-center gap-1.5">
                         <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]" />
                         <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest">ACTIVE SYNC</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                    {renderPattern()}
                </div>
            </Card>

            <Card className="border-none shadow-xl bg-slate-950/90 backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden border border-white/5">
                <CardContent className="p-6 sm:p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[8px] font-black uppercase text-emerald-400 tracking-widest mb-0.5">STABILITY ALPHA</p>
                                    <h4 className="text-xs sm:text-sm font-black text-white/60">{stats.label1}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl sm:text-4xl font-black text-emerald-400 tabular-nums">{stats.val1.toFixed(1)}%</p>
                                    <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[8px] mt-0.5">CONFIRMED</Badge>
                                </div>
                            </div>
                            <Progress value={stats.val1} className="h-2 sm:h-3 bg-black/60 [&>div]:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[8px] font-black uppercase text-rose-500 tracking-widest mb-0.5">STABILITY BETA</p>
                                    <h4 className="text-xs sm:text-sm font-black text-white/60">{stats.label2}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl sm:text-4xl font-black text-rose-500 tabular-nums">{stats.val2.toFixed(1)}%</p>
                                    <Badge className="bg-rose-500/10 text-rose-500 border-none font-black text-[8px] mt-0.5">CONFIRMED</Badge>
                                </div>
                            </div>
                            <Progress value={stats.val2} className="h-2 sm:h-3 bg-black/60 [&>div]:bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] bg-slate-900/80 border border-white/10 text-center shadow-xl">
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-4 flex items-center justify-center gap-2">
                            <Zap className="h-4 w-4" /> SUMMARY
                        </h4>
                        <p className="text-sm sm:text-lg font-medium text-white/90 leading-relaxed italic drop-shadow-md">
                            "Stability Engine identifies a <span className={cn("font-black px-2 py-0.5 rounded-lg", stats.val1 > stats.val2 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10")}>{stats.val1 > stats.val2 ? stats.label1 : stats.label2}</span> bias. Confirmed accuracy for the current market cycle."
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
