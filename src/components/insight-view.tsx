'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, AlertTriangle, Target, Zap, ShieldCheck, Info, Activity, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Layers, Crosshair, ShieldAlert, Wallet, Gauge } from 'lucide-react';
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
                setError(`Data sequence unstable. Minimum 50 ticks required for deep tactical analysis.`);
                setAnalysisState('error');
                return;
            }

            try {
                const result = generateInsight(lastDigitTicks, priceHistory);
                setMultiInsight(result);
                setAnalysisState('complete');
            } catch (e: any) {
                setError(e.message || "An unexpected error occurred during deep scan.");
                setAnalysisState('error');
            }
        }, 2000);
    };

    const DirectionalIcon = ({ direction }: { direction: string }) => {
        const isUp = direction.includes('RISE') || direction.includes('OVER') || direction.includes('EVEN') || direction.includes('MATCH');
        const isDown = direction.includes('FALL') || direction.includes('UNDER') || direction.includes('ODD');
        
        if (isUp) return <TrendingUp className="h-6 w-6 sm:h-10 sm:w-10 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />;
        if (isDown) return <TrendingDown className="h-6 w-6 sm:h-10 sm:w-10 text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" />;
        return <Crosshair className="h-6 w-6 sm:h-10 sm:w-10 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />;
    };

    const ProtocolCard = ({ insight }: { insight: ProtocolInsight }) => {
        const isPositive = insight.direction.includes('RISE') || insight.direction.includes('OVER') || insight.direction.includes('EVEN') || insight.direction.includes('MATCH');
        const riskLevel = insight.confidence > 85 ? 'LOW' : insight.confidence > 70 ? 'MODERATE' : 'HIGH';
        
        return (
            <div className="p-4 sm:p-8 bg-black/60 rounded-[1.25rem] sm:rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-xl transition-all hover:bg-black/80 hover:border-primary/20">
                <div className="absolute top-0 right-0 p-3 sm:p-6 opacity-10 group-hover:opacity-100 transition-opacity">
                    <DirectionalIcon direction={insight.direction} />
                </div>
                
                <div className="flex items-center justify-between mb-3 sm:mb-6">
                    <p className="font-black text-primary text-[8px] sm:text-[10px] uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4" /> // {insight.strategy.toUpperCase()}
                    </p>
                    <Badge className={cn(
                        "font-black tracking-widest text-[7px] sm:text-[9px] px-2 sm:px-3 py-0.5",
                        riskLevel === 'LOW' ? "bg-emerald-500/10 text-emerald-400" : riskLevel === 'MODERATE' ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                        {riskLevel}
                    </Badge>
                </div>

                <div className="space-y-3 sm:space-y-6">
                    <div>
                        <div className="flex items-center gap-2 sm:gap-4 mb-1 sm:mb-2">
                            <span className="text-lg sm:text-3xl font-black text-white tracking-tighter drop-shadow-lg">{insight.direction}</span>
                            {isPositive ? <ArrowUp className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400 animate-bounce" /> : <ArrowDown className="h-4 w-4 sm:h-6 sm:w-6 text-rose-500 animate-bounce" />}
                        </div>
                        <p className="text-[8px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-wider">{insight.summary}</p>
                    </div>

                    <div className="space-y-1.5 sm:space-y-3">
                        <div className="flex justify-between items-end">
                             <div className="flex items-baseline gap-1 sm:gap-2">
                                <span className="text-base sm:text-2xl font-black text-emerald-400 tabular-nums tracking-tighter">
                                    {insight.confidence.toFixed(0)}%
                                </span>
                                <p className="text-[7px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest">CONFIDENCE</p>
                             </div>
                             <Gauge className="h-3 w-3 sm:h-5 sm:w-5 text-emerald-400/40" />
                        </div>
                        <Progress value={insight.confidence} className="h-1 sm:h-2 bg-black/60 [&>div]:bg-emerald-500" />
                    </div>

                    <div className="pt-3 sm:pt-6 border-t border-white/5">
                        <p className="text-[8px] sm:text-[11px] font-medium text-white/60 leading-relaxed italic border-l-2 border-primary/40 pl-3">
                            "{insight.reasoning}"
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (analysisState) {
            case 'analyzing':
            case 'complete':
            case 'error':
                 return (
                    <HackerAnimation title={`INTELLIGENCE REPORT: ${marketName.toUpperCase()}`}>
                        {analysisState === 'analyzing' ? (
                            <ScannerAnimationContent />
                        ) : error ? (
                            <div className="text-left text-rose-400 flex items-start gap-3 p-4 sm:p-8 bg-rose-950/20 rounded-[1.25rem] sm:rounded-[3rem] border border-rose-500/30">
                                <ShieldAlert className="h-6 w-6 sm:h-10 sm:w-10 flex-shrink-0 mt-1 animate-pulse"/>
                                <div>
                                    <p className="font-black text-base sm:text-2xl uppercase tracking-widest">LOGIC FAILURE</p>
                                    <p className="font-mono text-[10px] sm:text-base opacity-80 mt-1 leading-relaxed">{error}</p>
                                </div>
                            </div>
                        ) : multiInsight ? (
                            <div className="text-left space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="p-4 sm:p-8 bg-white/5 rounded-[1.25rem] sm:rounded-[3rem] border border-white/10 shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="font-black text-primary text-[8px] sm:text-[12px] uppercase tracking-widest mb-2 sm:mb-4 flex items-center gap-2">
                                        <Layers className="h-3 w-3 sm:h-5 sm:w-5" /> // GLOBAL STRATEGY SYNOPSIS
                                    </p>
                                    <p className="text-xs sm:text-lg font-medium text-white/90 leading-relaxed italic px-1 sm:px-2">"{multiInsight.globalSummary}"</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                    {multiInsight.protocols.map((p, idx) => (
                                        <ProtocolCard key={idx} insight={p} />
                                    ))}
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
        <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-24 overflow-hidden">
             <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[1.5rem] sm:rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-5 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-16 items-center">
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-12 sm:h-16 bg-black/60 border-white/10 rounded-[1rem] sm:rounded-[1.5rem] font-black text-xs sm:text-lg px-4 sm:px-8 focus:ring-primary/40">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-[1rem] sm:rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3 px-4 font-black text-xs sm:text-sm">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:space-y-4">
                        <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-primary ml-1">ANALYSIS HORIZON</Label>
                        <div className="relative">
                            <div className="h-12 sm:h-16 bg-black/60 border-white/10 rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center font-black text-lg sm:text-2xl text-primary shadow-inner border border-primary/20">
                                {maxTicks} <span className="text-[8px] sm:text-[10px] opacity-40 ml-2 sm:ml-4 tracking-widest uppercase font-bold">TICKS</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6 sm:space-y-10">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 justify-between px-4 sm:px-8">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                            <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-2xl font-black uppercase tracking-widest text-foreground leading-tight">STRATEGY INTELLIGENCE</h3>
                            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary/70 mt-1">PRECISION MULTI-ANALYSIS MATRIX</p>
                        </div>
                    </div>
                    <div className="text-center sm:text-right bg-card/60 px-5 sm:px-8 py-2 sm:py-4 rounded-[1rem] sm:rounded-[1.5rem] border border-white/10 shadow-lg w-full sm:w-auto">
                         <p className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">LIVE PIVOT</p>
                         <p className="text-lg sm:text-3xl font-black text-foreground tabular-nums tracking-tighter">{price.toFixed(decimalPlaces)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:gap-12">
                    <DigitFrequencyCircles 
                        ticks={lastDigitTicks} 
                        selectedDigit={selectedDigit}
                        onDigitSelect={setSelectedDigit}
                        selectedMarket={selectedMarket}
                    />

                    <div className="text-center py-4 sm:py-8">
                        <Button 
                            onClick={runAnalysis} 
                            disabled={analysisState === 'analyzing'} 
                            className={cn(
                                "h-12 sm:h-16 px-6 sm:px-12 rounded-full font-black text-[9px] sm:text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 group relative overflow-hidden",
                                analysisState === 'analyzing' ? "bg-slate-800 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {analysisState === 'analyzing' ? (
                                <>
                                    <Activity className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                    SCANNING...
                                </>
                            ) : (
                                <>
                                <Zap className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                                INITIATE DEEP TACTICAL SCAN
                                </>
                            )}
                        </Button>
                        <p className="text-[7px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-4 animate-pulse">Ready for multi-vector synchronization</p>
                    </div>
                    
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
