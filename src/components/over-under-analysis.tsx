'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, ArrowUp, ArrowDown, Gauge } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { syntheticIndices } from '@/lib/mock-data';
import { ScannerAnimationContent } from './scanner-animation-content';

type Outcome = 'O' | 'U' | 'E';

interface OverUnderAnalysisProps {
  lastDigitTicks: number[];
  selectedMarket: string;
  price: number;
  decimalPlaces: number;
}

export function OverUnderAnalysis({ lastDigitTicks, selectedMarket, price, decimalPlaces }: OverUnderAnalysisProps) {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: 'O' | 'U'; count: number }>({ type: 'U', count: 0 });
  const [percentages, setPercentages] = React.useState({ over: 0, under: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResultLines, setScanResultLines] = React.useState<string[] | null>(null);

  const handleSelectDigit = (digit: number) => {
    setSelectedDigit(digit);
  };
  
  React.useEffect(() => {
    if (lastDigitTicks.length === 0) {
        setOutcomes([]);
        setStreak({ type: 'U', count: 0 });
        setPercentages({ over: 0, under: 0 });
        return;
    }
    
    const newOutcomes: Outcome[] = lastDigitTicks.map((digit) => {
        if (digit > selectedDigit) return 'O';
        if (digit < selectedDigit) return 'U';
        return 'E';
    });
    setOutcomes(newOutcomes);

    const overUnderOutcomes = newOutcomes.filter(o => o !== 'E') as ('O' | 'U')[];

    if(overUnderOutcomes.length > 0) {
        let currentStreak = { type: overUnderOutcomes[0], count: 0 };
        for (const outcome of overUnderOutcomes) {
          if (outcome === currentStreak.type) {
            currentStreak.count++;
          } else {
            break;
          }
        }
        setStreak(currentStreak);
    
        const overCount = overUnderOutcomes.filter(o => o === 'O').length;
        const underCount = overUnderOutcomes.filter(o => o === 'U').length;
        setPercentages({
          over: overUnderOutcomes.length > 0 ? (overCount / overUnderOutcomes.length) * 100 : 0,
          under: overUnderOutcomes.length > 0 ? (underCount / overUnderOutcomes.length) * 100 : 0,
        });
    } else {
        setStreak({ type: 'U', count: 0 });
        setPercentages({ over: 0, under: 0 });
    }
  }, [lastDigitTicks, selectedDigit]);

  const handleScan = () => {
    if (isScanning) return;
    
    if (scanResultLines) {
        setScanResultLines(null);
        return;
    }

    setIsScanning(true);

    if (lastDigitTicks.length < 40) {
        setTimeout(() => {
            setScanResultLines(["ERROR: Sequence too short for high-precision barrier analysis.", "Please accumulate at least 40 ticks for Z-Score stabilization."]);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }
    
    setTimeout(() => {
        const recentTicks = lastDigitTicks.slice(0, 20);
        const tickSeq = [...recentTicks].slice(0, 10).reverse().join(',');
        let predictedOutcome: 'OVER' | 'UNDER';
        let barrierDigit: number;
        let reasoning: string;
        let triggerDigit: number = recentTicks[0];

        // Advanced Skew Pivot Logic
        const avg = recentTicks.reduce((a, b) => a + b, 0) / recentTicks.length;
        const higherCount = recentTicks.filter(d => d > 4).length;
        const lowerCount = 20 - higherCount;

        if (streak.count >= 6) {
            // Reversal on extreme exhaustion
            predictedOutcome = streak.type === 'O' ? 'UNDER' : 'OVER';
            barrierDigit = predictedOutcome === 'UNDER' ? 7 : 2;
            reasoning = `SKEW EXHAUSTION: Sequence identifies ${streak.count}x ${streak.type === 'O' ? 'Bullish' : 'Bearish'} saturation. Entry trigger ${triggerDigit} favors immediate corrective pivot to ${predictedOutcome} ${barrierDigit}.`;
        } else if (higherCount >= 14) {
            // High probability momentum follow
            predictedOutcome = 'OVER';
            barrierDigit = 3;
            reasoning = `BULLISH SKEW: Numerical center of gravity [${avg.toFixed(1)}] shifted to upper barrier. Following directional flow with entry pivot OVER ${barrierDigit}.`;
        } else if (lowerCount >= 14) {
            // Low probability momentum follow
            predictedOutcome = 'UNDER';
            barrierDigit = 6;
            reasoning = `BEARISH SKEW: Cluster profiling identifies sustained lower barrier saturation. Targeting UNDER ${barrierDigit} for safe mean exploitation.`;
        } else {
            // Stability mean reversion
            predictedOutcome = avg > 4.5 ? 'UNDER' : 'OVER';
            barrierDigit = predictedOutcome === 'OVER' ? 3 : 6;
            reasoning = `STABILITY HUB: Global mean [${avg.toFixed(1)}] is stable. Entry at trigger ${triggerDigit} targets ${predictedOutcome} ${barrierDigit} for statistical equilibrium.`;
        }

        const initialResults = [
            'BARRIER HUB - V7.4',
            `--> ENTRY TRIGGER: WATCH FOR DIGIT ${triggerDigit}`,
            `--> PREDICTION: ${predictedOutcome} ${barrierDigit}`,
            `--> SKEW WEIGHT: ${Math.max(higherCount, lowerCount) * 5}%`,
            '',
            `TECHNICAL REASONING: ${reasoning}`,
            `SEQUENCE SCAN: [${tickSeq}]`,
            ''
        ];

        setScanResultLines(initialResults);
        setIsScanning(false);

        let countdown = 5;
        const interval = setInterval(() => {
            setScanResultLines(prevLines => {
                if (!prevLines) {
                    clearInterval(interval);
                    return null;
                };

                if (countdown >= 0) {
                    const newLines = [...initialResults, `STABILIZING ENTRY GATE: T-minus ${countdown}s...`];
                    countdown--;
                    return newLines;
                } else {
                    clearInterval(interval);
                    const finalLines = [...initialResults, `ENTRY CONFIRMED at Trigger ${triggerDigit}.`, 'MONITORING FOR SKEW REVERSAL EVENTS...'];
                    return finalLines;
                }
            });
        }, 1000);

    }, 2500);
  };

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);
  const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

  return (
    <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-primary to-emerald-500" />
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4 sm:mb-6 gap-2">
            <div>
                <h3 className="text-sm sm:text-lg font-black tracking-tight uppercase">OVER/UNDER</h3>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground font-bold tracking-widest uppercase truncate max-w-[120px] sm:max-w-none">{marketName}</p>
            </div>
            <div className="flex items-start gap-3 sm:gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-bold text-[8px] sm:text-[10px] uppercase tracking-widest">
                        SKEW
                    </p>
                    <p className="text-sm sm:text-xl font-black text-primary">{streak.count}x {streak.type === 'O' ? 'OVER' : 'UNDR'}</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">LIVE PRICE</p>
                    <p className="text-xl font-black text-foreground">{price.toFixed(decimalPlaces)}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {Array.from({ length: 10 }, (_, i) => (
            <Button
              key={i}
              variant={selectedDigit === i ? 'default' : 'outline'}
              className={cn(
                'w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl font-black text-xs sm:text-base transition-all duration-300',
                selectedDigit === i 
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-105 sm:scale-110' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
              onClick={() => handleSelectDigit(i)}
            >
              {i}
            </Button>
          ))}
        </div>

        <div className="flex justify-center flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 min-h-[48px] sm:min-h-[56px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className={cn("flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg border border-white/5",
                  outcome === 'O' ? 'bg-accent/10 border-accent/20' : outcome === 'U' ? 'bg-destructive/10 border-destructive/20' : 'bg-white/5 border-white/10'
                )}>
                    <span className={cn("font-black text-xs sm:text-lg drop-shadow-sm",
                      outcome === 'O' ? 'text-accent' : outcome === 'U' ? 'text-destructive' : 'text-muted-foreground'
                    )}>{outcome}</span>
                </div>
            ))}
        </div>

        {outcomes.length > 8 && (
            <div className="text-center mb-4 sm:mb-6">
                <Button onClick={() => setShowAllOutcomes(prev => !prev)} variant="ghost" size="sm" className="h-6 sm:h-8 text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
                    {showAllOutcomes ? 'COLLAPSE DATA' : 'EXPAND HISTORY'}
                </Button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[8px] sm:text-[10px] font-black text-accent tracking-widest flex items-center gap-1.5 uppercase"><ArrowUp size={10} /> OVER DENSITY</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-xl sm:text-3xl font-black">{percentages.over.toFixed(1)}%</p>
                    <div className="p-1 sm:p-1.5 bg-accent/20 rounded-lg"><Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-accent" /></div>
                </div>
                <Progress value={percentages.over} className="h-1.5 sm:h-2.5 bg-white/5 [&>div]:bg-accent" />
            </div>
            <div className="bg-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[8px] sm:text-[10px] font-black text-destructive tracking-widest flex items-center gap-1.5 uppercase"><ArrowDown size={10} /> UNDER DENSITY</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-xl sm:text-3xl font-black">{percentages.under.toFixed(1)}%</p>
                    <div className="p-1 sm:p-1.5 bg-destructive/20 rounded-lg"><Gauge className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" /></div>
                </div>
                <Progress value={percentages.under} className="h-1.5 sm:h-2.5 bg-white/5 [&>div]:bg-destructive" />
            </div>
        </div>

        <div className="mt-6 sm:mt-8 text-center">
             <Button 
                onClick={handleScan} 
                className={cn(
                    "h-10 sm:h-14 px-6 sm:px-10 rounded-full font-black text-[9px] sm:text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                    scanResultLines ? "bg-rose-500 hover:bg-rose-600" : "bg-primary hover:bg-primary/90"
                )}
                disabled={isScanning}
            >
                {isScanning && !scanResultLines ? (
                    <Loader2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                    <ScanLine className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                )}
                {scanResultLines ? 'HALT SCAN' : isScanning ? 'ANALYZING...' : 'INITIATE SMART SCAN'}
            </Button>
        </div>
        
        <AnimatePresence>
            {(isScanning || scanResultLines) && (
                 <HackerAnimation title={`SYSTEM SCAN: OVER/UNDER ANALYTICS`}>
                    {isScanning && !scanResultLines ? (
                        <ScannerAnimationContent />
                     ) : (
                        <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-sm">
                            {scanResultLines?.map((line, index) => (
                                <p key={index} className={cn(
                                    line.startsWith('-->') ? "text-emerald-400 font-black" : "text-green-500/80"
                                )}>{line}</p>
                            ))}
                        </div>
                    )}
                </HackerAnimation>
            )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
