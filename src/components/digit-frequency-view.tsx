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
import { Target, Zap, TrendingUp, TrendingDown, Info } from 'lucide-react';

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

    const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Market Selector</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-12 bg-background/40 border-white/5 rounded-xl font-bold">
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
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">(Ticks)</Label>
                        <Input
                            type="number"
                            min="1"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                            className="h-12 bg-background/40 border-white/5 rounded-xl font-black text-lg text-primary text-center"
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

            <Card className="border-none shadow-2xl bg-slate-950/80 backdrop-blur-xl overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-primary to-cyan-400" />
                 <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                            <Zap className="h-8 w-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Current Pivot</p>
                            <p className="text-5xl font-black text-foreground tracking-tighter tabular-nums">
                                {price.toFixed(decimalPlaces)}
                            </p>
                        </div>
                    </div>
                    
                    {marketDirectionAnalysis && (
                        <div className="flex gap-12 text-center bg-white/5 px-8 py-4 rounded-3xl border border-white/5">
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Bullish Bias</p>
                                <p className="text-3xl font-black text-emerald-400">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</p>
                            </div>
                            <div className="w-[1px] h-12 bg-white/10" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Bearish Bias</p>
                                <p className="text-3xl font-black text-rose-500">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden">
                <CardHeader className="text-center pb-2 border-b border-white/5">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Market Intelligence Grid
                        <TrendingDown className="h-4 w-4 text-primary" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    {!marketDirectionAnalysis ? (
                        <div className="text-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">Synchronizing Stream...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             {/* Even / Odd */}
                             <div className="space-y-6 p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-2 flex items-center gap-2">
                                    <List className="h-3 w-3 text-chart-1" /> Even / Odd
                                </h4>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase">
                                            <span>Even Flow</span>
                                            <span className="text-chart-1">{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--chart-1),0.4)]" style={{ width: `${marketDirectionAnalysis.evenOdd.even}%`, backgroundColor: marketDirectionAnalysis.evenOdd.evenColor }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase">
                                            <span>Odd Flow</span>
                                            <span className="text-chart-3">{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--chart-3),0.4)]" style={{ width: `${marketDirectionAnalysis.evenOdd.odd}%`, backgroundColor: marketDirectionAnalysis.evenOdd.oddColor }}></div>
                                        </div>
                                    </div>
                                    <Badge variant={marketDirectionAnalysis.evenOdd.reversal !== 'None' ? 'destructive' : 'outline'} className="w-full h-8 justify-center text-[10px] font-black tracking-widest rounded-xl">
                                        REVERSAL: {marketDirectionAnalysis.evenOdd.reversal.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            {/* Over / Under */}
                            <div className="space-y-6 p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Target className="h-3 w-3 text-accent" /> Over 4 / Under 5
                                </h4>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase">
                                            <span>Under 5 (0-4)</span>
                                            <span className="text-accent">{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--accent),0.4)]" style={{ width: `${marketDirectionAnalysis.overUnder.lower}%`, backgroundColor: marketDirectionAnalysis.overUnder.lowerColor }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase">
                                            <span>Over 4 (5-9)</span>
                                            <span className="text-rose-500">{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--destructive),0.4)]" style={{ width: `${marketDirectionAnalysis.overUnder.higher}%`, backgroundColor: marketDirectionAnalysis.overUnder.higherColor }}></div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="w-full h-8 justify-center text-[10px] font-black tracking-widest rounded-xl border-white/10">
                                        {marketDirectionAnalysis.overUnder.lower > marketDirectionAnalysis.overUnder.higher ? 'BEARISH MOMENTUM' : 'BULLISH MOMENTUM'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Match / Differ */}
                            <div className="space-y-6 p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Hash className="h-3 w-3 text-chart-2" /> Match / Differ
                                </h4>
                                <div className="space-y-5">
                                     <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase">
                                            <span>Matches (Digit {marketDirectionAnalysis.matchesDiffers.hottest})</span>
                                            <span className="text-chart-2">{marketDirectionAnalysis.matchesDiffers.matches.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--chart-2),0.4)]" style={{ width: `${marketDirectionAnalysis.matchesDiffers.matches}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.matchColor }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase">
                                            <span>Differs Flow</span>
                                            <span className="text-chart-5">{marketDirectionAnalysis.matchesDiffers.differs.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                            <div className="h-full transition-all duration-700 shadow-[0_0_8px_rgba(var(--chart-5),0.4)]" style={{ width: `${marketDirectionAnalysis.matchesDiffers.differs}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.differColor }}></div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="w-full h-8 justify-center text-[10px] font-black tracking-widest rounded-xl border-white/10">
                                        SIGNAL: {marketDirectionAnalysis.matchesDiffers.matches > 12 ? 'HIGH REPETITION' : 'NORMAL VARIANCE'}
                                    </Badge>
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

const Hash = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
);