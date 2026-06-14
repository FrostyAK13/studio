'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ShieldCheck, Zap, Activity, Info } from 'lucide-react';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type Outcome = 'E' | 'O';

interface EvenOddAnalysisProps {
  lastDigitTicks: number[], 
  selectedMarket: string,
  price: number;
  decimalPlaces: number;
}

export function EvenOddAnalysis({ lastDigitTicks, selectedMarket, price, decimalPlaces }: EvenOddAnalysisProps) {
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'E', count: 0 });
  const [percentages, setPercentages] = React.useState({ even: 0, odd: 0 });

  const analysisResult = React.useMemo(() => {
    if (lastDigitTicks.length < 50) return null;

    const counts = Array(10).fill(0);
    lastDigitTicks.forEach(d => counts[d]++);
    const total = lastDigitTicks.length;
    const P = counts.map(c => (c / total) * 100);
    const D = P.map(p => p - 10);

    const sEven = (D[0] + D[2] + D[4] + D[6] + D[8]) - 
                 (Math.abs(D[1]) + Math.abs(D[3]) + Math.abs(D[5]) + Math.abs(D[7]) + Math.abs(D[9]));
    const sOdd = (D[1] + D[3] + D[5] + D[7] + D[9]) - 
                (Math.abs(D[0]) + Math.abs(D[2]) + Math.abs(D[4]) + Math.abs(D[6]) + Math.abs(D[8]));

    const direction = sEven > sOdd ? 'Even' : 'Odd';

    const mean = 10;
    const variance = P.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / 10;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 0.5 || stdDev > 6.5) return { status: 'UNSTABLE', direction, entryDigit: null, confidence: 0, reasoning: 'Market distribution shows extreme spread. System suspended for stability.' };

    const chosenSet = direction === 'Even' ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9];
    const sortedChosen = [...chosenSet].sort((a, b) => P[b] - P[a]);
    
    const candidates = sortedChosen.filter(d => 
        d !== sortedChosen[0] && 
        d !== sortedChosen[1] && 
        d !== sortedChosen[sortedChosen.length - 1] && 
        d !== sortedChosen[sortedChosen.length - 2]
    );

    if (candidates.length === 0) return { status: 'NO CANDIDATES', direction, entryDigit: null, confidence: 0, reasoning: 'Outlier filter removed all valid entry points.' };

    const scores = candidates.map(i => {
        const nextIdx = (i + 1) % 10;
        const prevIdx = (i + 9) % 10;
        const jump = Math.abs(D[nextIdx] - D[prevIdx]);
        const score = (10 - P[i]) * (1 - jump);
        return { digit: i, score, jump };
    });

    const best = scores.sort((a, b) => b.score - a.score)[0];
    const confidence = Math.min(99.9, 55 + Math.max(sEven, sOdd) + (best.score * 1.5));

    return {
        status: 'TRADE NOW',
        direction,
        entryDigit: best.digit,
        confidence,
        stdDev,
        reasoning: `System identifies equilibrium deviation in ${direction} territory. Digit ${best.digit} selected via smooth structural logic.`
    };
  }, [lastDigitTicks]);

  React.useEffect(() => {
    if (lastDigitTicks.length === 0) {
      setOutcomes([]);
      setStreak({ type: 'E', count: 0 });
      setPercentages({ even: 0, odd: 0 });
      return;
    }

    const newOutcomes = lastDigitTicks.map(digit => (digit % 2 === 0 ? 'E' : 'O'));
    setOutcomes(newOutcomes);

    if (newOutcomes.length > 0) {
        let currentStreak = { type: newOutcomes[0], count: 0 };
        for (const outcome of newOutcomes) {
          if (outcome === currentStreak.type) {
            currentStreak.count++;
          } else {
            break;
          }
        }
        setStreak(currentStreak);
    } else {
        setStreak({ type: 'E', count: 0 });
    }

    const evenCount = newOutcomes.filter(o => o === 'E').length;
    const oddCount = newOutcomes.length - evenCount;
    setPercentages({
      even: newOutcomes.length > 0 ? (evenCount / newOutcomes.length) * 100 : 0,
      odd: newOutcomes.length > 0 ? (oddCount / newOutcomes.length) * 100 : 0,
    });
  }, [lastDigitTicks]);

  const displayedOutcomes = outcomes.slice(0, 8);
  const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

  return (
    <div className="space-y-4">
        <Card className="border-none shadow-sm bg-card rounded-xl border border-border overflow-hidden relative">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4 gap-2">
                    <div>
                        <h3 className="text-[10px] font-black tracking-widest uppercase text-primary">PARITY</h3>
                        <p className="text-[7px] text-muted-foreground font-black tracking-[0.2em] uppercase truncate">{marketName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground font-black text-[7px] uppercase tracking-widest">STREAK</p>
                        <p className="text-[12px] font-black text-primary">{streak.count}x {streak.type === 'E' ? 'EVEN' : 'ODD'}</p>
                    </div>
                </div>

                <div className="flex justify-center flex-wrap gap-1.5 mb-6 min-h-[40px]">
                    {[...displayedOutcomes].reverse().map((outcome, index) => (
                        <div key={index} className={cn("flex items-center justify-center w-8 h-8 rounded-xl shadow-sm border border-white/5 transition-all duration-300",
                        outcome === 'E' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        )}>
                            <span className="font-black text-[11px] drop-shadow-md">{outcome}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-xl p-3 border border-border">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[7px] font-black text-emerald-600 tracking-widest uppercase">EVEN</p>
                            <span className="text-[10px] font-black tabular-nums">{percentages.even.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentages.even} className="h-1.5 bg-muted [&>div]:bg-emerald-500 rounded-full" />
                    </div>
                    <div className="bg-muted/30 rounded-xl p-3 border border-border">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[7px] font-black text-rose-600 tracking-widest uppercase">ODD</p>
                            <span className="text-[10px] font-black tabular-nums">{percentages.odd.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentages.odd} className="h-1.5 bg-muted [&>div]:bg-rose-500 rounded-full" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="border-none shadow-2xl bg-card rounded-[1.5rem] border border-border overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 via-primary to-blue-500 opacity-40" />
            <CardContent className="p-4 sm:p-6">
                {!analysisResult ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 opacity-20">
                        <Activity className="h-10 w-10 text-muted-foreground animate-pulse" />
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-center">INITIALIZING // ACCUMULATING</p>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                analysisResult.status === 'TRADE NOW' ? "bg-emerald-500 shadow-xl" : "bg-muted border border-border"
                            )}>
                                {analysisResult.status === 'TRADE NOW' ? <Zap className="h-8 w-8 text-white animate-pulse" /> : <ShieldCheck className="h-8 w-8 text-muted-foreground/30" />}
                            </div>
                            <div>
                                <h3 className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.4em] leading-none mb-2",
                                    analysisResult.status === 'TRADE NOW' ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                                )}>
                                    {analysisResult.status}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-xl sm:text-2xl font-black tracking-tighter uppercase",
                                        analysisResult.entryDigit !== null ? "text-foreground" : "text-muted-foreground/30"
                                    )}>
                                        {analysisResult.entryDigit !== null ? `${analysisResult.direction.toUpperCase()} @ ${analysisResult.entryDigit}` : 'SEARCHING...'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 max-w-md">
                            <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                            "{analysisResult.reasoning}"
                            </p>
                        </div>

                        <div className="flex items-center gap-8 bg-muted/30 px-6 py-3 rounded-2xl border border-border">
                            <div className="text-center">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">STABILITY</p>
                                <p className={cn(
                                    "text-lg font-black tabular-nums leading-none",
                                    analysisResult.status === 'TRADE NOW' ? "text-emerald-600" : "text-primary"
                                )}>
                                    {analysisResult.confidence.toFixed(1)}%
                                </p>
                            </div>
                            <div className="w-px h-8 bg-border" />
                            <div className="text-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <div className="cursor-help group">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">V8.1</p>
                                            <p className="text-lg font-black text-primary leading-none">V8.1</p>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 bg-card border-border shadow-2xl rounded-2xl p-4">
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                                <Activity className="h-3 w-3" /> PARITY V8.1
                                            </h4>
                                            <p className="text-[9px] font-medium text-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                                                "Extracts edge via deviation from equilibrium and stability filters."
                                            </p>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
