'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, BarChartHorizontal, Hash, List } from 'lucide-react';
import { Button } from './ui/button';


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
    const [matchesDigit, setMatchesDigit] = React.useState(0);
    const [overUnderDigit, setOverUnderDigit] = React.useState(5);
    
    // Even/Odd calculations
    const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
    const oddCount = lastDigitTicks.length - evenCount;
    const evenPercentage = lastDigitTicks.length > 0 ? (evenCount / lastDigitTicks.length) * 100 : 0;
    const oddPercentage = lastDigitTicks.length > 0 ? (oddCount / lastDigitTicks.length) * 100 : 0;
    const evenOddOutcomes = lastDigitTicks.map(digit => (digit % 2 === 0 ? 'E' : 'O'));

    // Matches/Differs calculations
    const matchesCount = lastDigitTicks.filter(d => d === matchesDigit).length;
    const differsCount = lastDigitTicks.length - matchesCount;
    const matchesPercentage = lastDigitTicks.length > 0 ? (matchesCount / lastDigitTicks.length) * 100 : 0;
    const differsPercentage = lastDigitTicks.length > 0 ? (differsCount / lastDigitTicks.length) * 100 : 0;
    const matchesDiffersOutcomes = lastDigitTicks.map(digit => (digit === matchesDigit ? 'M' : 'D'));

    // Over/Under calculations
    const relevantOverUnderTicks = lastDigitTicks.filter(d => d !== overUnderDigit);
    const overCount = relevantOverUnderTicks.filter(d => d > overUnderDigit).length;
    const underCount = relevantOverUnderTicks.length - overCount;
    const overPercentage = relevantOverUnderTicks.length > 0 ? (overCount / relevantOverUnderTicks.length) * 100 : 0;
    const underPercentage = relevantOverUnderTicks.length > 0 ? (underCount / relevantOverUnderTicks.length) * 100 : 0;
    const overUnderOutcomes = lastDigitTicks.map(digit => {
        if (digit > overUnderDigit) return 'O';
        if (digit < overUnderDigit) return 'U';
        return 'N'; // N for neutral/equal, will be filtered out for display
    }).filter(d => d !== 'N');


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
                                <SelectItem value="matches-differs">Matches/Differs</SelectItem>
                                <SelectItem value="over-under">Over/Under</SelectItem>
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
                            {evenOddOutcomes.slice(0, 30).map((o, i) => (
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

            {tradeType === 'matches-differs' && (
                <>
                    <Card>
                         <CardContent className="p-6">
                            <Label>Select a digit to analyze</Label>
                            <div className="flex justify-center flex-wrap gap-2 mt-4">
                                {Array.from({ length: 10 }, (_, i) => (
                                    <Button
                                    key={i}
                                    variant={matchesDigit === i ? 'default' : 'outline'}
                                    className={cn(
                                        'w-12 h-12 rounded-lg text-lg font-bold',
                                        matchesDigit === i ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-card'
                                    )}
                                    onClick={() => setMatchesDigit(i)}
                                    >
                                    {i}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">CURRENT PRICE</p>
                                <p className="text-4xl font-bold text-primary">{price.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-8 text-center">
                                <div>
                                    <p className="text-muted-foreground">Matches</p>
                                    <p className="text-2xl font-bold">{matchesCount}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Differs</p>
                                    <p className="text-2xl font-bold">{differsCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Hash className="h-5 w-5 text-muted-foreground" /> Matches/Differs Pattern
                        </CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {matchesDiffersOutcomes.slice(0, 30).map((o, i) => (
                                <div key={i} className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-white", o === 'M' ? 'bg-orange-500' : 'bg-gray-500')}>
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
                                    <span>Matches</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                    <div className="bg-green-500 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${matchesPercentage}%` }}>
                                        {matchesPercentage.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>Differs</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                     <div className="bg-red-500 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${differsPercentage}%` }}>
                                       {differsPercentage.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {tradeType === 'over-under' && (
                <>
                    <Card>
                         <CardContent className="p-6">
                            <Label>Select a digit to analyze</Label>
                            <div className="flex justify-center flex-wrap gap-2 mt-4">
                                {Array.from({ length: 10 }, (_, i) => (
                                    <Button
                                    key={i}
                                    variant={overUnderDigit === i ? 'default' : 'outline'}
                                    className={cn(
                                        'w-12 h-12 rounded-lg text-lg font-bold',
                                        overUnderDigit === i ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-card'
                                    )}
                                    onClick={() => setOverUnderDigit(i)}
                                    >
                                    {i}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">CURRENT PRICE</p>
                                <p className="text-4xl font-bold text-primary">{price.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-8 text-center">
                                <div>
                                    <p className="text-muted-foreground">Over</p>
                                    <p className="text-2xl font-bold">{overCount}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Under</p>
                                    <p className="text-2xl font-bold">{underCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2">
                           <div className="flex flex-col"><ArrowUp className="h-3 w-3"/><ArrowDown className="h-3 w-3"/></div> Over/Under Pattern
                        </CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {overUnderOutcomes.slice(0, 30).map((o, i) => (
                                <div key={i} className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-white", o === 'O' ? 'bg-teal-500' : 'bg-purple-500')}>
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
                                    <span>Over</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                    <div className="bg-green-500 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${overPercentage}%` }}>
                                        {overPercentage.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>Under</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                     <div className="bg-red-500 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${underPercentage}%` }}>
                                       {underPercentage.toFixed(1)}%
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
