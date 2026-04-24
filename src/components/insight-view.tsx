'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Zap, Activity, TrendingUp, TrendingDown, Layers, Crosshair, ShieldAlert, Gauge, ArrowUp, ArrowDown } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { ScannerAnimationContent } from './scanner-animation-content';
import { generateInsight, type MultiProtocolOutput, type ProtocolInsight } from '@/lib/insight-generator';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DigitFrequencyCircles } from './correlation-view';
import { Progress } from '@/components/ui/progress';

interface InsightViewProps {
    price: number;
    decimalPlaces: number;
    lastDigitTicks: number[];
    priceHistory: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    maxTicks: number;
}

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';

export function InsightView({ price, decimalPlaces, lastDigitTicks, priceHistory, selectedMarket, onMarketChange, maxTicks }: InsightViewProps) {
    const [analysisState, setAnalysisState] = React.useState<AnalysisState>('idle');
    const [multiInsight, setMultiInsight] = React.useState<MultiProtocolOutput | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedDigit, setSelectedDigit] = React.useState<number | null>(null);

    const marketName = React.useMemo(() => {
        return syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;
    }, [selectedMarket]);

    const runAnalysis = () => {
        setMultiInsight(null);
        setError(null);
        setAnalysisState('analyzing');

        setTimeout(() => {
            if (lastDigitTicks.length < 50 || priceHistory.length < 50) {
                setError(`Data sequence unstable. Minimum 50 ticks required for analysis.`);
                setAnalysisState('error');
                return;
            }

            try {
                const result = generateInsight(lastDigitTicks, priceHistory);
                setMultiInsight(result);
                setAnalysisState('complete');
            } catch (e: any) {
                setError(e.message || "An unexpected error occurred during scan.");
                setAnalysisState('error');
            }
        }, 2000);
    };

    const ProtocolCard = ({ insight }: { insight: ProtocolInsight }) => {
        const isPositive = insight.direction.includes('RISE') || insight.direction.includes('OVER') || insight.direction.includes('EVEN') || insight.direction.includes('MATCH');
        const riskLevel = insight.confidence > 90 ? 'STABLE' : insight.confidence > 80 ? 'LOW' : 'MODERATE';
        
        return (
            <div className="p-3 sm:p-5 bg-card rounded-2xl border border-border relative overflow-hidden group shadow-sm transition-all hover:bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                    <p className="font-black text-primary text-[7px] sm:text-[8px] uppercase tracking-widest flex items-center gap-1.5">
                        <Zap className="h-3 w-3" /> // {insight.strategy.toUpperCase()}
                    </p>
                    <Badge variant="secondary" className={cn(
                        "font-black tracking-widest text-[6px] sm:text-[7px] px-2 py-0.5 border-none uppercase",
                        riskLevel === 'STABLE' ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" : riskLevel === 'LOW' ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" : "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300"
                    )}>
                        {riskLevel}
                    </Badge>
                </div>

                <div className="space-y-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm sm:text-base font-black text-foreground tracking-tighter uppercase">{insight.direction}</span>
                            {isPositive ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-rose-600" />}
                        </div>
                        <p className="text-[7px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-widest">{insight.summary}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-end">
                             <div className="flex items-baseline gap-1">
                                <span className="text-xs sm:text-sm font-black text-emerald-600 tabular-nums tracking-tighter">
                                    {insight.confidence.toFixed(0)}%
                                </span>
                                <p className="text-[6px] font-black text-muted-foreground uppercase tracking-widest">STABILITY</p>
                             </div>
                        </div>
                        <Progress value={insight.confidence} className="h-1 bg-muted [&>div]:bg-emerald-500" />
                    </div>

                    <div className="pt-2 border-t border-border">
                        <p className="text-[8px] sm:text-[10px] font-medium text-muted-foreground leading-relaxed italic border-l-2 border-primary/40 pl-2">
                            "{insight.reasoning}"
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-24">
             <Card className="border-none shadow-sm bg-card overflow-hidden relative rounded-xl border border-border">
                <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">MARKET</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-8 bg-muted/50 border-border rounded-lg font-black text-[10px] px-4">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="font-black text-[10px]">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase tracking-[0.3em] text-primary ml-1">HORIZON</Label>
                        <div className="h-8 bg-muted/50 border-border rounded-lg flex items-center justify-center font-black text-xs text-primary shadow-inner">
                            {maxTicks} <span className="text-[6px] opacity-40 ml-1 tracking-widest uppercase">TICKS</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <h3 className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground">STRATEGY INTELLIGENCE</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <DigitFrequencyCircles 
                        ticks={lastDigitTicks} 
                        selectedDigit={selectedDigit}
                        onDigitSelect={setSelectedDigit}
                        selectedMarket={selectedMarket}
                    />

                    <div className="text-center">
                        <Button 
                            onClick={runAnalysis} 
                            disabled={analysisState === 'analyzing'} 
                            className={cn(
                                "h-10 px-8 rounded-full font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-95",
                                analysisState === 'analyzing' ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {analysisState === 'analyzing' ? "SCANNING..." : "INITIATE SCAN"}
                        </Button>
                    </div>
                    
                    {(analysisState === 'analyzing' || analysisState === 'complete' || analysisState === 'error') && (
                        <HackerAnimation title={`INTELLIGENCE REPORT`}>
                            {analysisState === 'analyzing' ? (
                                <ScannerAnimationContent />
                            ) : error ? (
                                <div className="text-left text-rose-600 flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900">
                                    <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5"/>
                                    <div>
                                        <p className="font-black text-[8px] uppercase tracking-widest">ERROR</p>
                                        <p className="font-mono text-[10px] opacity-80 mt-1">{error}</p>
                                    </div>
                                </div>
                            ) : multiInsight ? (
                                <div className="text-left space-y-4 animate-in fade-in duration-700">
                                    <div className="p-3 bg-muted/30 rounded-xl border border-border shadow-inner">
                                        <p className="font-black text-primary text-[7px] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <Layers className="h-3 w-3" /> // STRATEGY SYNOPSIS
                                        </p>
                                        <p className="text-[9px] sm:text-[11px] font-medium text-foreground leading-relaxed italic">"{multiInsight.globalSummary}"</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {multiInsight.protocols.map((p, idx) => (
                                            <ProtocolCard key={idx} insight={p} />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </HackerAnimation>
                    )}
                </div>
            </div>
        </div>
    );
}