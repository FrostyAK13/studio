'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RiseFallAnalysis } from './rise-fall-analysis';
import { DigitFrequencyCircles } from './correlation-view';
import { Target, Zap, TrendingUp, TrendingDown, Info, List, Hash, ShieldCheck, Activity, BarChart3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DigitFrequencyViewProps {
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

const DigitDetailInsights = ({ digit, ticks }: { digit: number, ticks: number[] }) => {
    const stats = React.useMemo(() => {
        const total = ticks.length || 1;
        const matches = ticks.filter(t => t === digit).length;
        const actualFreq = (matches / total) * 100;
        const expectedFreq = 10;
        const skew = actualFreq - expectedFreq;
        
        // Ticks since last
        let tsl = 0;
        for (let i = 0; i < ticks.length; i++) {
            if (ticks[i] === digit) break;
            tsl++;
        }

        const over = ticks.filter(t => t > digit).length;
        const under = ticks.filter(t => t < digit).length;
        const ouTotal = (over + under) || 1;

        return {
            actualFreq,
            skew,
            tsl,
            matches,
            differs: total - matches,
            over: (over / ouTotal) * 100,
            under: (under / ouTotal) * 100,
            totalTicks: total
        };
    }, [digit, ticks]);

    return (
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ticks Since Last */}
                <Card className="border-none bg-slate-950/40 backdrop-blur-md shadow-xl border-l-2 border-primary">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">TSL (Ticks Since Last)</p>
                            <p className="text-2xl font-black text-white">{stats.tsl}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Activity className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                {/* Probability Skew */}
                <Card className={cn(
                    "border-none bg-slate-950/40 backdrop-blur-md shadow-xl border-l-2",
                    stats.skew >= 0 ? "border-emerald-500" : "border-rose-500"
                )}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Probability Skew</p>
                            <p className={cn("text-2xl font-black", stats.skew >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                {stats.skew >= 0 ? '+' : ''}{stats.skew.toFixed(1)}%
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                    </CardContent>
                </Card>

                {/* Accuracy Status */}
                <Card className="border-none bg-slate-950/40 backdrop-blur-md shadow-xl border-l-2 border-cyan-400">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Accuracy Ratio</p>
                            <p className="text-2xl font-black text-cyan-400">{stats.actualFreq.toFixed(1)}%</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-cyan-400/10 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-cyan-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Zap className="h-3 w-3 text-primary" /> Digit {digit} Precision
                        </h4>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black">ACTIVE FLOW</Badge>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                                <span>Matches Result</span>
                                <span className="text-white">{stats.matches}</span>
                            </div>
                            <Progress value={stats.actualFreq * 4} className="h-1.5 bg-white/5 [&>div]:bg-primary shadow-[0_0_8px_rgba(var(--primary),0.3)]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                                <span>Differs Variance</span>
                                <span className="text-white">{stats.differs}</span>
                            </div>
                            <Progress value={100 - (stats.actualFreq * 4)} className="h-1.5 bg-white/5 [&>div]:bg-muted-foreground/40" />
                        </div>
                    </div>
                 </div>

                 <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Target className="h-3 w-3 text-accent" /> Relative Barrier Skew
                        </h4>
                        <Badge variant="outline" className="border-accent/30 text-accent text-[8px] font-black">MARKET DEPTH</Badge>
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                                <span>Over {digit} Weight</span>
                                <span className="text-accent">{stats.over.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.over} className="h-1.5 bg-white/5 [&>div]:bg-accent shadow-[0_0_8px_rgba(var(--accent),0.3)]" />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                                <span>Under {digit} Weight</span>
                                <span className="text-rose-400">{stats.under.toFixed(1)}%</span>
                            </div>
                            <Progress value={stats.under} className="h-1.5 bg-white/5 [&>div]:bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export function DigitFrequencyView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
}: DigitFrequencyViewProps) {
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks;
        if (ticks.length < 2) return null;

        const total = ticks.length;
        const evenCount = ticks.filter(d => d % 2 === 0).length;
        const evenPercentage = (evenCount / total) * 100;
        const oddPercentage = 100 - evenPercentage;
        
        let evenOddReversal: 'Even' | 'Odd' | 'None' = 'None';
        if (ticks.length >= 10) {
            const lastFive = ticks.slice(0, 5).map(d => d % 2 === 0 ? 'E' : 'O');
            if (lastFive.every(o => o === 'E')) evenOddReversal = 'Odd';
            if (lastFive.every(o => o === 'O')) evenOddReversal = 'Even';
        }
        
        const counts = Array(10).fill(0);
        ticks.forEach(digit => { counts[digit]++; });
        const hottestDigit = counts.reduce((maxIndex, p, i, arr) => p > arr[maxIndex] ? i : maxIndex, 0);
        const matchesPercentage = (counts[hottestDigit] / total) * 100;
        
        const lowerCount = ticks.filter(d => d <= 4).length;
        const lowerPercentage = (lowerCount / total) * 100;
        const higherPercentage = 100 - lowerPercentage;
        
        return {
            evenOdd: { 
                reversal: evenOddReversal, 
                even: evenPercentage, 
                odd: oddPercentage,
                evenColor: 'hsl(var(--chart-1))',
                oddColor: 'hsl(var(--chart-3))'
            },
            matchesDiffers: { 
                hottest: hottestDigit, 
                matches: matchesPercentage, 
                differs: 100 - matchesPercentage,
                matchColor: 'hsl(var(--chart-2))',
                differColor: 'hsl(var(--chart-5))'
            },
            overUnder: { 
                lower: lowerPercentage, 
                higher: higherPercentage,
                lowerColor: 'hsl(var(--accent))',
                higherColor: 'hsl(var(--destructive))'
            }
        };
    }, [lastDigitTicks]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                    <div className="space-y-2">
                        <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">Configuration Matrix</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-10 sm:h-12 bg-background/40 border-white/5 rounded-xl font-bold">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-white/10">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id}>
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">(TICKS)</Label>
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

            <DigitFrequencyCircles 
                ticks={lastDigitTicks} 
                selectedDigit={selectedDigit}
                onDigitSelect={setSelectedDigit}
                selectedMarket={selectedMarket}
            />

            {selectedDigit !== null && (
                <DigitDetailInsights digit={selectedDigit} ticks={lastDigitTicks} />
            )}

            <Card className="border-none shadow-2xl bg-slate-950/80 backdrop-blur-xl overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-primary to-cyan-400" />
                 <CardContent className="p-4 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
                    <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
                            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        </div>
                        <div className="truncate">
                            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-muted-foreground/60">Global HUD Pivot</p>
                            <p className="text-2xl sm:text-5xl font-black text-foreground tracking-tighter tabular-nums truncate">
                                {price.toFixed(decimalPlaces)}
                            </p>
                        </div>
                    </div>
                    
                    {marketDirectionAnalysis && (
                        <div className="flex gap-6 sm:gap-12 text-center bg-white/5 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-3xl border border-white/5 w-full md:w-auto">
                            <div className="flex-1">
                                <p className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 truncate">Bullish Bias</p>
                                <p className="text-xl sm:text-3xl font-black text-emerald-400 tabular-nums">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</p>
                            </div>
                            <div className="w-[1px] h-10 sm:h-12 bg-white/10 shrink-0" />
                            <div className="flex-1">
                                <p className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 truncate">Bearish Bias</p>
                                <p className="text-xl sm:text-3xl font-black text-rose-500 tabular-nums">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden">
                <CardHeader className="text-center pb-2 border-b border-white/5">
                    <CardTitle className="text-[9px] sm:text-xs font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] flex items-center justify-center gap-2 sm:gap-3">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        Intelligence Grid
                        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-8">
                    {!marketDirectionAnalysis ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronizing Intelligence Stream...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                             {/* Even / Odd */}
                             <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <h4 className="font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-2 flex items-center gap-2">
                                    <List className="h-3 w-3 text-chart-1" /> Even / Odd
                                </h4>
                                <div className="space-y-4 sm:space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                            <span>Even Flow</span>
                                            <span className="text-chart-1">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--chart-1),0.4)]" style={{ width: `${marketDirectionAnalysis.evenOdd.even}%`, backgroundColor: marketDirectionAnalysis.evenOdd.evenColor }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                            <span>Odd Flow</span>
                                            <span className="text-chart-3">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--chart-3),0.4)]" style={{ width: `${marketDirectionAnalysis.evenOdd.odd}%`, backgroundColor: marketDirectionAnalysis.evenOdd.oddColor }}></div>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <Badge variant={marketDirectionAnalysis.evenOdd.reversal !== 'None' ? 'destructive' : 'outline'} className="w-full justify-center text-[9px] font-black tracking-widest rounded-xl py-1">
                                            REVERSAL: {marketDirectionAnalysis.evenOdd.reversal.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Over / Under */}
                            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <h4 className="font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Target className="h-3 w-3 text-accent" /> Over 4 / Under 5
                                </h4>
                                <div className="space-y-4 sm:space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                            <span>Under 5</span>
                                            <span className="text-accent">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--accent),0.4)]" style={{ width: `${marketDirectionAnalysis.overUnder.lower}%`, backgroundColor: marketDirectionAnalysis.overUnder.lowerColor }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                            <span>Over 4</span>
                                            <span className="text-rose-500">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--destructive),0.4)]" style={{ width: `${marketDirectionAnalysis.overUnder.higher}%`, backgroundColor: marketDirectionAnalysis.overUnder.higherColor }}></div>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <Badge variant="outline" className="w-full justify-center text-[9px] font-black tracking-widest rounded-xl border-white/10 py-1">
                                            {marketDirectionAnalysis.overUnder.lower > marketDirectionAnalysis.overUnder.higher ? 'BEARISH BIAS' : 'BULLISH BIAS'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Match / Differ */}
                            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <h4 className="font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Hash className="h-3 w-3 text-chart-2" /> Match / Differ
                                </h4>
                                <div className="space-y-4 sm:space-y-5">
                                     <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                            <span>Matches (Digit {marketDirectionAnalysis.matchesDiffers.hottest})</span>
                                            <span className="text-chart-2">{marketDirectionAnalysis.matchesDiffers.matches.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--chart-2),0.4)]" style={{ width: `${marketDirectionAnalysis.matchesDiffers.matches}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.matchColor }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
                                            <span>Differs Flow</span>
                                            <span className="text-chart-5">{marketDirectionAnalysis.matchesDiffers.differs.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--chart-5),0.4)]" style={{ width: `${marketDirectionAnalysis.matchesDiffers.differs}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.differColor }}></div>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <Badge variant="outline" className="w-full justify-center text-[9px] font-black tracking-widest rounded-xl border-white/10 py-1">
                                            REPETITION: {marketDirectionAnalysis.matchesDiffers.matches > 12.5 ? 'HIGH' : 'NORMAL'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <RiseFallAnalysis 
                priceHistory={priceHistory}
                selectedMarket={selectedMarket}
                price={price}
                decimalPlaces={decimalPlaces}
                variant="compact"
            />
        </div>
    );
}
