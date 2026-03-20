'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, BarChartHorizontal, Hash, List, TrendingUp, TrendingDown, Target, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
    
    const evenOddChartData = React.useMemo(() => {
        const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
        const oddCount = lastDigitTicks.length - evenCount;
        const total = lastDigitTicks.length || 1;
        return [
            { name: 'Even', value: (evenCount / total) * 100, color: 'hsl(var(--chart-1))' },
            { name: 'Odd', value: (oddCount / total) * 100, color: 'hsl(var(--chart-3))' },
        ];
    }, [lastDigitTicks]);

    const evenOddOutcomes = lastDigitTicks.map(digit => (digit % 2 === 0 ? 'E' : 'O'));

    const matchesDiffersChartData = React.useMemo(() => {
        const matchesCount = lastDigitTicks.filter(d => d === matchesDigit).length;
        const total = lastDigitTicks.length || 1;
        return [
            { name: 'Matches', value: (matchesCount / total) * 100, color: 'hsl(var(--chart-2))' },
            { name: 'Differs', value: ((total - matchesCount) / total) * 100, color: 'hsl(var(--chart-5))' },
        ];
    }, [lastDigitTicks, matchesDigit]);

    const matchesDiffersOutcomes = lastDigitTicks.map(digit => (digit === matchesDigit ? 'M' : 'D'));

    const overUnderChartData = React.useMemo(() => {
        const overCount = lastDigitTicks.filter(d => d > overUnderDigit).length;
        const underCount = lastDigitTicks.filter(d => d < overUnderDigit).length;
        const relevantCount = (overCount + underCount) || 1;
        return [
            { name: 'Over', value: (overCount / relevantCount) * 100, color: 'hsl(var(--accent))' },
            { name: 'Under', value: (underCount / relevantCount) * 100, color: 'hsl(var(--destructive))' },
        ];
    }, [lastDigitTicks, overUnderDigit]);

    const overUnderOutcomes = lastDigitTicks.map(digit => {
        if (digit > overUnderDigit) return 'O';
        if (digit < overUnderDigit) return 'U';
        return 'E';
    });

    const riseFallChartData = React.useMemo(() => {
        if (priceHistory.length < 2) return [
            { name: 'Rise', value: 0, color: 'hsl(var(--accent))' },
            { name: 'Fall', value: 0, color: 'hsl(var(--destructive))' },
        ];
        let riseCount = 0;
        let fallCount = 0;
        for (let i = 0; i < priceHistory.length - 1; i++) {
            if (priceHistory[i] > priceHistory[i+1]) riseCount++;
            else if (priceHistory[i] < priceHistory[i+1]) fallCount++;
        }
        const total = (riseCount + fallCount) || 1;
        return [
            { name: 'Rise', value: (riseCount / total) * 100, color: 'hsl(var(--accent))' },
            { name: 'Fall', value: (fallCount / total) * 100, color: 'hsl(var(--destructive))' },
        ];
    }, [priceHistory]);

    const riseFallOutcomes = React.useMemo(() => {
        const outcomes: string[] = [];
        for (let i = 0; i < priceHistory.length - 1; i++) {
            if (priceHistory[i] > priceHistory[i+1]) outcomes.push('R');
            else if (priceHistory[i] < priceHistory[i+1]) outcomes.push('F');
            else outcomes.push('S');
        }
        return outcomes;
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

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                    <div className="space-y-1 sm:space-y-2">
                        <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Market Matrix</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-10 sm:h-12 bg-background/40 border-white/5 rounded-xl font-bold">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={4} className="rounded-xl border-white/10 bg-slate-950 text-white z-[100]">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-2">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                        <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Algorithm Type</Label>
                        <Select value={tradeType} onValueChange={setTradeType}>
                             <SelectTrigger className="h-10 sm:h-12 bg-background/40 border-white/5 rounded-xl font-bold">
                                <SelectValue placeholder="Select Trade Type" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={4} className="rounded-xl border-white/10 bg-slate-950 text-white z-[100]">
                                <SelectItem value="even-odd" className="focus:bg-primary/20 focus:text-white cursor-pointer py-2">Even / Odd</SelectItem>
                                <SelectItem value="matches-differs" className="focus:bg-primary/20 focus:text-white cursor-pointer py-2">Matches / Differs</SelectItem>
                                <SelectItem value="over-under" className="focus:bg-primary/20 focus:text-white cursor-pointer py-2">Over / Under</SelectItem>
                                <SelectItem value="rise-fall" className="focus:bg-primary/20 focus:text-white cursor-pointer py-2">Rise / Fall</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                        <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">(TICKS)</Label>
                        <Input
                            type="number"
                            min="1"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                            className="h-10 sm:h-12 bg-background/40 border-white/5 rounded-xl font-black text-base sm:text-lg text-primary text-center"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="lg:col-span-2 border-none shadow-2xl bg-slate-950/80 backdrop-blur-xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-primary to-purple-500" />
                    <CardHeader className="pb-2 px-4 sm:px-6">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <CardTitle className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-primary">Live Probabilities</CardTitle>
                                <CardDescription className="text-[8px] sm:text-[10px] font-bold uppercase text-muted-foreground mt-1">Real-time Sequence Analysis</CardDescription>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Pivot</p>
                                <p className="text-lg sm:text-2xl font-black text-foreground tracking-tighter tabular-nums">{price.toFixed(decimalPlaces)}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8 min-h-[40px] sm:min-h-[48px]">
                            {(() => {
                                const outcomes = tradeType === 'even-odd' ? evenOddOutcomes : 
                                               tradeType === 'matches-differs' ? matchesDiffersOutcomes :
                                               tradeType === 'over-under' ? overUnderOutcomes :
                                               riseFallOutcomes;
                                return [...outcomes.slice(0, 24)].reverse().map((o, i) => (
                                    <div key={i} className={cn(
                                        "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-sm border border-white/5 shadow-lg shrink-0",
                                        (o === 'E' || o === 'M' || o === 'O' || o === 'R') 
                                            ? 'bg-gradient-to-br from-primary to-blue-600 text-white' 
                                            : 'bg-white/5 text-muted-foreground'
                                    )}>
                                        {o}
                                    </div>
                                ));
                            })()}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {activeChartData.map((data, idx) => (
                                <div key={idx} className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 relative overflow-hidden group">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: `${data.color}05` }} />
                                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                        <p className="text-[8px] sm:text-[10px] font-black tracking-widest uppercase opacity-70" style={{ color: data.color }}>{data.name} RATIO</p>
                                        <span className="text-xl sm:text-2xl font-black tabular-nums">{data.value.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden border border-white/5">
                                        <div className="h-full transition-all duration-1000 ease-out shadow-[0_0_12px]" style={{ width: `${data.value}%`, backgroundColor: data.color, boxShadow: `0 0 12px ${data.color}40` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-xl overflow-hidden relative flex flex-col p-4 sm:p-6 h-full min-h-[320px] sm:min-h-[380px]">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30" />
                    <CardHeader className="text-center pb-0 px-0">
                        <CardTitle className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] text-cyan-400/80">HUD DISTRIBUTION</CardTitle>
                    </CardHeader>
                    
                    <div className="flex-1 relative flex items-center justify-center py-4">
                        <ChartContainer config={{}} className="w-full aspect-square max-w-[160px] sm:max-w-[200px]">
                            <PieChart>
                                <Pie
                                    data={activeChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={4}
                                    stroke="none"
                                >
                                    {activeChartData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color} 
                                            className="hover:opacity-80 transition-opacity drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={() => null} />
                            </PieChart>
                        </ChartContainer>
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <Activity className="h-4 sm:h-5 w-4 sm:w-5 text-cyan-400/40 mb-1 animate-pulse" />
                            <span className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums text-white">
                                {activeChartData[0]?.value.toFixed(0)}
                                <span className="text-xs sm:text-sm opacity-40 ml-0.5">%</span>
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">{activeChartData[0]?.name} FLOW</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-auto">
                         {activeChartData.map((data, idx) => (
                            <div key={idx} className="text-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">{data.name}</p>
                                <p className="text-lg font-black tabular-nums" style={{ color: data.color }}>{data.value.toFixed(1)}%</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {tradeType === 'matches-differs' && (
                <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-xl p-4 sm:p-8 rounded-2xl sm:rounded-3xl">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <Hash className="h-4 sm:h-5 w-4 sm:w-5 text-primary" />
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">Select Digit Target</p>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
                        {Array.from({ length: 10 }, (_, i) => (
                            <Button
                                key={i}
                                variant={matchesDigit === i ? 'default' : 'outline'}
                                className={cn(
                                    'h-10 sm:h-14 rounded-xl text-lg sm:text-xl font-black transition-all duration-300',
                                    matchesDigit === i ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-105 sm:scale-110' : 'bg-background/40 border-white/5 hover:bg-white/10'
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
                <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-xl p-4 sm:p-8 rounded-2xl sm:rounded-3xl">
                     <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <BarChartHorizontal className="h-4 sm:h-5 w-4 sm:w-5 text-accent" />
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">Select Barrier Level</p>
                    </div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3">
                        {Array.from({ length: 10 }, (_, i) => (
                            <Button
                                key={i}
                                variant={overUnderDigit === i ? 'default' : 'outline'}
                                className={cn(
                                    'h-10 sm:h-14 rounded-xl text-lg sm:text-xl font-black transition-all duration-300',
                                    overUnderDigit === i ? 'bg-accent text-white shadow-xl shadow-accent/30 scale-105 sm:scale-110' : 'bg-background/40 border-white/5 hover:bg-white/10'
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
