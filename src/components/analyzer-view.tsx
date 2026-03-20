
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, BarChartHorizontal, Hash, List, TrendingUp, TrendingDown, Target, Zap, Activity, Cpu, Layers, Fingerprint, Network, Boxes, SignalHigh } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

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
        const count = 24;
        const slice = [...lastDigitTicks.slice(0, count)].reverse();

        return slice.map((digit, i) => {
            let color = 'bg-white/5';
            let label = digit.toString();
            let isAnomaly = false;

            if (tradeType === 'even-odd') {
                color = digit % 2 === 0 ? 'bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]';
            } else if (tradeType === 'matches-differs') {
                const isMatch = digit === matchesDigit;
                color = isMatch ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.7)] scale-110 z-10' : 'bg-orange-500/10 text-orange-400 border-orange-500/20';
                if (isMatch) isAnomaly = true;
            } else if (tradeType === 'over-under') {
                if (digit > overUnderDigit) color = 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.7)] scale-110 z-10';
                else if (digit < overUnderDigit) color = 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)] scale-110 z-10';
                else color = 'bg-white/5 text-white/20';
            } else if (tradeType === 'rise-fall') {
                const currentIdx = lastDigitTicks.length - 1 - i;
                const prevIdx = currentIdx + 1;
                if (prevIdx < lastDigitTicks.length) {
                    if (priceHistory[currentIdx] > priceHistory[prevIdx]) {
                        color = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]';
                        label = '↑';
                    } else if (priceHistory[currentIdx] < priceHistory[prevIdx]) {
                        color = 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]';
                        label = '↓';
                    }
                }
            }

            return (
                <div key={i} className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg border transition-all duration-500 shrink-0",
                    color,
                    "border-white/5 shadow-2xl relative"
                )}>
                    {label}
                    {isAnomaly && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />}
                </div>
            );
        });
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
             <Card className="border-none shadow-[0_30px_100px_rgba(0,0,0,0.7)] bg-slate-900/40 backdrop-blur-[60px] overflow-hidden relative rounded-[4rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-10 sm:p-14 grid grid-cols-1 md:grid-cols-3 gap-12 items-end">
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.7em] text-primary ml-4">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-20 bg-black/50 border-white/10 rounded-[2.5rem] font-black text-xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] px-10">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[2.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 font-black">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.7em] text-primary ml-4">ALGORITHM PROTOCOL</Label>
                        <Select value={tradeType} onValueChange={setTradeType}>
                             <SelectTrigger className="h-20 bg-black/50 border-white/10 rounded-[2.5rem] font-black text-xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] px-10 text-center justify-center">
                                <SelectValue placeholder="Select Protocol" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[2.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                <SelectItem value="even-odd" className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 font-black">Even / Odd Matrix</SelectItem>
                                <SelectItem value="matches-differs" className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 font-black">Matches / Differs Matrix</SelectItem>
                                <SelectItem value="over-under" className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 font-black">Over / Under Matrix</SelectItem>
                                <SelectItem value="rise-fall" className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 font-black">Rise / Fall Matrix</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.7em] text-primary ml-4">DATA HORIZON</Label>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-20 bg-black/50 border-white/10 rounded-[2.5rem] font-black text-4xl text-primary text-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] relative z-10"
                            />
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-20"><Activity size={32} /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <Card className="lg:col-span-2 border-none shadow-[0_40px_120px_rgba(0,0,0,0.8)] bg-slate-950/80 backdrop-blur-[80px] overflow-hidden relative rounded-[4rem]">
                    <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-cyan-400 to-primary" />
                    <CardHeader className="pb-8 px-12 pt-12">
                        <div className="flex items-center justify-between gap-10">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary/20 rounded-[1.5rem] border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                                    <Layers className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-black uppercase tracking-[0.5em] text-primary">Live Volumetric Flux</CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground/60 mt-2 tracking-widest">REAL-TIME SEQUENCE SCANNER</CardDescription>
                                </div>
                            </div>
                            <div className="text-right bg-white/5 px-8 py-3 rounded-[1.5rem] border border-white/10">
                                <p className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">GLOBAL PIVOT</p>
                                <p className="text-3xl font-black text-white tabular-nums tracking-tighter">{price.toFixed(decimalPlaces)}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-12 pb-14 space-y-12">
                        <div className="flex flex-wrap gap-4 min-h-[56px] p-6 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner">
                            {renderSequence()}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {activeChartData.map((data, idx) => (
                                <div key={idx} className="bg-black/60 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl transition-all hover:bg-black/80">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: data.color }} />
                                    <div className="flex items-center justify-between mb-6">
                                        <p className="text-[12px] font-black tracking-[0.4em] uppercase" style={{ color: data.color }}>{data.name} RATIO</p>
                                        <span className="text-4xl font-black tabular-nums text-white tracking-tighter">{data.value.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-4 overflow-hidden border border-white/5 shadow-inner">
                                        <div 
                                            className="h-full transition-all duration-1000 ease-out shadow-[0_0_20px]" 
                                            style={{ 
                                                width: `${data.value}%`, 
                                                backgroundColor: data.color, 
                                                boxShadow: `0 0 20px ${data.color}40` 
                                            }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-12 h-full flex flex-col">
                    <Card className="border-none shadow-[0_40px_120px_rgba(0,0,0,0.8)] bg-slate-950/90 backdrop-blur-[80px] overflow-hidden relative flex flex-col p-10 h-full rounded-[4rem]">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                        <CardHeader className="text-center pb-8 px-0">
                            <CardTitle className="text-[12px] font-black uppercase tracking-[0.8em] text-cyan-400">ANALYSIS HUD</CardTitle>
                        </CardHeader>
                        
                        <div className="flex-1 relative flex items-center justify-center py-6">
                            <ChartContainer config={{}} className="w-full aspect-square max-w-[240px]">
                                <PieChart>
                                    <Pie
                                        data={activeChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={6}
                                        stroke="none"
                                    >
                                        {activeChartData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.color} 
                                                className="hover:opacity-80 transition-opacity drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={() => null} />
                                </PieChart>
                            </ChartContainer>
                            
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="p-3 bg-cyan-400/10 rounded-full mb-3 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                    <Activity className="h-6 w-6 text-cyan-400 animate-pulse" />
                                </div>
                                <span className="text-5xl font-black tracking-tighter tabular-nums text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                    {activeChartData[0]?.value.toFixed(0)}
                                    <span className="text-xl opacity-40 ml-1">%</span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/60 mt-2">{activeChartData[0]?.name} VECTOR</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-auto">
                            {activeChartData.map((data, idx) => (
                                <div key={idx} className="text-center p-6 rounded-[2rem] bg-black/40 border border-white/5 group transition-all hover:bg-black/60 shadow-xl">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-3 group-hover:opacity-100 transition-opacity" style={{ color: data.color }}>{data.name}</p>
                                    <p className="text-3xl font-black tabular-nums" style={{ color: data.color }}>{data.value.toFixed(1)}%</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="border-none bg-slate-950/80 border border-white/5 p-8 rounded-[3rem] flex items-center justify-between shadow-2xl">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-primary/10 rounded-[1.5rem]">
                                <Boxes className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">PATTERN RECURSION</p>
                                <p className="text-2xl font-black text-white">{patternIntelligence.repeat !== null ? `REPETITION: ${patternIntelligence.repeat}` : 'SCANNING...'}</p>
                            </div>
                        </div>
                        <SignalHigh className={cn("h-8 w-8", patternIntelligence.intensity > 50 ? "text-emerald-400" : "text-primary/40")} />
                    </Card>
                </div>
            </div>

            {tradeType === 'matches-differs' && (
                <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-slate-900/40 backdrop-blur-[60px] p-12 rounded-[4rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
                    <div className="flex items-center gap-6 mb-10">
                        <div className="p-4 bg-emerald-500/10 rounded-full">
                            <Hash className="h-6 w-6 text-emerald-400" />
                        </div>
                        <p className="text-[14px] font-black uppercase tracking-[0.6em] text-white">SELECT TARGET DIGIT VECTOR</p>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-6">
                        {Array.from({ length: 10 }, (_, i) => (
                            <Button
                                key={i}
                                variant={matchesDigit === i ? 'default' : 'outline'}
                                className={cn(
                                    'h-20 rounded-[2rem] text-3xl font-black transition-all duration-500 relative overflow-hidden',
                                    matchesDigit === i 
                                        ? 'bg-emerald-500 text-white shadow-[0_20px_50px_rgba(16,185,129,0.4)] scale-110 z-10 border-none' 
                                        : 'bg-black/40 border-white/5 hover:bg-white/10 hover:border-emerald-500/30'
                                )}
                                onClick={() => setMatchesDigit(i)}
                            >
                                {matchesDigit === i && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                                {i}
                            </Button>
                        ))}
                    </div>
                </Card>
            )}

            {tradeType === 'over-under' && (
                <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.8)] bg-slate-900/40 backdrop-blur-[60px] p-12 rounded-[4rem] relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-2 h-full bg-cyan-500/40 group-hover:bg-cyan-500 transition-colors" />
                     <div className="flex items-center gap-6 mb-10">
                        <div className="p-4 bg-cyan-500/10 rounded-full">
                            <BarChartHorizontal className="h-6 w-6 text-cyan-400" />
                        </div>
                        <p className="text-[14px] font-black uppercase tracking-[0.6em] text-white">SELECT BARRIER PIVOT LEVEL</p>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-6">
                        {Array.from({ length: 10 }, (_, i) => (
                            <Button
                                key={i}
                                variant={overUnderDigit === i ? 'default' : 'outline'}
                                className={cn(
                                    'h-20 rounded-[2rem] text-3xl font-black transition-all duration-500 relative overflow-hidden',
                                    overUnderDigit === i 
                                        ? 'bg-cyan-500 text-white shadow-[0_20px_50px_rgba(6,182,212,0.4)] scale-110 z-10 border-none' 
                                        : 'bg-black/40 border-white/5 hover:bg-white/10 hover:border-cyan-500/30'
                                )}
                                onClick={() => setOverUnderDigit(i)}
                            >
                                {overUnderDigit === i && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                                {i}
                            </Button>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
