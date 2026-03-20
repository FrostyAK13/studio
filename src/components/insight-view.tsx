'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Bot, Sparkles, AlertTriangle, Target, Zap, ShieldCheck, Info, Activity } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { ScannerAnimationContent } from './scanner-animation-content';
import { generateInsight, type InsightOutput } from '@/lib/insight-generator';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DigitFrequencyCircles } from './correlation-view';

interface InsightViewProps {
    price: number;
    decimalPlaces: number;
    lastDigitTicks: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    maxTicks: number;
}

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';

export function InsightView({ price, decimalPlaces, lastDigitTicks, selectedMarket, onMarketChange, maxTicks }: InsightViewProps) {
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

        setTimeout(() => {
            if (lastDigitTicks.length < 50) {
                setError(`Data sequence unstable. Minimum 50 ticks required for analysis.`);
                setAnalysisState('error');
                return;
            }

            try {
                const result = generateInsight(lastDigitTicks);
                setInsight(result);
                setAnalysisState('complete');
            } catch (e: any) {
                setError(e.message || "An unexpected error occurred during deep scan.");
                setAnalysisState('error');
            }
        }, 2000);
    };

    const marketDirectionAnalysis = React.useMemo(() => {
        const ticks = lastDigitTicks;
        if (ticks.length < 2) return null;

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
                    <HackerAnimation title={`SYSTEM REPORT: ${marketName.toUpperCase()} [${lastDigitTicks.length} TICKS]`}>
                        {analysisState === 'analyzing' ? (
                            <ScannerAnimationContent />
                        ) : error ? (
                            <div className="text-left text-red-400 flex items-start gap-4 p-4 bg-red-950/20 rounded-xl border border-red-500/20">
                                <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-1"/>
                                <div>
                                    <p className="font-black text-lg uppercase tracking-widest">Access Denied</p>
                                    <p className="font-mono text-sm opacity-80">{error}</p>
                                </div>
                            </div>
                        ) : insight ? (
                            <div className="text-left space-y-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="font-black text-green-300 text-[10px] uppercase tracking-[0.3em] mb-2">// Market intelligence Summary</p>
                                    <p className="text-base font-medium text-green-100/90 leading-relaxed">{insight.summary}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity"><Target className="h-10 w-10 text-primary" /></div>
                                        <p className="font-black text-green-300 text-[10px] uppercase tracking-[0.3em] mb-2">// Recommended Protocol</p>
                                        <Badge className="h-10 px-4 bg-primary text-white text-sm font-black uppercase rounded-lg shadow-lg shadow-primary/20">
                                            {insight.recommendedStrategy}
                                        </Badge>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
                                         <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity"><ShieldCheck className="h-10 w-10 text-emerald-400" /></div>
                                        <p className="font-black text-green-300 text-[10px] uppercase tracking-[0.3em] mb-2">// Risk Factor</p>
                                        <p className="text-xl font-black text-white">OPTIMIZED</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="font-black text-green-300 text-[10px] uppercase tracking-[0.3em] mb-2">// Strategic Reasoning</p>
                                    <p className="text-sm font-mono text-green-100/70 leading-relaxed">{insight.reasoning}</p>
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-slate-900/40 backdrop-blur-[50px] overflow-hidden relative rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-end">
                    <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-16 bg-black/40 border-white/10 rounded-[1.5rem] font-black text-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] px-8">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100]">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">DATA HORIZON (TICKS)</Label>
                        <div className="relative">
                            <div className="h-16 bg-black/40 border-white/10 rounded-[1.5rem] flex items-center justify-center font-black text-3xl text-primary shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                {maxTicks}
                            </div>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Activity size={24} /></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <div className="flex items-center gap-4 justify-between px-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                            <Lightbulb className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-[0.2em] text-foreground">Strategy Intelligence</h3>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">High-Precision Matrix Analysis</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Pivot</p>
                         <p className="text-3xl font-black text-foreground tabular-nums drop-shadow-[0_0_12px_rgba(var(--primary),0.3)]">{price.toFixed(decimalPlaces)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <DigitFrequencyCircles 
                        ticks={lastDigitTicks} 
                        selectedDigit={selectedDigit}
                        onMarketChange={onMarketChange}
                        onDigitSelect={setSelectedDigit}
                        selectedMarket={selectedMarket}
                    />

                    {marketDirectionAnalysis && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-[2.5rem] bg-white/5 border border-white/5">
                            <div className="space-y-4">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    <span>Under 5 Bias</span>
                                    <span className="text-accent text-lg">{marketDirectionAnalysis.lower.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-black/40 rounded-full h-4 overflow-hidden border border-white/5">
                                    <div className="h-full transition-all duration-1000 shadow-[0_0_12px_rgba(var(--accent),0.5)]" style={{ width: `${marketDirectionAnalysis.lower}%`, backgroundColor: marketDirectionAnalysis.lowerColor }}></div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                    <span>Over 4 Bias</span>
                                    <span className="text-rose-500 text-lg">{marketDirectionAnalysis.higher.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-black/40 rounded-full h-4 overflow-hidden border border-white/5">
                                    <div className="h-full transition-all duration-1000 shadow-[0_0_12px_rgba(var(--destructive),0.5)]" style={{ width: `${marketDirectionAnalysis.higher}%`, backgroundColor: marketDirectionAnalysis.higherColor }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-center py-6">
                        <Button 
                            onClick={runAnalysis} 
                            disabled={analysisState === 'analyzing'} 
                            className={cn(
                                "h-16 px-12 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                                analysisState === 'analyzing' ? "bg-muted cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            {analysisState === 'analyzing' ? (
                                <>
                                    <Bot className="mr-3 h-6 w-6 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                <Sparkles className="mr-3 h-6 w-6" />
                                Initiate Deep Analysis
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
