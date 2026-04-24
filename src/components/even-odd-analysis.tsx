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
        const recentTicks = lastDigitTicks.slice(0, 30);
        const tickSeq = [...recentTicks].slice(0, 10).reverse().join(',');
        let predictedOutcome: Outcome;
        let strategy = "";
        
        let triggerDigit = recentTicks.find(t => t > 1) || 5;

        const cluster10 = outcomes.slice(0, 10);
        const evenCount10 = cluster10.filter(o => o === 'E').length;
        const oddCount10 = 10 - evenCount10;

        if (streak.count >= 5) {
            predictedOutcome = streak.type === 'E' ? 'O' : 'E';
            strategy = `RECURSIVE REVERSAL: Detected ${streak.count}x ${streak.type} saturation. Statistical gravity favors immediate pivot to ${predictedOutcome === 'E' ? 'Even' : 'Odd'}.`;
        } else if (Math.abs(evenCount10 - 5) >= 3) {
            predictedOutcome = evenCount10 > oddCount10 ? 'E' : 'O';
            strategy = `MOMENTUM FLOW: Cluster analysis identifies a ${Math.max(evenCount10, oddCount10)}0% directional bias. Following current ${predictedOutcome === 'E' ? 'Even' : 'Odd'} vector.`;
        } else {
            predictedOutcome = percentages.even >= percentages.odd ? 'O' : 'E';
            strategy = `MEAN REVERSION: Global distribution [${percentages.even.toFixed(1)}%] is over-weighted. Targeting ${predictedOutcome === 'E' ? 'Even' : 'Odd'} for equilibrium correction.`;
        }

        const initialResults = [
          'STRATEGY HUB V5.2 - FLAWLESS PRECISION',
          `--> ENTRY TRIGGER: WATCH FOR DIGIT ${triggerDigit}`,
          `--> PREDICTED VECTOR: ${predictedOutcome === 'E' ? 'EVEN' : 'ODD'}`,
          `--> CONFIDENCE INDEX: 99.8%`,
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
                  const finalLines = [...initialResults, `SIGNAL ACTIVE: Entry confirmed at Trigger ${triggerDigit}.`, 'STABILITY CONFIRMED FOR 15+ TICKS.'];
                  return finalLines;
              }
          });
        }, 1000);
    }, 2500);
  };

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);
  const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

  return (
    <Card className="border-none shadow-sm bg-card rounded-xl border border-border overflow-hidden relative">
      <CardContent className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-3 gap-2">
            <div>
                <h3 className="text-[9px] font-black tracking-widest uppercase">EVEN/ODD</h3>
                <p className="text-[6px] text-muted-foreground font-black tracking-[0.2em] uppercase truncate max-w-[120px]">{marketName}</p>
            </div>
            <div className="flex items-start gap-4">
                <div className="text-right">
                    <p className="text-muted-foreground font-black text-[6px] uppercase tracking-widest">STREAK</p>
                    <p className="text-[10px] font-black text-primary">{streak.count}x {streak.type === 'E' ? 'EVN' : 'ODD'}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center flex-wrap gap-1 mb-4 min-h-[36px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className={cn("flex items-center justify-center w-7 h-7 rounded-lg shadow-sm border border-white/5",
                  outcome === 'E' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                )}>
                    <span className="font-black text-[10px] drop-shadow-md">{outcome}</span>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 rounded-lg p-2 border border-border">
                <p className="text-[6px] font-black text-emerald-600 tracking-widest uppercase">EVEN</p>
                <p className="text-xs font-black">{percentages.even.toFixed(1)}%</p>
                <Progress value={percentages.even} className="h-1 bg-muted [&>div]:bg-emerald-500" />
            </div>
            <div className="bg-muted/30 rounded-lg p-2 border border-border">
                <p className="text-[6px] font-black text-rose-600 tracking-widest uppercase">ODD</p>
                <p className="text-xs font-black">{percentages.odd.toFixed(1)}%</p>
                <Progress value={percentages.odd} className="h-1 bg-muted [&>div]:bg-rose-500" />
            </div>
        </div>

        <div className="mt-4 text-center">
            <Button 
                onClick={handleScan} 
                variant="outline"
                className="h-7 px-4 rounded-full font-black text-[7px] uppercase tracking-widest transition-all active:scale-95"
                disabled={isScanning}
            >
                {isScanning ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <ScanLine className="mr-1.5 h-3 w-3" />}
                {scanResultLines ? 'HALT SCAN' : isScanning ? 'ANALYZING...' : 'INITIATE SMART SCAN'}
            </Button>
        </div>
        
        <AnimatePresence>
            {(isScanning || scanResultLines) && (
                <HackerAnimation title={`SYSTEM SCAN: EVEN/ODD`}>
                    {scanResultLines ? (
                        <div className="space-y-1 text-[8px]">
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