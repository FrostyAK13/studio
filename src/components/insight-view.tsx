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

    const DirectionalIcon = ({ direction }: { direction: string }) => {
        const isUp = direction.includes('RISE') || direction.includes('OVER') || direction.includes('EVEN') || direction.includes('MATCH');
        const isDown = direction.includes('FALL') || direction.includes('UNDER') || direction.includes('ODD');
        
        if (isUp) return <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />;
        if (isDown) return <TrendingDown className="h-5 w-5 sm:h-7 sm:w-7 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />;
        return <Crosshair className="h-5 w-5 sm:h-7 sm:w-7 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />;
    };

    const ProtocolCard = ({ insight }: { insight: ProtocolInsight }) => {
        const isPositive = insight.direction.includes('RISE') || insight.direction.includes('OVER') || insight.direction.includes('EVEN') || insight.direction.includes('MATCH');
        const riskLevel = insight.confidence > 90 ? 'STABLE' : insight.confidence > 80 ? 'LOW' : 'MODERATE';
        
        return (
            <div className="p-4 sm:p-6 bg-black/60 rounded-2xl sm:rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-xl transition-all hover:bg-black/80 hover:border-primary/20">
                <div className="absolute top-0 right-0 p-3 sm:p-5 opacity-10 group-hover:opacity-100 transition-opacity">
                    <DirectionalIcon direction={insight.direction} />
                </div>
                
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <p className="font-black text-primary text-[7px] sm:text-[9px] uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                        <Zap className="h-3 w-3 sm:h-4 w-4" /> // {insight.strategy.toUpperCase()}
                    </p>
                    <Badge className={cn(
                        "font-black tracking-widest text-[6px] sm:text-[8px] px-2 py-0.5",
                        riskLevel === 'STABLE' ? "bg-emerald-500/10 text-emerald-400" : riskLevel === 'LOW' ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                        {riskLevel}
                    </Badge>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <div className="flex items-center gap-2 sm:gap-3 mb-1">
                            <span className="text-base sm:text-2xl font-black text-white tracking-tighter drop-shadow-md">{insight.direction}</span>
                            {isPositive ? <ArrowUp className="h-3 w-3 sm:h-5 sm:w-5 text-emerald-400 animate-bounce" /> : <ArrowDown className="h-3 w-3 sm:h-5 sm:w-5 text-rose-500 animate-bounce" />}
                        </div>
                        <p className="text-[7px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-wider">{insight.summary}</p>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                        <div className="flex justify-between items-end">
                             <div className="flex items-baseline gap-1 sm:gap-1.5">
                                <span className="text-sm sm:text-xl font-black text-emerald-400 tabular-nums tracking-tighter">
                                    {insight.confidence.toFixed(0)}%
                                </span>
                                <p className="text-[6px] sm:text-[8px] font-black text-muted-foreground uppercase tracking-widest">STABILITY</p>
                             </div>
                             <Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400/40" />
                        </div>
                        <Progress value={insight.confidence} className="h-1 sm:h-1.5 bg-black/60 [&>div]:bg-emerald-500" />
                    </div>

                    <div className="pt-2 sm:pt-4 border-t border-white/5">
                        <p className="text-[9px] sm:text-[12px] font-medium text-white/60 leading-relaxed italic border-l-2 border-primary/40 pl-2">
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
                            <div className="text-left text-rose-400 flex items-start gap-3 p-4 sm:p-6 bg-rose-950/20 rounded-2xl sm:rounded-[2rem] border border-rose-500/30">
                                <ShieldAlert className="h-5 w-5 sm:h-8 sm:w-8 flex-shrink-0 mt-0.5 animate-pulse"/>
                                <div>
                                    <p className="font-black text-sm sm:text-xl uppercase tracking-widest">ERROR</p>
                                    <p className="font-mono text-[9px] sm:text-[13px] opacity-80 mt-1 leading-relaxed">{error}</p>
                                </div>
                            </div>
                        ) : multiInsight ? (
                            <div className="text-left space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-[2rem] border border-white/10 shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="font-black text-primary text-[7px] sm:text-[10px] uppercase tracking-widest mb-1.5 sm:mb-3 flex items-center gap-2">
                                        <Layers className="h-3 w-3 sm:h-4 sm:w-4" /> // STRATEGY SYNOPSIS
                                    </p>
                                    <p className="text-[11px] sm:text-base font-medium text-white/90 leading-relaxed italic px-1">"{multiInsight.globalSummary}"</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
        <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700 pb-24 overflow-hidden">
             <Card className="border-none shadow-xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-2xl sm:rounded-[2.5rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-5 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-12 items-center">
                    <div className="space-y-2 sm:space-y-3">
                        <Label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary ml-1">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-10 sm:h-14 bg-black/60 border-white/10 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base px-4 focus:ring-primary/40">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-xl sm:rounded-2xl border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-2.5 px-4 font-black text-[11px] sm:text-xs">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                        <Label className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-primary ml-1">ANALYSIS HORIZON</Label>
                        <div className="relative">
                            <div className="h-10 sm:h-14 bg-black/60 border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-xl text-primary shadow-inner border border-primary/20">
                                {maxTicks} <span className="text-[7px] sm:text-[9px] opacity-40 ml-2 sm:ml-3 tracking-widest uppercase font-bold">TICKS</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-between px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_12px_rgba(var(--primary),0.3)]">
                            <Bot className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-xl font-black uppercase tracking-widest text-foreground leading-tight">STRATEGY INTELLIGENCE</h3>
                        </div>
                    </div>
                    <div className="text-center sm:text-right bg-card/60 px-4 sm:px-6 py-1.5 sm:py-3 rounded-xl sm:rounded-2xl border border-white/10 shadow-lg w-full sm:w-auto">
                         <p className="text-[7px] sm:text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">LIVE PIVOT</p>
                         <p className="text-base sm:text-2xl font-black text-foreground tabular-nums tracking-tighter">{price.toFixed(decimalPlaces)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <DigitFrequencyCircles 
                        ticks={lastDigitTicks} 
                        selectedDigit={selectedDigit}
                        onDigitSelect={setSelectedDigit}
                        selectedMarket={selectedMarket}
                    />

                    <div className="text-center py-4">
                        <Button 
                            onClick={runAnalysis} 
                            disabled={analysisState === 'analyzing'} 
                            className={cn(
                                "h-10 sm:h-14 px-6 sm:px-10 rounded-full font-black text-[8px] sm:text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 group relative overflow-hidden",
                                analysisState === 'analyzing' ? "bg-slate-800 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {analysisState === 'analyzing' ? (
                                <>
                                    <Activity className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                    SCANNING...
                                </>
                            ) : (
                                <>
                                <Zap className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                                INITIATE SCAN
                                </>
                            )}
                        </Button>
                    </div>
                    
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
