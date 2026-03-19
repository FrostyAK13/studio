'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { ScannerAnimationContent } from './scanner-animation-content';
import { generateInsight, type InsightOutput } from '@/lib/insight-generator';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DigitFrequencyCircles } from './correlation-view';

interface InsightViewProps {
    price: number;
    decimalPlaces: number;
    lastDigitTicks: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
}

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';

export function InsightView({ price, decimalPlaces, lastDigitTicks, selectedMarket, onMarketChange }: InsightViewProps) {
    const [analysisState, setAnalysisState] = React.useState<AnalysisState>('idle');
    const [insight, setInsight] = React.useState<InsightOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    const marketName = React.useMemo(() => {
        return syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;
    }, [selectedMarket]);

    const runAnalysis = () => {
        setInsight(null);
        setError(null);
        setAnalysisState('analyzing');

        // Analysis baseline is now strictly 1000 ticks from the dashboard
        setTimeout(() => {
            if (lastDigitTicks.length < 50) {
                setError("Not enough data to generate an insight. Please wait for the 1000-tick buffer to populate.");
                setAnalysisState('error');
                return;
            }

            try {
                const result = generateInsight(lastDigitTicks);
                setInsight(result);
                setAnalysisState('complete');
            } catch (e: any) {
                console.error("Insight Generation Error:", e);
                setError(e.message || "An unexpected error occurred during analysis.");
                setAnalysisState('error');
            }
        }, 1500);
    };

    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks;
        if (ticks.length < 10) return null;

        const total = ticks.length;
        const lowerCount = ticks.filter(d => d <= 4).length;
        const lowerPercentage = (lowerCount / total) * 100;
        const higherPercentage = 100 - lowerPercentage;
        
        return {
            lower: lowerPercentage, 
            higher: higherPercentage,
            lowerColor: 'hsl(var(--accent))',
            higherColor: 'hsl(var(--destructive))'
        };
    }, [lastDigitTicks]);

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
                                    <p className="font-bold text-green-300">// MARKET SUMMARY (High-Precision 1000-Tick Sample)</p>
                                    <p className="text-base">{insight.summary}</p>
                                </div>
                                <div>
                                    <p className="font-bold text-green-300">// RECOMMENDATION</p>
                                    <div className='flex items-center gap-3'>
                                        <p className="text-base">Strategy:</p>
                                        <Badge variant={insight.recommendedStrategy === 'None' ? 'destructive' : 'secondary'} className="text-base font-bold uppercase">{insight.recommendedStrategy}</Badge>
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
                        <CardTitle className="text-2xl uppercase">Strategy Insight</CardTitle>
                        <CardDescription>High-accuracy analysis based on Deriv-standard 1000-tick samples.</CardDescription>
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
                        <span className="text-sm tracking-widest uppercase">Price</span>
                        <span className="text-4xl font-bold">{price.toFixed(decimalPlaces)}</span>
                    </div>
                </div>

                <DigitFrequencyCircles 
                    ticks={lastDigitTicks} 
                    selectedDigit={selectedDigit}
                    onDigitSelect={setSelectedDigit}
                    selectedMarket={selectedMarket}
                />

                {marketDirectionAnalysis && (
                     <Card className="border-none bg-muted/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black tracking-widest uppercase opacity-60">Market Dominance Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span>Under 5 (0-4)</span>
                                    <span>{marketDirectionAnalysis.lower.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div className="h-full transition-all duration-500" style={{ width: `${marketDirectionAnalysis.lower}%`, backgroundColor: marketDirectionAnalysis.lowerColor }}></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase">
                                    <span>Over 4 (5-9)</span>
                                    <span>{marketDirectionAnalysis.higher.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div className="h-full transition-all duration-500" style={{ width: `${marketDirectionAnalysis.higher}%`, backgroundColor: marketDirectionAnalysis.higherColor }}></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="text-center">
                    <Button onClick={runAnalysis} disabled={analysisState === 'analyzing'} size="lg" className="shadow-lg shadow-primary/20">
                        {analysisState === 'analyzing' ? (
                            <>
                                <Bot className="mr-2 h-5 w-5 animate-spin" />
                                ANALYZING...
                            </>
                        ) : (
                            <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            GET INSIGHT
                            </>
                        )}
                    </Button>
                </div>
                
                {renderContent()}

            </CardContent>
        </Card>
    );
}