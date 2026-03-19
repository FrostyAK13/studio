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

    const { highestDigit, lowestDigit } = React.useMemo(() => {
        if (lastDigitTicks.length === 0) {
            return { 
                highestDigit: { digit: '-', count: 0 }, 
                lowestDigit: { digit: '-', count: 0 }
            };
        }

        const counts = Array(10).fill(0);
        lastDigitTicks.forEach(digit => {
            counts[digit]++;
        });

        let highest = { digit: 0, count: counts[0] };
        let lowest = { digit: 0, count: counts[0] };

        for (let i = 1; i < 10; i++) {
            if (counts[i] > highest.count) {
                highest = { digit: i, count: counts[i] };
            }
            if (counts[i] < lowest.count) {
                lowest = { digit: i, count: counts[i] };
            }
        }
        
        return { highestDigit: highest, lowestDigit: lowest };
    }, [lastDigitTicks]);
    
    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks;
        if (ticks.length < 2) return null;

        const total = ticks.length;
        const evenCount = ticks.filter(d => d % 2 === 0).length;
        const evenPercentage = (evenCount / total) * 100;
        const oddPercentage = 100 - evenPercentage;
        
        let evenOddReversal: 'Even' | 'Odd' | 'None' = 'None';
        if (ticks.length >= 5) {
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
        <div className="space-y-6">
            <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="freq-market-select">Synthetic Market</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger id="freq-market-select">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent>
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id}>
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="max-ticks-frequency" className="uppercase tracking-widest text-[10px] font-bold text-muted-foreground">(TICKS)</Label>
                        <Input
                            id="max-ticks-frequency"
                            type="number"
                            min="1"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
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

            <Card>
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">CURRENT PRICE</p>
                        <p className="text-4xl font-bold text-primary">{price.toFixed(decimalPlaces)}</p>
                    </div>
                    <div className="flex gap-8 text-center">
                        <div>
                            <p className="text-muted-foreground">Highest Digit</p>
                            <p className="text-2xl font-bold">{highestDigit.count}</p>
                            <p className="text-sm text-muted-foreground">Digit {highestDigit.digit}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Lowest Digit</p>
                            <p className="text-2xl font-bold">{lowestDigit.count}</p>
                            <p className="text-sm text-muted-foreground">Digit {lowestDigit.digit}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold uppercase">Market Direction (Last {lastDigitTicks.length} Ticks)</CardTitle>
                    <CardDescription>Dynamic range analysis based on your selection.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!marketDirectionAnalysis ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Collecting data...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="p-4 border rounded-lg bg-card/30">
                                <h4 className="font-bold text-xs uppercase tracking-widest mb-3 text-muted-foreground">Even / Odd</h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between mb-1 text-[10px] font-bold uppercase">
                                            <span>Even</span>
                                            <span>{marketDirectionAnalysis.evenOdd.even.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                            <div className="h-full transition-all duration-500" style={{ width: `${marketDirectionAnalysis.evenOdd.even}%`, backgroundColor: marketDirectionAnalysis.evenOdd.evenColor }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1 text-[10px] font-bold uppercase">
                                            <span>Odd</span>
                                            <span>{marketDirectionAnalysis.evenOdd.odd.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                            <div className="h-full transition-all duration-500" style={{ width: `${marketDirectionAnalysis.evenOdd.odd}%`, backgroundColor: marketDirectionAnalysis.evenOdd.oddColor }}></div>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <Badge variant={marketDirectionAnalysis.evenOdd.reversal !== 'None' ? 'destructive' : 'outline'} className="w-full justify-center text-[9px] font-black tracking-tighter">
                                            REVERSAL: {marketDirectionAnalysis.evenOdd.reversal.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg bg-card/30">
                                <h4 className="font-bold text-xs uppercase tracking-widest mb-3 text-muted-foreground">Under 5 / Over 4</h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between mb-1 text-[10px] font-bold uppercase">
                                            <span>Under 5 (0-4)</span>
                                            <span>{marketDirectionAnalysis.overUnder.lower.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                            <div className="h-full transition-all duration-500" style={{ width: `${marketDirectionAnalysis.overUnder.lower}%`, backgroundColor: marketDirectionAnalysis.overUnder.lowerColor }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1 text-[10px] font-bold uppercase">
                                            <span>Over 4 (5-9)</span>
                                            <span>{marketDirectionAnalysis.overUnder.higher.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                            <div className="h-full transition-all duration-500" style={{ width: `${marketDirectionAnalysis.overUnder.higher}%`, backgroundColor: marketDirectionAnalysis.overUnder.higherColor }}></div>
                                        </div>
                                    </div>
                                     <div className="pt-1">
                                        <Badge variant="outline" className="w-full justify-center text-[9px] font-black tracking-tighter">
                                            {marketDirectionAnalysis.overUnder.lower > marketDirectionAnalysis.overUnder.higher ? 'BEARISH BIAS' : 'BULLISH BIAS'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg bg-card/30">
                                <h4 className="font-bold text-xs uppercase tracking-widest mb-3 text-muted-foreground">Match / Differ (Hot: {marketDirectionAnalysis.matchesDiffers.hottest})</h4>
                                <div className="space-y-3">
                                     <div>
                                        <div className="flex justify-between mb-1 text-[10px] font-bold uppercase">
                                            <span>Matches</span>
                                            <span>{marketDirectionAnalysis.matchesDiffers.matches.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                            <div className="h-full transition-all duration-500" style={{ width: `${marketDirectionAnalysis.matchesDiffers.matches}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.matchColor }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1 text-[10px] font-bold uppercase">
                                            <span>Differs</span>
                                            <span>{marketDirectionAnalysis.matchesDiffers.differs.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                            <div className="h-full transition-all duration-500" style={{ width: `${marketDirectionAnalysis.matchesDiffers.differs}%`, backgroundColor: marketDirectionAnalysis.matchesDiffers.differColor }}></div>
                                        </div>
                                    </div>
                                    <div className="pt-1">
                                        <Badge variant="outline" className="w-full justify-center text-[9px] font-black tracking-tighter">
                                            SIGNAL: {marketDirectionAnalysis.matchesDiffers.matches > (100/Math.max(lastDigitTicks.length, 1) + 5) ? 'MATCH POTENTIAL' : 'NORMAL RANGE'}
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
