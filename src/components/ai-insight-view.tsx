'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Bot, Sparkles, AlertTriangle, Loader } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { ScannerAnimationContent } from './scanner-animation-content';
import { getMarketInsight, type MarketInsightOutput } from '@/ai/flows/market-insight-flow';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from '@/components/ui/progress';

interface AIInsightViewProps {
    price: number;
    decimalPlaces: number;
    lastDigitTicks: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
}

type AnalysisState = 'idle' | 'collecting' | 'analyzing' | 'complete' | 'error';

function DataCollectionAnimation({ progress, tickCount, recentTicks }: { progress: number, tickCount: number, recentTicks: number[] }) {
    return (
        <Card>
            <CardHeader>
                <div className='flex items-center gap-3'>
                    <Loader className="h-8 w-8 text-primary animate-spin"/>
                    <div>
                        <CardTitle className="text-2xl">Collecting Data</CardTitle>
                        <CardDescription>The AI is capturing the next 50 ticks for analysis.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">{tickCount} / 50 ticks collected</p>
                <div className="mt-4 p-4 bg-muted rounded-md min-h-[60px]">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">CAPTURED DIGITS</p>
                    <div className="flex flex-wrap gap-2">
                        {recentTicks.map((digit, i) => (
                            <div key={i} className="flex items-center justify-center w-7 h-7 rounded bg-background font-mono text-sm shadow-inner">
                                {digit}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


export function AIInsightView({ price, decimalPlaces, lastDigitTicks, selectedMarket, onMarketChange }: AIInsightViewProps) {
    const [analysisState, setAnalysisState] = React.useState<AnalysisState>('idle');
    const [collectedTicks, setCollectedTicks] = React.useState<number[]>([]);
    const [insight, setInsight] = React.useState<MarketInsightOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

    const runAnalysis = async (ticks: number[]) => {
        setAnalysisState('analyzing');
        try {
            // Ticks are collected with newest first, reverse for chronological order for the AI
            const ticksForAI = ticks.slice(0, 100).reverse();
            const result = await getMarketInsight({ ticks: ticksForAI, marketId: selectedMarket });
            setInsight(result);
            setAnalysisState('complete');
        } catch (e: any) {
            console.error(e);
            setError(e.message || "An unexpected error occurred.");
            setAnalysisState('error');
        }
    };

    const handleStartAnalysis = () => {
        setInsight(null);
        setError(null);
        setCollectedTicks([]);
        setAnalysisState('collecting');
    };

    React.useEffect(() => {
        if (analysisState !== 'collecting') {
            return;
        }

        // Check if a new tick has arrived. `lastDigitTicks` is prepended, so [0] is the newest.
        if (lastDigitTicks.length > 0 && (collectedTicks.length === 0 || lastDigitTicks[0] !== collectedTicks[0])) {
            const newCollected = [lastDigitTicks[0], ...collectedTicks];
            setCollectedTicks(newCollected);

            if (newCollected.length >= 50) {
                runAnalysis(newCollected);
            }
        }
    }, [lastDigitTicks, analysisState]); // Effect runs on each new tick from parent


    const renderContent = () => {
        switch (analysisState) {
            case 'collecting':
                return (
                    <DataCollectionAnimation
                        progress={(collectedTicks.length / 50) * 100}
                        tickCount={collectedTicks.length}
                        recentTicks={collectedTicks.slice(0, 24).reverse()}
                    />
                );
            case 'analyzing':
            case 'complete':
            case 'error':
                 return (
                    <HackerAnimation title={`AI Analysis Report - ${marketName}`}>
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
                    <BrainCircuit className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="text-2xl">AI Strategy Insight</CardTitle>
                        <CardDescription>Let an AI trading expert analyze the market and suggest a strategy.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <Label htmlFor="ai-market-select">Synthetic Market</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange} disabled={analysisState === 'collecting' || analysisState === 'analyzing'}>
                                <SelectTrigger id="ai-market-select">
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


                <div className="text-center">
                    <Button onClick={handleStartAnalysis} disabled={analysisState === 'collecting' || analysisState === 'analyzing'} size="lg">
                        {analysisState === 'collecting' ? (
                            <>
                                <Loader className="mr-2 h-5 w-5 animate-spin" />
                                Collecting Ticks...
                            </>
                        ) : analysisState === 'analyzing' ? (
                            <>
                                <Bot className="mr-2 h-5 w-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Get AI Insight
                            </>
                        )}
                    </Button>
                </div>
                
                {renderContent()}

            </CardContent>
        </Card>
    );
}
