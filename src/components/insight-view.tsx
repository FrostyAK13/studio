
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Bot, Sparkles, AlertTriangle, Loader } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { ScannerAnimationContent } from './scanner-animation-content';
import { generateInsight, type InsightOutput } from '@/lib/insight-generator';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface InsightViewProps {
    price: number;
    decimalPlaces: number;
    lastDigitTicks: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
}

const DigitFrequencyCircles = ({ 
    ticks, 
    selectedDigit, 
    onDigitSelect 
}: { 
    ticks: number[], 
    selectedDigit: number | null, 
    onDigitSelect: (d: number) => void 
}) => {
    const { digitData, lastDigit } = React.useMemo(() => {
        const counts = Array(10).fill(0);
        ticks.forEach(d => counts[d]++);
        const total = ticks.length || 1;
        
        const mapped = counts.map((count, index) => ({
            index,
            count,
            percentage: (count / total) * 100
        }));

        const sorted = [...mapped].sort((a, b) => b.count - a.count);

        return {
            digitData: mapped.map(item => {
                const rank = sorted.findIndex(s => s.index === item.index);
                let colorClass = "text-muted-foreground/20";
                
                if (rank === 0) colorClass = "text-emerald-400"; // Most (Green)
                else if (rank === 1) colorClass = "text-cyan-400"; // 2nd Most (Blue)
                else if (rank === 8) colorClass = "text-orange-400"; // 2nd Lowest (Orange)
                else if (rank === 9) colorClass = "text-rose-400"; // Lowest (Red)

                return { ...item, colorClass };
            }),
            lastDigit: ticks.length > 0 ? ticks[0] : null
        };
    }, [ticks]);

    const DigitCircle = ({ digit, percentage, colorClass, isLast, isSelected }: { 
        digit: number, 
        percentage: number, 
        colorClass: string, 
        isLast: boolean,
        isSelected: boolean 
    }) => {
        const radius = 28;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (Math.min(percentage, 25) / 25) * circumference;

        return (
            <div 
                className={cn(
                    "flex flex-col items-center relative cursor-pointer transition-all duration-300",
                    isSelected && "bg-primary/10 rounded-xl ring-1 ring-primary/30"
                )}
                onClick={() => onDigitSelect(digit)}
            >
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="3"
                            fill="transparent"
                            className="text-muted-foreground/5"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className={cn("transition-all duration-1000 ease-in-out", colorClass)}
                        />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                        <span className={cn(
                            "text-3xl font-black leading-none transition-colors",
                            isSelected ? "text-primary" : "text-foreground"
                        )}>{digit}</span>
                        <span className="text-[9px] font-bold text-muted-foreground mt-0.5">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
                {isLast && (
                    <div className="absolute -bottom-0.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-primary animate-bounce" />
                )}
            </div>
        );
    };

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md mb-6">
             <CardHeader className="pb-1 pt-3 text-center">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    DIGIT PERCENTAGE
                </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <div className="space-y-0.5">
                    <div className="grid grid-cols-5 gap-1 border-b border-white/5 pb-1">
                        {digitData.slice(0, 5).map((data) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                                isSelected={selectedDigit === data.index}
                            />
                        ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1 pt-1">
                        {digitData.slice(5, 10).map((data) => (
                            <DigitCircle 
                                key={data.index} 
                                digit={data.index} 
                                percentage={data.percentage} 
                                colorClass={data.colorClass} 
                                isLast={lastDigit === data.index}
                                isSelected={selectedDigit === data.index}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const DigitDetailPanel = ({ digit, ticks }: { digit: number, ticks: number[] }) => {
    const stats = React.useMemo(() => {
        const total = ticks.length || 1;
        const matches = ticks.filter(t => t === digit).length;
        const differs = total - matches;
        const over = ticks.filter(t => t > digit).length;
        const under = ticks.filter(t => t < digit).length;
        
        const ouTotal = (over + under) || 1;

        return {
            matches: (matches / total) * 100,
            differs: (differs / total) * 100,
            over: (over / ouTotal) * 100,
            under: (under / ouTotal) * 100,
            matchesCount: matches,
            differsCount: differs,
            overCount: over,
            underCount: under,
            totalTicks: total
        };
    }, [digit, ticks]);

    return (
        <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
            <Card className="border-none bg-indigo-950/20 backdrop-blur-xl shadow-2xl overflow-hidden relative border-t border-cyan-500/20">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 opacity-50" />
                <CardHeader className="pb-2 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-black text-cyan-400">DIGIT {digit} INSIGHTS</CardTitle>
                            <CardDescription className="text-cyan-100/40 uppercase tracking-widest text-[10px] font-bold">Midpoint Strategy Matrix</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-950/50 px-2 py-0.5 font-bold tracking-tighter text-[10px]">
                            {stats.totalTicks} TICKS
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end border-b border-white/5 pb-1">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Matching Frequency</h4>
                                <div className="text-right flex flex-col">
                                    <span className="text-2xl font-black text-emerald-400 leading-none">{stats.matches.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-emerald-300">Matches {digit}</span>
                                        <span className="text-emerald-400">{stats.matchesCount}</span>
                                    </div>
                                    <Progress value={stats.matches} className="h-2.5 bg-emerald-950/30 [&>div]:bg-gradient-to-r [&>div]:from-emerald-600 [&>div]:to-emerald-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-rose-300">All Differs</span>
                                        <span className="text-rose-400">{stats.differsCount}</span>
                                    </div>
                                    <Progress value={stats.differs} className="h-2.5 bg-rose-950/30 [&>div]:bg-gradient-to-r [&>div]:from-rose-600 [&>div]:to-rose-400" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-end border-b border-white/5 pb-1">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Relative Distribution</h4>
                                <div className="text-right flex flex-col">
                                    <span className="text-2xl font-black text-cyan-400 leading-none">{stats.over.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-cyan-300">Over {digit}</span>
                                        <span className="text-cyan-400">{stats.overCount}</span>
                                    </div>
                                    <Progress value={stats.over} className="h-2.5 bg-cyan-950/30 [&>div]:bg-gradient-to-r [&>div]:from-cyan-600 [&>div]:to-cyan-400" />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-orange-300">Under {digit}</span>
                                        <span className="text-orange-400">{stats.underCount}</span>
                                    </div>
                                    <Progress value={stats.under} className="h-2.5 bg-orange-950/30 [&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';

export function InsightView({ price, decimalPlaces, lastDigitTicks, selectedMarket, onMarketChange }: InsightViewProps) {
    const [analysisState, setAnalysisState] = React.useState<AnalysisState>('idle');
    const [insight, setInsight] = React.useState<InsightOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

    const runAnalysis = () => {
        setInsight(null);
        setError(null);
        setAnalysisState('analyzing');

        // Simulate analysis time for better UX
        setTimeout(() => {
            if (lastDigitTicks.length < 50) {
                setError("Not enough data to generate an insight. At least 50 ticks are required.");
                setAnalysisState('error');
                return;
            }

            try {
                const result = generateInsight(lastDigitTicks.slice(0, 50));
                setInsight(result);
                setAnalysisState('complete');
            } catch (e: any) {
                console.error("Insight Generation Error:", e);
                setError(e.message || "An unexpected error occurred during analysis.");
                setAnalysisState('error');
            }
        }, 1500);
    };

    const renderContent = () => {
        switch (analysisState) {
            case 'analyzing':
            case 'complete':
            case 'error':
                 return (
                    <HackerAnimation title={`Analysis Report - ${marketName}`}>
                        {analysisState === 'analyzing' ? (
                            <ScannerAnimationContent />
                        ) : error ? (
                            <div className="text-left text-red-400 flex items-start gap-4">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-1"/>
                                <div>
                                    <p className="font-bold text-lg">Analysis Failed</p>
                                    <p>{error}</p>
                                </div>
                            </div>
                        ) : insight ? (
                            <div className="text-left space-y-4">
                                <div>
                                    <p className="font-bold text-green-300">// MARKET SUMMARY</p>
                                    <p className="text-base">{insight.summary}</p>
                                </div>
                                <div>
                                    <p className="font-bold text-green-300">// RECOMMENDATION</p>
                                    <div className='flex items-center gap-3'>
                                        <p className="text-base">Strategy:</p>
                                        <Badge variant={insight.recommendedStrategy === 'None' ? 'destructive' : 'secondary'} className="text-base font-bold">{insight.recommendedStrategy}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-bold text-green-300">// REASONING</p>
                                    <p className="text-base">{insight.reasoning}</p>
                                </div>
                            </div>
                        ) : null}
                    </HackerAnimation>
                 );
            case 'idle':
            default:
                return null;
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center gap-3'>
                    <Lightbulb className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="text-2xl">Strategy Insight</CardTitle>
                        <CardDescription>Let our scanner analyze the market and suggest a strategy.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <Label htmlFor="insight-market-select">Synthetic Market</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange} disabled={analysisState === 'analyzing'}>
                                <SelectTrigger id="insight-market-select">
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
                        </CardContent>
                    </Card>
                    <div className="rounded-lg p-4 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                        <span className="text-sm tracking-widest">PRICE</span>
                        <span className="text-4xl font-bold">{price.toFixed(decimalPlaces)}</span>
                    </div>
                </div>

                <DigitFrequencyCircles 
                    ticks={lastDigitTicks} 
                    selectedDigit={selectedDigit}
                    onDigitSelect={setSelectedDigit}
                />

                {selectedDigit !== null && (
                    <DigitDetailPanel digit={selectedDigit} ticks={lastDigitTicks} />
                )}


                <div className="text-center">
                    <Button onClick={runAnalysis} disabled={analysisState === 'analyzing'} size="lg" className="shadow-lg shadow-primary/20">
                        {analysisState === 'analyzing' ? (
                            <>
                                <Bot className="mr-2 h-5 w-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Get Insight
                            </>
                        )}
                    </Button>
                </div>
                
                {renderContent()}

            </CardContent>
        </Card>
    );
}
