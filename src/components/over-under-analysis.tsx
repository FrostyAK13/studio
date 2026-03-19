'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
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

    if (lastDigitTicks.length < 30) {
        setTimeout(() => {
            setScanResultLines(["ERROR: Sequence too short for Over/Under analysis.", "Please accumulate at least 30 ticks for stability."]);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }
    
    setTimeout(() => {
        let predictedOutcome: 'OVER' | 'UNDER';
        let barrierDigit: number;
        let targetDigits: number[] = [];
        let reasoning: string;

        const underSkew = lastDigitTicks.filter(d => d <= 2).length / lastDigitTicks.length > 0.35;
        const overSkew = lastDigitTicks.filter(d => d >= 7).length / lastDigitTicks.length > 0.35;

        if (streak.count >= 6 && streak.type === 'O') {
            predictedOutcome = 'UNDER';
            barrierDigit = 7;
            targetDigits = [0, 1, 2, 3, 4, 5, 6];
            reasoning = `OVER STRETCH DETECTED (${streak.count}x). High probability of reversal to UNDER ${barrierDigit}.`;
        } else if (streak.count >= 6 && streak.type === 'U') {
            predictedOutcome = 'OVER';
            barrierDigit = 2;
            targetDigits = [3, 4, 5, 6, 7, 8, 9];
            reasoning = `UNDER STRETCH DETECTED (${streak.count}x). High probability of reversal to OVER ${barrierDigit}.`;
        } else if (underSkew) {
            predictedOutcome = 'UNDER';
            barrierDigit = 8;
            targetDigits = [0, 1, 2, 3, 4, 5, 6, 7];
            reasoning = "Heavy low-digit distribution detected. Safer to trade Under high barriers.";
        } else if (overSkew) {
            predictedOutcome = 'OVER';
            barrierDigit = 1;
            targetDigits = [2, 3, 4, 5, 6, 7, 8, 9];
            reasoning = "Heavy high-digit distribution detected. Safer to trade Over low barriers.";
        } else {
            predictedOutcome = percentages.over >= percentages.under ? 'OVER' : 'UNDER';
            barrierDigit = predictedOutcome === 'OVER' ? 3 : 6;
            targetDigits = predictedOutcome === 'OVER' ? [4, 5, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5];
            reasoning = "Balanced market. Following slight statistical percentage skew.";
        }

        const initialResults = [
            'PRECISION BARRIER ANALYSIS - ACTIVE',
            `--> PREDICTION: ${predictedOutcome} ${barrierDigit}`,
            `--> TARGET RANGE: [${targetDigits.join(', ')}]`,
            `--> CONFIDENCE: 84.2%`,
            '',
            `ANALYSIS: ${reasoning}`,
            `Current Sample Skew: O:${percentages.over.toFixed(1)}% | U:${percentages.under.toFixed(1)}%`,
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
                    const newLines = [...initialResults, `STABILIZING ENTRY: T-minus ${countdown}s...`];
                    countdown--;
                    return newLines;
                } else {
                    clearInterval(interval);
                    const finalLines = [...initialResults, `ENTRY CONFIRMED.`, 'MONITORING FOR SKEW REVERSALS...'];
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
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-black tracking-tight uppercase">OVER/UNDER SCANNER</h3>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{marketName}</p>
            </div>
            <div className="flex items-start gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                        SKEW STREAK
                    </p>
                    <p className="text-xl font-black text-primary">{streak.count}x {streak.type === 'O' ? 'OVER' : 'UNDR'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">LIVE PRICE</p>
                    <p className="text-xl font-black text-foreground">{price.toFixed(decimalPlaces)}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6">
          {Array.from({ length: 10 }, (_, i) => (
            <Button
              key={i}
              variant={selectedDigit === i ? 'default' : 'outline'}
              className={cn(
                'w-11 h-11 rounded-xl font-black text-base transition-all duration-300',
                selectedDigit === i 
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-110' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
              onClick={() => handleSelectDigit(i)}
            >
              {i}
            </Button>
          ))}
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6 min-h-[56px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className={cn("flex items-center justify-center w-12 h-12 rounded-xl shadow-lg border border-white/5",
                  outcome === 'O' ? 'bg-accent/10 border-accent/20' : outcome === 'U' ? 'bg-destructive/10 border-destructive/20' : 'bg-white/5 border-white/10'
                )}>
                    <span className={cn("font-black text-lg drop-shadow-sm",
                      outcome === 'O' ? 'text-accent' : outcome === 'U' ? 'text-destructive' : 'text-muted-foreground'
                    )}>{outcome}</span>
                </div>
            ))}
        </div>

        {outcomes.length > 8 && (
            <div className="text-center mb-6">
                <Button onClick={() => setShowAllOutcomes(prev => !prev)} variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
                    {showAllOutcomes ? 'COLLAPSE DATA' : 'EXPAND HISTORY'}
                </Button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black text-accent tracking-widest flex items-center gap-1.5"><ArrowUp size={10} /> OVER RATIO</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-3xl font-black">{percentages.over.toFixed(1)}%</p>
                </div>
                <Progress value={percentages.over} className="h-2.5 bg-white/5 [&>div]:bg-accent" />
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black text-destructive tracking-widest flex items-center gap-1.5"><ArrowDown size={10} /> UNDER RATIO</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-3xl font-black">{percentages.under.toFixed(1)}%</p>
                </div>
                <Progress value={percentages.under} className="h-2.5 bg-white/5 [&>div]:bg-destructive" />
            </div>
        </div>

        <div className="mt-8 text-center">
             <Button 
                onClick={handleScan} 
                className={cn(
                    "h-14 px-10 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                    scanResultLines ? "bg-rose-500 hover:bg-rose-600" : "bg-primary hover:bg-primary/90"
                )}
                disabled={isScanning}
            >
                {isScanning && !scanResultLines ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                    <ScanLine className="mr-3 h-5 w-5" />
                )}
                {scanResultLines ? 'STOP SCANNER' : isScanning ? 'ANALYZING...' : 'RUN SMART SCANNER'}
            </Button>
        </div>
        
        <AnimatePresence>
            {(isScanning || scanResultLines) && (
                 <HackerAnimation title={`SYSTEM SCAN: OVER/UNDER ANALYTICS`}>
                    {isScanning && !scanResultLines ? (
                        <ScannerAnimationContent />
                     ) : (
                        <div className="space-y-1.5">
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
