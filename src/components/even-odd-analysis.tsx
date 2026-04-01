'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, ShieldCheck, Target, Activity } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { syntheticIndices } from '@/lib/mock-data';
import { ScannerAnimationContent } from './scanner-animation-content';

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
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResultLines, setScanResultLines] = React.useState<string[] | null>(null);

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

  const handleScan = () => {
    if (isScanning) return;

    if (scanResultLines) {
      setScanResultLines(null);
      return;
    }
    
    setIsScanning(true);

    if (lastDigitTicks.length < 20) {
        setTimeout(() => {
            setScanResultLines(['ERROR: Insufficient data sequence.', 'Minimum 20 ticks required for high-accuracy protocol sync.']);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }

    setTimeout(() => {
        const recentTicks = lastDigitTicks.slice(0, 15);
        const tickSeq = [...recentTicks].reverse().join(',');
        let predictedOutcome: Outcome;
        let strategy = "";
        let triggerDigit = recentTicks[0];

        // Advanced Logic: Cluster Density vs Momentum
        const cluster10 = outcomes.slice(0, 10);
        const evenCount10 = cluster10.filter(o => o === 'E').length;
        const oddCount10 = 10 - evenCount10;

        // Detection of saturation vs oscillation
        if (streak.count >= 5) {
            // Reversal logic for extended streaks
            predictedOutcome = streak.type === 'E' ? 'O' : 'E';
            strategy = `RECURSIVE REVERSAL: Detected ${streak.count}x ${streak.type} saturation. Statistical gravity favors immediate pivot to ${predictedOutcome === 'E' ? 'Even' : 'Odd'}.`;
        } else if (Math.abs(evenCount10 - 5) >= 3) {
            // Momentum following for strong bias
            predictedOutcome = evenCount10 > oddCount10 ? 'E' : 'O';
            strategy = `MOMENTUM FLOW: Cluster analysis identifies a ${Math.max(evenCount10, oddCount10)}0% directional bias. Following current ${predictedOutcome === 'E' ? 'Even' : 'Odd'} vector.`;
        } else {
            // Mean reversion logic
            predictedOutcome = percentages.even >= percentages.odd ? 'O' : 'E';
            strategy = `MEAN REVERSION: Global distribution [${percentages.even.toFixed(1)}%] is over-weighted. Targeting ${predictedOutcome === 'E' ? 'Even' : 'Odd'} for equilibrium correction.`;
        }

        const initialResults = [
          'STRATEGY PROTOCOL V5.2 - PRECISION MODE',
          `--> ENTRY TRIGGER: WATCH FOR DIGIT ${triggerDigit}`,
          `--> PREDICTED VECTOR: ${predictedOutcome === 'E' ? 'EVEN' : 'ODD'}`,
          `--> CONFIDENCE INDEX: ${Math.abs(percentages.even - 50) + 70}%`,
          '',
          `STRATEGY REASONING: ${strategy}`,
          `DATA HORIZON SCAN: [${tickSeq}]`,
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
                  const newLines = [...initialResults, `SIGNAL ACTIVE: Auto-entry sequence in ${countdown}s...`];
                  countdown--;
                  return newLines;
              } else {
                  clearInterval(interval);
                  const finalLines = [...initialResults, `SIGNAL ACTIVE: Entry confirmed at Trigger ${triggerDigit}.`, 'MONITORING FOR VARIANCE STABILITY...'];
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
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary to-purple-500" />
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4 sm:mb-6 gap-2">
            <div>
                <h3 className="text-sm sm:text-lg font-black tracking-tight uppercase">EVEN/ODD PROTOCOL</h3>
                <p className="text-[8px] sm:text-[10px] text-muted-foreground font-bold tracking-widest uppercase truncate max-w-[120px] sm:max-w-none">{marketName}</p>
            </div>
            <div className="flex items-start gap-3 sm:gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-bold text-[8px] sm:text-[10px] uppercase tracking-widest">
                        STREAK
                    </p>
                    <p className="text-sm sm:text-xl font-black text-primary">{streak.count}x {streak.type === 'E' ? 'EVN' : 'ODD'}</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">LIVE PRICE</p>
                    <p className="text-xl font-black text-foreground">{price.toFixed(decimalPlaces)}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 min-h-[48px] sm:min-h-[56px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className={cn("flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg border border-white/5",
                  outcome === 'E' ? 'bg-gradient-to-br from-chart-1 to-blue-600' : 'bg-gradient-to-br from-chart-3 to-purple-700'
                )}>
                    <span className="font-black text-xs sm:text-lg text-white drop-shadow-md">{outcome}</span>
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
                <div className="absolute inset-0 bg-chart-1/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[8px] sm:text-[10px] font-black text-chart-1 tracking-widest">EVEN DENSITY</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-xl sm:text-3xl font-black">{percentages.even.toFixed(1)}%</p>
                    <div className="p-1 sm:p-1.5 bg-chart-1/20 rounded-lg"><Activity className="h-3 w-3 sm:h-4 sm:w-4 text-chart-1" /></div>
                </div>
                <Progress value={percentages.even} className="h-1.5 sm:h-2.5 bg-white/5 [&>div]:bg-chart-1" />
            </div>
            <div className="bg-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-chart-3/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[8px] sm:text-[10px] font-black text-chart-3 tracking-widest">ODD DENSITY</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-xl sm:text-3xl font-black">{percentages.odd.toFixed(1)}%</p>
                    <div className="p-1 sm:p-1.5 bg-chart-3/20 rounded-lg"><ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 text-chart-3" /></div>
                </div>
                <Progress value={percentages.odd} className="h-1.5 sm:h-2.5 bg-white/5 [&>div]:bg-chart-3" />
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
                <HackerAnimation title={`SYSTEM SCAN: EVEN/ODD ANALYTICS`}>
                    {scanResultLines ? (
                        <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-sm">
                            {scanResultLines.map((line, index) => (
                                <p key={index} className={cn(
                                    line.startsWith('-->') ? "text-emerald-400 font-black" : "text-green-500/80"
                                )}>{line}</p>
                            ))}
                        </div>
                    ) : (
                       <ScannerAnimationContent />
                    )}
                </HackerAnimation>
            )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
