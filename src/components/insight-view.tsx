'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, AlertTriangle, Target, Zap, ShieldCheck, Info, Activity, ArrowUp, ArrowDown, TrendingUp, TrendingDown, Layers, Crosshair } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { ScannerAnimationContent } from './scanner-animation-content';
import { generateInsight, type MultiProtocolOutput, type ProtocolInsight } from '@/lib/insight-generator';
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
                setError(`Data sequence unstable. Minimum 50 ticks required for deep protocol analysis.`);
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
        
        if (isUp) return <TrendingUp className="h-10 w-10 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />;
        if (isDown) return <TrendingDown className="h-10 w-10 text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]" />;
        return <Crosshair className="h-10 w-10 text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.6)]" />;
    };

    const ProtocolCard = ({ insight }: { insight: ProtocolInsight }) => {
        const isPositive = insight.direction.includes('RISE') || insight.direction.includes('OVER') || insight.direction.includes('EVEN') || insight.direction.includes('MATCH');
        
        return (
            <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl transition-all hover:bg-black/60 hover:border-primary/20">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                    <DirectionalIcon direction={insight.direction} />
                </div>
                
                <p className="font-black text-primary text-[10px] uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                    <Zap className="h-3 w-3" /> // PROTOCOL: {insight.strategy.toUpperCase()}
                </p>

                <div className="space-y-6">
                    <div>
                        <Badge className={cn(
                            "h-10 px-6 border-none text-[10px] font-black uppercase rounded-xl tracking-[0.2em] mb-4",
                            isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        )}>
                            {insight.summary}
                        </Badge>
                        <div className="flex items-center gap-4">
                            <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{insight.direction}</span>
                            {isPositive ? <ArrowUp className="h-6 w-6 text-emerald-400 animate-pulse" /> : <ArrowDown className="h-6 w-6 text-rose-500 animate-pulse" />}
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                         <span className="text-3xl font-black text-emerald-400 tabular-nums tracking-tighter">
                            {insight.confidence.toFixed(1)}%
                        </span>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">CONFIDENCE</p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] font-mono text-white/50 leading-relaxed italic">"{insight.reasoning}"</p>
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
                    <HackerAnimation title={`INTELLIGENCE REPORT: ${marketName.toUpperCase()} MULTI-VECTOR SCAN`}>
                        {analysisState === 'analyzing' ? (
                            <ScannerAnimationContent />
                        ) : error ? (
                            <div className="text-left text-rose-400 flex items-start gap-6 p-6 bg-rose-950/20 rounded-[2rem] border border-rose-500/30">
                                <AlertTriangle className="h-8 w-8 flex-shrink-0 mt-1"/>
                                <div>
                                    <p className="font-black text-xl uppercase tracking-widest">Logic Failure</p>
                                    <p className="font-mono text-sm opacity-80 mt-2">{error}</p>
                                </div>
                            </div>
                        ) : multiInsight ? (
                            <div className="text-left space-y-8 animate-in fade-in duration-700">
                                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 shadow-inner">
                                    <p className="font-black text-primary text-[11px] uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                        <Layers className="h-4 w-4" /> // GLOBAL STRATEGY SYNOPSIS
                                    </p>
                                    <p className="text-lg font-medium text-white/90 leading-relaxed italic">"{multiInsight.globalSummary}"</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
             <Card className="border-none shadow-[0_30px_90px_rgba(0,0,0,0.7)] bg-slate-900/40 backdrop-blur-[60px] overflow-hidden relative rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-10 sm:p-14 grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-20 items-center">
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.6em] text-primary ml-2">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-20 bg-black/50 border-white/10 rounded-[2rem] font-black text-xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] px-10 transition-all focus:ring-primary/40">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={8} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[2rem] border-white/10 bg-slate-950 text-white z-[100] shadow-[0_20px_50px_rgba(0,0,0,1)]">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-4 px-6 font-black text-base transition-colors">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-6">
                        <Label className="text-[14px] font-black uppercase tracking-[0.6em] text-primary ml-2">ANALYSIS HORIZON</Label>
                        <div className="relative">
                            <div className="h-20 bg-black/50 border-white/10 rounded-[2rem] flex items-center justify-center font-black text-4xl text-primary shadow-[inset_0_2px_15px_rgba(0,0,0,0.6)] border border-primary/10">
                                {maxTicks} <span className="text-sm opacity-40 ml-4 tracking-[0.5em] uppercase font-bold">TICKS</span>
                            </div>
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Activity size={32} /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-10">
                <div className="flex flex-col sm:flex-row items-center gap-8 justify-between px-10">
                    <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center border-2 border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.3)] group transition-transform hover:scale-110">
                            <Bot className="h-8 w-8 text-primary drop-shadow-[0_0_12px_rgba(var(--primary),1)]" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-2xl font-black uppercase tracking-[0.4em] text-white">STRATEGY INTELLIGENCE</h3>
                            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-primary/70 mt-2">Precision Multi-Protocol Analysis Matrix</p>
                        </div>
                    </div>
                    <div className="text-center sm:text-right bg-white/5 px-10 py-4 rounded-[1.5rem] border border-white/5">
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.5em] mb-2">LIVE DATA PIVOT</p>
                         <p className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{price.toFixed(decimalPlaces)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    <DigitFrequencyCircles 
                        ticks={lastDigitTicks} 
                        selectedDigit={selectedDigit}
                        onDigitSelect={setSelectedDigit}
                        selectedMarket={selectedMarket}
                        onMarketChange={onMarketChange}
                    />

                    <div className="text-center py-10">
                        <Button 
                            onClick={runAnalysis} 
                            disabled={analysisState === 'analyzing'} 
                            className={cn(
                                "h-20 px-16 rounded-full font-black text-base uppercase tracking-[0.4em] shadow-[0_20px_60px_rgba(var(--primary),0.4)] transition-all active:scale-95 group relative overflow-hidden",
                                analysisState === 'analyzing' ? "bg-slate-800 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {analysisState === 'analyzing' ? (
                                <>
                                    <Bot className="mr-4 h-8 w-8 animate-spin" />
                                    DEEP SCAN IN PROGRESS...
                                </>
                            ) : (
                                <>
                                <Sparkles className="mr-4 h-8 w-8" />
                                INITIATE DEEP ANALYSIS
                                </>
                            )}
                        </Button>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.6em] mt-6 animate-pulse">Ready for multi-protocol vectoring</p>
                    </div>
                    
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
