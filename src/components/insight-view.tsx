
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
        
        if (isUp) return <TrendingUp className="h-12 w-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.7)]" />;
        if (isDown) return <TrendingDown className="h-12 w-12 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.7)]" />;
        return <Crosshair className="h-12 w-12 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.7)]" />;
    };

    const ProtocolCard = ({ insight }: { insight: ProtocolInsight }) => {
        const isPositive = insight.direction.includes('RISE') || insight.direction.includes('OVER') || insight.direction.includes('EVEN') || insight.direction.includes('MATCH');
        const riskLevel = insight.confidence > 85 ? 'LOW' : insight.confidence > 70 ? 'MODERATE' : 'HIGH';
        
        return (
            <div className="p-10 bg-black/60 rounded-[3rem] border border-white/5 relative overflow-hidden group shadow-2xl transition-all hover:bg-black/80 hover:border-primary/20">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity">
                    <DirectionalIcon direction={insight.direction} />
                </div>
                
                <div className="flex items-center justify-between mb-8">
                    <p className="font-black text-primary text-[12px] uppercase tracking-[0.5em] flex items-center gap-3">
                        <Zap className="h-4 w-4" /> // PROTOCOL: {insight.strategy.toUpperCase()}
                    </p>
                    <Badge className={cn(
                        "font-black tracking-widest text-[10px] px-4 py-1",
                        riskLevel === 'LOW' ? "bg-emerald-500/10 text-emerald-400" : riskLevel === 'MODERATE' ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                        {riskLevel} RISK
                    </Badge>
                </div>

                <div className="space-y-10">
                    <div>
                        <div className="flex items-center gap-6 mb-4">
                            <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{insight.direction}</span>
                            {isPositive ? <ArrowUp className="h-8 w-8 text-emerald-400 animate-bounce" /> : <ArrowDown className="h-8 w-8 text-rose-500 animate-bounce" />}
                        </div>
                        <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.3em]">{insight.summary}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                             <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-black text-emerald-400 tabular-nums tracking-tighter">
                                    {insight.confidence.toFixed(1)}%
                                </span>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PROBABILITY GATE</p>
                             </div>
                             <Gauge className="h-6 w-6 text-emerald-400/40" />
                        </div>
                        <Progress value={insight.confidence} className="h-3 bg-black/60 [&>div]:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <p className="text-[12px] font-mono text-white/60 leading-relaxed italic border-l-2 border-primary/40 pl-6">
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
                    <HackerAnimation title={`INTELLIGENCE REPORT: ${marketName.toUpperCase()} MULTI-VECTOR SCAN`}>
                        {analysisState === 'analyzing' ? (
                            <ScannerAnimationContent />
                        ) : error ? (
                            <div className="text-left text-rose-400 flex items-start gap-8 p-10 bg-rose-950/20 rounded-[3rem] border border-rose-500/30 shadow-2xl">
                                <ShieldAlert className="h-12 w-12 flex-shrink-0 mt-2 animate-pulse"/>
                                <div>
                                    <p className="font-black text-3xl uppercase tracking-widest">LOGIC FAILURE</p>
                                    <p className="font-mono text-lg opacity-80 mt-4 leading-relaxed">{error}</p>
                                </div>
                            </div>
                        ) : multiInsight ? (
                            <div className="text-left space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                                <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="font-black text-primary text-[14px] uppercase tracking-[0.6em] mb-6 flex items-center gap-4">
                                        <Layers className="h-6 w-6" /> // GLOBAL STRATEGY SYNOPSIS
                                    </p>
                                    <p className="text-2xl font-medium text-white/90 leading-relaxed italic px-4">"{multiInsight.globalSummary}"</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-20 duration-1000 pb-32">
             <Card className="border-none shadow-[0_40px_120px_rgba(0,0,0,0.8)] bg-slate-900/40 backdrop-blur-[80px] overflow-hidden relative rounded-[4rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardContent className="p-12 sm:p-20 grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-32 items-center">
                    <div className="space-y-8">
                        <Label className="text-[16px] font-black uppercase tracking-[0.8em] text-primary ml-4">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-24 bg-black/60 border-white/10 rounded-[2.5rem] font-black text-2xl shadow-[inset_0_2px_20px_rgba(0,0,0,0.7)] px-12">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={10} className="w-[var(--radix-select-trigger-width)] max-h-[500px] rounded-[2.5rem] border-white/10 bg-slate-950 text-white z-[100] shadow-2xl">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-5 px-8 font-black text-lg transition-colors">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-8">
                        <Label className="text-[16px] font-black uppercase tracking-[0.8em] text-primary ml-4">ANALYSIS HORIZON</Label>
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="h-24 bg-black/60 border-white/10 rounded-[2.5rem] flex items-center justify-center font-black text-5xl text-primary shadow-[inset_0_2px_20px_rgba(0,0,0,0.7)] border border-primary/10">
                                {maxTicks} <span className="text-sm opacity-40 ml-6 tracking-[0.6em] uppercase font-bold">TICKS</span>
                            </div>
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 z-20"><Activity size={48} /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-16">
                <div className="flex flex-col sm:flex-row items-center gap-12 justify-between px-12">
                    <div className="flex items-center gap-12">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center border-2 border-primary/30 shadow-[0_0_50px_rgba(var(--primary),0.4)] group transition-transform hover:scale-110">
                            <Bot className="h-12 w-12 text-primary drop-shadow-[0_0_20px_rgba(var(--primary),1)]" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-3xl font-black uppercase tracking-[0.6em] text-white leading-tight">STRATEGY<br/>INTELLIGENCE</h3>
                            <p className="text-[12px] font-black uppercase tracking-[0.6em] text-primary/70 mt-4">Precision Multi-Protocol Analysis Matrix</p>
                        </div>
                    </div>
                    <div className="text-center sm:text-right bg-white/5 px-14 py-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                         <p className="text-[12px] font-black uppercase text-muted-foreground tracking-[0.5em] mb-3">LIVE DATA PIVOT</p>
                         <p className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{price.toFixed(decimalPlaces)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-16">
                    <DigitFrequencyCircles 
                        ticks={lastDigitTicks} 
                        selectedDigit={selectedDigit}
                        onDigitSelect={setSelectedDigit}
                        selectedMarket={selectedMarket}
                    />

                    <div className="text-center py-16">
                        <Button 
                            onClick={runAnalysis} 
                            disabled={analysisState === 'analyzing'} 
                            className={cn(
                                "h-24 px-20 rounded-full font-black text-lg uppercase tracking-[0.6em] shadow-[0_30px_100px_rgba(var(--primary),0.4)] transition-all active:scale-95 group relative overflow-hidden",
                                analysisState === 'analyzing' ? "bg-slate-800 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {analysisState === 'analyzing' ? (
                                <>
                                    <Activity className="mr-6 h-10 w-10 animate-spin" />
                                    DEEP SCAN IN PROGRESS...
                                </>
                            ) : (
                                <>
                                <Zap className="mr-6 h-10 w-10 fill-current" />
                                INITIATE DEEP PROTOCOL SCAN
                                </>
                            )}
                        </Button>
                        <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[1em] mt-10 animate-pulse">Ready for multi-vector synchronization</p>
                    </div>
                    
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
