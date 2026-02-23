'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Bot, Sparkles, AlertTriangle } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { ScannerAnimationContent } from './scanner-animation-content';
import { getMarketInsight, type MarketInsightOutput } from '@/ai/flows/market-insight-flow';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from './ui/badge';

interface AIInsightViewProps {
    lastDigitTicks: number[];
    selectedMarket: string;
}

export function AIInsightView({ lastDigitTicks, selectedMarket }: AIInsightViewProps) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [insight, setInsight] = React.useState<MarketInsightOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

    const handleGetInsight = async () => {
        setIsLoading(true);
        setInsight(null);
        setError(null);

        if (lastDigitTicks.length < 50) {
            setError("Not enough data to analyze. Please wait for at least 50 ticks.");
            setIsLoading(false);
            return;
        }

        try {
            const result = await getMarketInsight({ ticks: lastDigitTicks, marketId: selectedMarket });
            setInsight(result);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    

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
            <CardContent className="text-center space-y-6">
                <div className="p-6 bg-muted/50 rounded-lg">
                    <p className='text-sm text-muted-foreground'>CURRENT MARKET</p>
                    <p className='text-2xl font-bold text-primary'>{marketName}</p>
                </div>
                
                <Button onClick={handleGetInsight} disabled={isLoading} size="lg">
                    {isLoading ? (
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

                {(isLoading || insight || error) && (
                    <HackerAnimation title={`AI Analysis Report - ${marketName}`}>
                        {isLoading ? (
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
                )}

            </CardContent>
        </Card>
    );
}

