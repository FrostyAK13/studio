'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Activity, Layers, SignalHigh, Hash, Boxes, Timer, BarChart3, Scale, LayoutGrid, Target, ArrowRightLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
    const [overValue, setOverValue] = React.useState(4);
    const [underValue, setUnderValue] = React.useState(5);

    const stats = React.useMemo(() => {
        const total = lastDigitTicks.length || 1;
        const overCount = lastDigitTicks.filter(d => d > overValue).length;
        const underCount = lastDigitTicks.filter(d => d < underValue).length;
        
        return {
            overCount,
            underCount,
            overPerc: (overCount / total) * 100,
            underPerc: (underCount / total) * 100
        };
    }, [lastDigitTicks, overValue, underValue]);

    const renderPattern = () => {
        // Show up to 24 circles
        const slice = [...lastDigitTicks.slice(0, 24)].reverse();
        return slice.map((digit, i) => {
            const isOver = digit > overValue;
            const isUnder = digit < underValue;
            
            let label = "-";
            let color = "bg-white/5 border-white/5 text-muted-foreground/40";
            
            if (isOver) {
                label = "O";
                color = "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]";
            } else if (isUnder) {
                label = "U";
                color = "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]";
            }

            return (
                <div key={i} className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border transition-all duration-300",
                    color
                )}>
                    {label}
                </div>
            );
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20 max-w-6xl mx-auto">
            {/* Top Configuration Grid */}
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-6 sm:p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Synthetic Market</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl font-black text-sm">
                                    <SelectValue placeholder="Select Market" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white">
                                    {syntheticIndices.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold">{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Trade Type</Label>
                            <Select value={tradeType} onValueChange={setTradeType}>
                                <SelectTrigger className="h-12 bg-black/40 border-white/10 rounded-xl font-black text-sm">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white">
                                    <SelectItem value="over-under" className="font-bold">Over/Under</SelectItem>
                                    <SelectItem value="even-odd" className="font-bold">Even/Odd</SelectItem>
                                    <SelectItem value="matches-differs" className="font-bold">Matches/Differs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Over Value</Label>
                            <Input 
                                type="number" 
                                value={overValue} 
                                onChange={(e) => setOverValue(parseInt(e.target.value))}
                                className="h-12 bg-black/40 border-white/10 rounded-xl font-black text-center text-lg"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Under Value</Label>
                            <Input 
                                type="number" 
                                value={underValue} 
                                onChange={(e) => setUnderValue(parseInt(e.target.value))}
                                className="h-12 bg-black/40 border-white/10 rounded-xl font-black text-center text-lg"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Number of Ticks to Analyze</Label>
                            <Input 
                                type="number" 
                                value={maxTicks === 0 ? '' : maxTicks} 
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-12 bg-black/40 border-white/10 rounded-xl font-black text-center text-lg text-primary"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Price & Stats Row */}
            <Card className="border-none shadow-xl bg-slate-950/60 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border-t border-white/5">
                <CardContent className="p-8 sm:p-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="text-center md:text-left space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">CURRENT PRICE</p>
                            <p className="text-4xl sm:text-6xl font-black text-primary tracking-tighter tabular-nums">{price.toFixed(decimalPlaces)}</p>
                        </div>
                        <div className="flex gap-12 sm:gap-24">
                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Over</p>
                                <p className="text-3xl sm:text-5xl font-black text-white tabular-nums">{stats.overCount}</p>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Under</p>
                                <p className="text-3xl sm:text-5xl font-black text-white tabular-nums">{stats.underCount}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Over/Under Pattern Display */}
            <Card className="border-none shadow-xl bg-slate-950/40 border border-white/5 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-8">
                    <LayoutGrid className="h-5 w-5 text-primary opacity-50" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Over/Under Pattern</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                    {renderPattern()}
                </div>
            </Card>

            {/* Probability Analysis Hub */}
            <Card className="border-none shadow-2xl bg-slate-900/80 backdrop-blur-3xl rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 sm:p-10 pb-2">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary">Probability Analysis</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 sm:p-12 space-y-10">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Over {overValue}</p>
                            <span className="text-2xl font-black text-emerald-400 tabular-nums">{stats.overPerc.toFixed(1)}%</span>
                        </div>
                        <div className="relative h-12 bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                                style={{ width: `${stats.overPerc}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Under {underValue}</p>
                            <span className="text-2xl font-black text-rose-500 tabular-nums">{stats.underPerc.toFixed(1)}%</span>
                        </div>
                        <div className="relative h-12 bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                            <div 
                                className="h-full bg-rose-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(244,63,94,0.3)]" 
                                style={{ width: `${stats.underPerc}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
