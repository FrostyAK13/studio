'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BarChartHorizontal, List } from 'lucide-react';


interface ClassicViewProps {
    price: number;
    lastDigitTicks: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
}

export function ClassicView({
    price,
    lastDigitTicks,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
}: ClassicViewProps) {
    const [tradeType, setTradeType] = React.useState('even-odd');
    
    // Even/Odd calculations
    const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
    const oddCount = lastDigitTicks.length - evenCount;
    const evenPercentage = lastDigitTicks.length > 0 ? (evenCount / lastDigitTicks.length) * 100 : 0;
    const oddPercentage = lastDigitTicks.length > 0 ? (oddCount / lastDigitTicks.length) * 100 : 0;
    const outcomes = lastDigitTicks.map(digit => (digit % 2 === 0 ? 'E' : 'O'));


    return (
        <div className="space-y-6">
             <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="classic-market-select">Synthetic Market</Label>
                        <Select defaultValue={syntheticIndices[0].id}>
                            <SelectTrigger id="classic-market-select">
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
                        <Label htmlFor="classic-trade-type">Trade Type</Label>
                        <Select value={tradeType} onValueChange={setTradeType}>
                             <SelectTrigger id="classic-trade-type">
                                <SelectValue placeholder="Select Trade Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="even-odd">Even/Odd</SelectItem>
                                <SelectItem value="matches-differs" disabled>Matches/Differs (soon)</SelectItem>
                                <SelectItem value="over-under" disabled>Over/Under (soon)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="max-ticks-classic">Number of Ticks to Analyze</Label>
                        <Input
                            id="max-ticks-classic"
                            type="number"
                            min="10"
                            max="5000"
                            value={maxTicks === 0 ? '' : maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                        />
                    </div>
                </CardContent>
            </Card>

            {tradeType === 'even-odd' && (
                <>
                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">CURRENT PRICE</p>
                                <p className="text-4xl font-bold text-primary">{price.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-8 text-center">
                                <div>
                                    <p className="text-muted-foreground">Even</p>
                                    <p className="text-2xl font-bold">{evenCount}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Odd</p>
                                    <p className="text-2xl font-bold">{oddCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2">
                            <List className="h-5 w-5 text-muted-foreground" /> Even/Odd Pattern
                        </CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {outcomes.slice(0, 30).map((o, i) => (
                                <div key={i} className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-white", o === 'E' ? 'bg-blue-600' : 'bg-red-600')}>
                                    {o}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2">
                           <BarChartHorizontal className="h-5 w-5 text-muted-foreground" /> Probability Analysis
                        </CardTitle></CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>Even</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                    <div className="bg-green-500 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${evenPercentage}%` }}>
                                        {evenPercentage.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>Odd</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                     <div className="bg-red-500 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${oddPercentage}%` }}>
                                       {oddPercentage.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
