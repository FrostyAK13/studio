'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Activity, Layers, Activity as ActivityIcon, SignalHigh, Hash, BarChartHorizontal, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

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
}: AnalyzerViewProps) {
    const [tradeType, setTradeType] = React.useState('even-odd');
    const [matchesDigit, setMatchesDigit] = React.useState(0);
    const [overUnderDigit, setOverUnderDigit] = React.useState(5);

    const COLORS = {
        EVEN: 'hsl(var(--chart-1))',       
        ODD: 'hsl(var(--chart-3))',        
        MATCH: 'hsl(var(--chart-2))',      
        DIFFER: 'hsl(var(--chart-5))',     
        OVER: 'hsl(var(--chart-2))',       
        UNDER: 'hsl(var(--chart-3))',      
        RISE: 'hsl(var(--chart-2))',       
        FALL: 'hsl(var(--chart-3))',       
        NEUTRAL: 'rgba(255, 255, 255, 0.1)'
    };
    
    const evenOddChartData = React.useMemo(() => {
        const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
        const oddCount = lastDigitTicks.length - evenCount;
        const total = lastDigitTicks.length || 1;
        return [
            { name: 'Even', value: (evenCount / total) * 100, color: COLORS.EVEN },
            { name: 'Odd', value: (oddCount / total) * 100, color: COLORS.ODD },
        ];
    }, [lastDigitTicks]);

    const matchesDiffersChartData = React.useMemo(() => {
        const matchesCount = lastDigitTicks.filter(d => d === matchesDigit).length;
        const total = lastDigitTicks.length || 1;
        return [
            { name: 'Matches', value: (matchesCount / total) * 100, color: COLORS.MATCH },
            { name: 'Differs', value: ((total - matchesCount) / total) * 100, color: COLORS.DIFFER },
        ];
    }, [lastDigitTicks, matchesDigit]);

    const overUnderChartData = React.useMemo(() => {
        const overCount = lastDigitTicks.filter(d => d > overUnderDigit).length;
        const underCount = lastDigitTicks.filter(d => d < overUnderDigit).length;
        const total = lastDigitTicks.length || 1;
        return [
            { name: 'Over', value: (overCount / total) * 100, color: COLORS.OVER },
            { name: 'Under', value: (underCount / total) * 100, color: COLORS.UNDER },
        ];
    }, [lastDigitTicks, overUnderDigit]);

    const riseFallChartData = React.useMemo(() => {
        if (priceHistory.length < 2) return [
            { name: 'Rise', value: 0, color: COLORS.RISE },
            { name: 'Fall', value: 0, color: COLORS.FALL },
        ];
        let riseCount = 0;
        let fallCount = 0;
        for (let i = 0; i < priceHistory.length - 1; i++) {
            if (priceHistory[i] > priceHistory[i+1]) riseCount++;
            else if (priceHistory[i] < priceHistory[i+1]) fallCount++;
        }
        const total = (riseCount + fallCount) || 1;
        return [
            { name: 'Rise', value: (riseCount / total) * 100, color: COLORS.RISE },
            { name: 'Fall', value: (fallCount / total) * 100, color: COLORS.FALL },
        ];
    }, [priceHistory]);

    const activeChartData = React.useMemo(() => {
        switch(tradeType) {
            case 'even-odd': return evenOddChartData;
            case 'matches-differs': return matchesDiffersChartData;
            case 'over-under': return overUnderChartData;
            case 'rise-fall': return riseFallChartData;
            default: return evenOddChartData;
        }
    }, [tradeType, evenOddChartData, matchesDiffersChartData, overUnderChartData, riseFallChartData]);

    const patternIntelligence = React.useMemo(() => {
        if (lastDigitTicks.length < 5) return { repeat: null, intensity: 0 };
        const slice = lastDigitTicks.slice(0, 5);
        let repeats = 0;
        for(let i=0; i < slice.length-1; i++) {
            if (slice[i] === slice[i+1]) repeats++;
        }
        return {
            repeat: repeats > 0 ? slice[0] : null,
            intensity: (repeats / 4) * 100
        };
    }, [lastDigitTicks]);

    const renderSequence = () => {
        const count = 16;
        const slice = [...lastDigitTicks.slice(0, count)].reverse();

        return slice.map((digit, i) => {
            let color = 'bg-white/5';
            let label = digit.toString();
            let isAnomaly = false;

            if (tradeType === 'even-odd') {
                color = digit % 2 === 0 ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
            } else if (tradeType === 'matches-differs') {
                const isMatch = digit === matchesDigit;
                color = isMatch ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110 z-10' : 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                if (isMatch) isAnomaly = true;
            } else if (tradeType === 'over-under') {
                if (digit > overUnderDigit) color = 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-110 z-10';
                else if (digit < overUnderDigit) color = 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-110 z-10';
                else color = 'bg-white/5 text-white/20';
            } else if (tradeType === 'rise-fall') {
                const currentIdx = lastDigitTicks.length - 1 - i;
                const prevIdx = currentIdx + 1;
                if (prevIdx < lastDigitTicks.length) {
                    if (priceHistory[currentIdx] > priceHistory[prevIdx]) {
                        color = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
                        label = '↑';
                    } else if (priceHistory[currentIdx] < priceHistory[prevIdx]) {
                        color = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]';
                        label = '↓';
                    }
                }
            }

            return (
                <div key={i} className={cn(
                    "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-black text-xs sm:text-base border transition-all duration-300 shrink-0",
                    color,
                    "border-white/5 shadow-lg relative"
                )}>
                    {label}
                    {isAnomaly && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-ping" />}
                </div>
            );
        });
    };

    return (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
             <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[1.5rem] sm:rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-5 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 items-end">
                    <div className="space-y-3">
                        <Label className="text-[9px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-12 sm:h-16 bg-black/50 border-white/10 rounded-[1rem] sm:rounded-[1.5rem] font-black text-xs sm:text-lg px-4 sm:px-8">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-[1rem] sm:rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 font-black text-xs sm:text-base">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[9px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">ALGORITHM PROTOCOL</Label>
                        <Select value={tradeType} onValueChange={setTradeType}>
                             <SelectTrigger className="h-12 sm:h-16 bg-black/50 border-white/10 rounded-[1rem] sm:rounded-[1.5rem] font-black text-xs sm:text-lg px-4 sm:px-8">
                                <SelectValue placeholder="Select Protocol" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-[1rem] sm:rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                <SelectItem value="even-odd" className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 font-black text-xs sm:text-base">Even / Odd</SelectItem>
                                <SelectItem value="matches-differs" className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 font-black text-xs sm:text-base">Matches / Differs</SelectItem>
                                <SelectItem value="over-under" className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 font-black text-xs sm:text-base">Over / Under</SelectItem>
                                <SelectItem value="rise-fall" className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 font-black text-xs sm:text-base">Rise / Fall</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[9px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">DATA HORIZON</Label>
                        <div className="relative group">
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-12 sm:h-16 bg-black/50 border-white/10 rounded-[1rem] sm:rounded-[1.5rem] font-black text-lg sm:text-3xl text-primary text-center shadow-inner relative z-10"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-20"><Activity size={20} className="sm:w-6 sm:h-6" /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                <Card className="lg:col-span-2 border-none shadow-2xl bg-slate-950/80 backdrop-blur-3xl overflow-hidden relative rounded-[1.5rem] sm:rounded-[3rem]">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-cyan-400 to-primary" />
                    <CardHeader className="pb-4 px-6 sm:px-10 pt-8 sm:pt-10">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2 sm:p-3 bg-primary/20 rounded-[0.75rem] sm:rounded-[1rem] border border-primary/30">
                                    <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-[9px] sm:text-[12px] font-black uppercase tracking-widest text-primary">Live Volumetric Flux</CardTitle>
                                    <CardDescription className="text-[7px] sm:text-[9px] font-bold uppercase text-muted-foreground/60 mt-1 tracking-widest">REAL-TIME SEQUENCE SCANNER</CardDescription>
                                </div>
                            </div>
                            <div className="text-center sm:text-right bg-white/5 px-4 sm:px-6 py-1 sm:py-2 rounded-[1rem] border border-white/10 w-full sm:w-auto">
                                <p className="text-[7px] sm:text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest mb-0.5">GLOBAL PIVOT</p>
                                <p className="text-lg sm:text-2xl font-black text-white tabular-nums tracking-tighter">{price.toFixed(decimalPlaces)}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 sm:px-10 pb-8 sm:pb-12 space-y-6 sm:space-y-10">
                        <div className="flex flex-wrap gap-1.5 sm:gap-3 p-3 sm:p-5 bg-black/40 rounded-[1rem] sm:rounded-[1.5rem] border border-white/5 shadow-inner min-h-[4rem] sm:min-h-[5rem] items-center justify-center">
                            {renderSequence()}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {activeChartData.map((data, idx) => (
                                <div key={idx} className="bg-black/60 p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-xl">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <p className="text-[8px] sm:text-[10px] font-black tracking-widest uppercase" style={{ color: data.color }}>{data.name} RATIO</p>
                                        <span className="text-xl sm:text-3xl font-black tabular-nums text-white tracking-tighter">{data.value.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden border border-white/5">
                                        <div 
                                            className="h-full transition-all duration-1000 ease-out" 
                                            style={{ 
                                                width: `${data.value}%`, 
                                                backgroundColor: data.color, 
                                            }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6 sm:space-y-10 h-full flex flex-col">
                    <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl overflow-hidden relative flex flex-col p-6 sm:p-8 h-full rounded-[1.5rem] sm:rounded-[3rem]">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                        <CardHeader className="text-center pb-4 px-0">
                            <CardTitle className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-cyan-400">ANALYSIS HUD</CardTitle>
                        </CardHeader>
                        
                        <div className="flex-1 relative flex items-center justify-center py-4">
                            <ChartContainer config={{}} className="w-full aspect-square max-w-[140px] sm:max-w-[200px]">
                                <PieChart>
                                    <Pie
                                        data={activeChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={4}
                                        stroke="none"
                                    >
                                        {activeChartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.color} 
                                                className="hover:opacity-80 transition-opacity" 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={() => null} />
                                </PieChart>
                            </ChartContainer>
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl sm:text-4xl font-black tracking-tighter tabular-nums text-white">
                                    {activeChartData[0]?.value.toFixed(0)}
                                    <span className="text-sm sm:text-lg opacity-40 ml-0.5">%</span>
                                </span>
                                <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1">{activeChartData[0]?.name} VECTOR</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-auto">
                            {activeChartData.map((data, idx) => (
                                <div key={idx} className="text-center p-3 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-black/40 border border-white/5">
                                    <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: data.color }}>{data.name}</p>
                                    <p className="text-lg sm:text-2xl font-black tabular-nums" style={{ color: data.color }}>{data.value.toFixed(1)}%</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-none bg-slate-950/80 border border-white/5 p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[2rem] flex items-center justify-between shadow-xl mt-4 sm:mt-0">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-primary/10 rounded-[0.75rem] sm:rounded-[1rem]">
                                <Boxes className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-[7px] sm:text-[9px] font-black text-primary uppercase tracking-widest">PATTERN RECURSION</p>
                                <p className="text-sm sm:text-xl font-black text-white">{patternIntelligence.repeat !== null ? `REPETITION: ${patternIntelligence.repeat}` : 'SCANNING...'}</p>
                            </div>
                        </div>
                        <SignalHigh className={cn("h-5 w-5 sm:h-6 sm:w-6", patternIntelligence.intensity > 50 ? "text-emerald-400" : "text-primary/40")} />
                    </Card>
                </div>
            </div>

            {tradeType === 'matches-differs' && (
                <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/40" />
                    <div className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-8">
                        <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-full">
                            <Hash className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
                        </div>
                        <p className="text-[9px] sm:text-[12px] font-black uppercase tracking-widest text-white">SELECT TARGET DIGIT VECTOR</p>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-4">
                        {Array.from({ length: 10 }, (_, i) => (
                            <Button
                                key={i}
                                variant={matchesDigit === i ? 'default' : 'outline'}
                                className={cn(
                                    'h-10 sm:h-16 rounded-[0.75rem] sm:rounded-[1.25rem] text-lg sm:text-2xl font-black transition-all duration-300 relative overflow-hidden',
                                    matchesDigit === i 
                                        ? 'bg-emerald-500 text-white shadow-xl scale-105 z-10 border-none' 
                                        : 'bg-black/40 border-white/5 hover:bg-white/10'
                                )}
                                onClick={() => setMatchesDigit(i)}
                            >
                                {i}
                            </Button>
                        ))}
                    </div>
                </Card>
            )}

            {tradeType === 'over-under' && (
                <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-500/40" />
                     <div className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-8">
                        <div className="p-2 sm:p-3 bg-cyan-500/10 rounded-full">
                            <BarChartHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                        </div>
                        <p className="text-[9px] sm:text-[12px] font-black uppercase tracking-widest text-white">SELECT BARRIER PIVOT LEVEL</p>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-4">
                        {Array.from({ length: 10 }, (_, i) => (
                            <Button
                                key={i}
                                variant={overUnderDigit === i ? 'default' : 'outline'}
                                className={cn(
                                    'h-10 sm:h-16 rounded-[0.75rem] sm:rounded-[1.25rem] text-lg sm:text-2xl font-black transition-all duration-300 relative overflow-hidden',
                                    overUnderDigit === i 
                                        ? 'bg-cyan-500 text-white shadow-xl scale-105 z-10 border-none' 
                                        : 'bg-black/40 border-white/5 hover:bg-white/10'
                                )}
                                onClick={() => setOverUnderDigit(i)}
                            >
                                {i}
                            </Button>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
