'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, BarChartHorizontal, Hash, List } from 'lucide-react';
import { Button } from './ui/button';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';


interface AnalyzerViewProps {
    price: number;
    lastDigitTicks: number[];
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
        const evenPercentage = lastDigitTicks.length > 0 ? (evenCount / lastDigitTicks.length) * 100 : 0;
        const oddPercentage = lastDigitTicks.length > 0 ? (oddCount / lastDigitTicks.length) * 100 : 0;
        return [
            { name: 'Even', value: evenPercentage, color: 'hsl(var(--chart-1))' },
            { name: 'Odd', value: oddPercentage, color: 'hsl(var(--chart-3))' },
        ];
    }, [lastDigitTicks]);
    const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
    const oddCount = lastDigitTicks.length - evenCount;
    const evenOddOutcomes = lastDigitTicks.map(digit => (digit % 2 === 0 ? 'E' : 'O'));


    const matchesDiffersChartData = React.useMemo(() => {
        const matchesCount = lastDigitTicks.filter(d => d === matchesDigit).length;
        const differsCount = lastDigitTicks.length - matchesCount;
        const matchesPercentage = lastDigitTicks.length > 0 ? (matchesCount / lastDigitTicks.length) * 100 : 0;
        const differsPercentage = lastDigitTicks.length > 0 ? (differsCount / lastDigitTicks.length) * 100 : 0;
         return [
            { name: 'Matches', value: matchesPercentage, color: 'hsl(var(--chart-2))' },
            { name: 'Differs', value: differsPercentage, color: 'hsl(var(--chart-5))' },
        ];
    }, [lastDigitTicks, matchesDigit]);
    const matchesCount = lastDigitTicks.filter(d => d === matchesDigit).length;
    const differsCount = lastDigitTicks.length - matchesCount;
    const matchesDiffersOutcomes = lastDigitTicks.map(digit => (digit === matchesDigit ? 'M' : 'D'));


    const overUnderChartData = React.useMemo(() => {
        const overCount = lastDigitTicks.filter(d => d > overUnderDigit).length;
        const underCount = lastDigitTicks.filter(d => d < overUnderDigit).length;
        const relevantOverUnderTicksCount = overCount + underCount;
        const overPercentage = relevantOverUnderTicksCount > 0 ? (overCount / relevantOverUnderTicksCount) * 100 : 0;
        const underPercentage = relevantOverUnderTicksCount > 0 ? (underCount / relevantOverUnderTicksCount) * 100 : 0;
        return [
            { name: 'Over', value: overPercentage, color: 'hsl(var(--accent))' },
            { name: 'Under', value: underPercentage, color: 'hsl(var(--destructive))' },
        ];
    }, [lastDigitTicks, overUnderDigit]);
    const overCount = lastDigitTicks.filter(d => d > overUnderDigit).length;
    const underCount = lastDigitTicks.filter(d => d < overUnderDigit).length;
    const overUnderOutcomes = lastDigitTicks.map(digit => {
        if (digit > overUnderDigit) return 'O';
        if (digit < overUnderDigit) return 'U';
        return 'E';
    });


    return (
        <div className="space-y-6">
             <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="analyzer-market-select">Synthetic Market</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger id="analyzer-market-select">
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
                        <Label htmlFor="analyzer-trade-type">Trade Type</Label>
                        <Select value={tradeType} onValueChange={setTradeType}>
                             <SelectTrigger id="analyzer-trade-type">
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
                        <Label htmlFor="max-ticks-analyzer" className="uppercase tracking-widest text-[10px] font-bold text-muted-foreground">(TICKS)</Label>
                        <Input
                            id="max-ticks-analyzer"
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

            {tradeType === 'even-odd' && (
                <>
                    <Card>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">CURRENT PRICE</p>
                                <p className="text-4xl font-bold text-primary">{price.toFixed(decimalPlaces)}</p>
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
                            {[...evenOddOutcomes.slice(0, 30)].reverse().map((o, i) => (
                                <div key={i} className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-white", o === 'E' ? 'bg-chart-1' : 'bg-chart-3')}>
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
                                    <div className="bg-chart-1 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${evenOddChartData[0].value}%` }}>
                                        {evenOddChartData[0].value.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>Odd</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                     <div className="bg-chart-3 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${evenOddChartData[1].value}%` }}>
                                       {evenOddChartData[1].value.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Probability Distribution</CardTitle>
                            <CardDescription>Current Price: {price.toFixed(decimalPlaces)}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-0">
                            <ChartContainer config={{}} className="mx-auto aspect-square h-[400px]">
                                <PieChart>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                            <div className="min-w-[8rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
                                                <p className="font-bold text-foreground">{`${data.name}`}</p>
                                                <p className="text-muted-foreground">{`Probability: ${data.value.toFixed(1)}%`}</p>
                                            </div>
                                            );
                                        }
                                        return null;
                                        }}
                                    />
                                    <Pie
                                        data={evenOddChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        labelLine={false}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value}) => {
                                            const RADIAN = Math.PI / 180
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.6
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN)

                                            if (value < 5) return null;

                                            return (
                                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-base font-bold">
                                                    {`${value.toFixed(0)}%`}
                                                </text>
                                            )
                                        }}
                                    >
                                        {evenOddChartData.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={entry.color} className="stroke-background hover:opacity-80" />
                                        ))}
                                    </Pie>
                                    <Legend content={({ payload }) => (
                                        <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 text-sm">
                                            {payload?.map((entry, index) => (
                                                <li key={`item-${index}`} className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-muted-foreground">{entry.value}:</span>
                                                    <span className="font-medium">{evenOddChartData[index].value.toFixed(1)}%</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )} />
                                </PieChart>
                            </ChartContainer>
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
                                <p className="text-4xl font-bold text-primary">{price.toFixed(decimalPlaces)}</p>
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
                            {[...matchesDiffersOutcomes.slice(0, 30)].reverse().map((o, i) => (
                                <div key={i} className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-white", o === 'M' ? 'bg-chart-2' : 'bg-chart-5')}>
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
                                    <div className="bg-chart-2 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${matchesDiffersChartData[0].value}%` }}>
                                        {matchesDiffersChartData[0].value.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>Differs</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                     <div className="bg-chart-5 h-full flex items-center justify-center text-white font-bold text-xs" style={{ width: `${matchesDiffersChartData[1].value}%` }}>
                                       {matchesDiffersChartData[1].value.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Probability Distribution</CardTitle>
                            <CardDescription>Current Price: {price.toFixed(decimalPlaces)}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-0">
                            <ChartContainer config={{}} className="mx-auto aspect-square h-[400px]">
                                <PieChart>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                            <div className="min-w-[8rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
                                                <p className="font-bold text-foreground">{`${data.name}`}</p>
                                                <p className="text-muted-foreground">{`Probability: ${data.value.toFixed(1)}%`}</p>
                                            </div>
                                            );
                                        }
                                        return null;
                                        }}
                                    />
                                    <Pie
                                        data={matchesDiffersChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        labelLine={false}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value}) => {
                                            const RADIAN = Math.PI / 180
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.6
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN)

                                            if (value < 5) return null;

                                            return (
                                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-base font-bold">
                                                    {`${value.toFixed(0)}%`}
                                                </text>
                                            )
                                        }}
                                    >
                                        {matchesDiffersChartData.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={entry.color} className="stroke-background hover:opacity-80" />
                                        ))}
                                    </Pie>
                                    <Legend content={({ payload }) => (
                                        <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 text-sm">
                                            {payload?.map((entry, index) => (
                                                <li key={`item-${index}`} className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-muted-foreground">{entry.value}:</span>
                                                    <span className="font-medium">{matchesDiffersChartData[index].value.toFixed(1)}%</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )} />
                                </PieChart>
                            </ChartContainer>
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
                                <p className="text-4xl font-bold text-primary">{price.toFixed(decimalPlaces)}</p>
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
                            {[...overUnderOutcomes.slice(0, 30)].reverse().map((o, i) => (
                                <div key={i} className={cn("flex items-center justify-center w-8 h-8 rounded-full font-bold text-white", o === 'O' ? 'bg-accent' : o === 'U' ? 'bg-destructive' : 'bg-slate-400')}>
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
                                    <div className="bg-accent h-full flex items-center justify-center text-accent-foreground font-bold text-xs" style={{ width: `${overUnderChartData[0].value}%` }}>
                                        {overUnderChartData[0].value.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>Under</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-8 overflow-hidden border">
                                     <div className="bg-destructive h-full flex items-center justify-center text-destructive-foreground font-bold text-xs" style={{ width: `${overUnderChartData[1].value}%` }}>
                                       {overUnderChartData[1].value.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Probability Distribution</CardTitle>
                            <CardDescription>Current Price: {price.toFixed(decimalPlaces)}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-0">
                            <ChartContainer config={{}} className="mx-auto aspect-square h-[400px]">
                                <PieChart>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                            <div className="min-w-[8rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
                                                <p className="font-bold text-foreground">{`${data.name}`}</p>
                                                <p className="text-muted-foreground">{`Probability: ${data.value.toFixed(1)}%`}</p>
                                            </div>
                                            );
                                        }
                                        return null;
                                        }}
                                    />
                                    <Pie
                                        data={overUnderChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        labelLine={false}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, value}) => {
                                            const RADIAN = Math.PI / 180
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.6
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN)

                                            if (value < 5) return null;

                                            return (
                                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-base font-bold">
                                                    {`${value.toFixed(0)}%`}
                                                </text>
                                            )
                                        }}
                                    >
                                        {overUnderChartData.map((entry) => (
                                            <Cell key={`cell-${entry.name}`} fill={entry.color} className="stroke-background hover:opacity-80" />
                                        ))}
                                    </Pie>
                                    <Legend content={({ payload }) => (
                                        <ul className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-4 text-sm">
                                            {payload?.map((entry, index) => (
                                                <li key={`item-${index}`} className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-muted-foreground">{entry.value}:</span>
                                                    <span className="font-medium">{overUnderChartData[index].value.toFixed(1)}%</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )} />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
