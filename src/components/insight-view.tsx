'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Bot, Sparkles, AlertTriangle, Target, Zap, ShieldCheck, Info } from 'lucide-react';
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <Card className="border-none shadow-2xl bg-card/60 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardHeader className="pb-6 pt-8">
                    <div className='flex items-center gap-4 justify-between'>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                                <Lightbulb className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-black uppercase tracking-[0.2em]">Strategy Intelligence</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground">High-Precision Matrix Analysis</CardDescription>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Pivot</p>
                             <p className="text-2xl font-black text-foreground tabular-nums">{price.toFixed(decimalPlaces)}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Active Market</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange} disabled={analysisState === 'analyzing'}>
                                <SelectTrigger className="h-12 bg-background/40 border-white/5 rounded-xl font-bold">
                                    <SelectValue placeholder="Select Index" />
                                </SelectTrigger>
                                <SelectContent side="bottom" position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-xl border-white/10 bg-slate-950 text-white z-[100]">
                                    {syntheticIndices.map((index) => (
                                    <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-2">
                                        {index.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sample window</Label>
                            <div className="h-12 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 px-6 font-black text-lg text-primary">
                                {maxTicks} Ticks
                            </div>
                        </div>
                    </div>

                    <DigitFrequencyCircles 
                        ticks={lastDigitTicks} 
                        selectedDigit={selectedDigit}
                        onMarketChange={onMarketChange}
                        onDigitSelect={setSelectedDigit}
                        selectedMarket={selectedMarket}
                    />

                    {marketDirectionAnalysis && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-white/5 border border-white/5">
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span>Under 5 Bias</span>
                                    <span className="text-accent">{marketDirectionAnalysis.lower.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                    <div className="h-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--accent),0.4)]" style={{ width: `${marketDirectionAnalysis.lower}%`, backgroundColor: marketDirectionAnalysis.lowerColor }}></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span>Over 4 Bias</span>
                                    <span className="text-rose-500">{marketDirectionAnalysis.higher.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5">
                                    <div className="h-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--destructive),0.4)]" style={{ width: `${marketDirectionAnalysis.higher}%`, backgroundColor: marketDirectionAnalysis.higherColor }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-center py-4">
                        <Button 
                            onClick={runAnalysis} 
                            disabled={analysisState === 'analyzing'} 
                            className={cn(
                                "h-14 px-10 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                                analysisState === 'analyzing' ? "bg-muted cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            {analysisState === 'analyzing' ? (
                                <>
                                    <Bot className="mr-3 h-5 w-5 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                <Sparkles className="mr-3 h-5 w-5" />
                                Initiate Deep Analysis
                                </>
                            )}
                        </Button>
                    </div>
                    
                    {renderContent()}

                </CardContent>
            </Card>
        </div>
    );
}
