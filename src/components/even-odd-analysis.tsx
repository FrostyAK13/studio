'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, ShieldCheck, Target, Activity, Zap } from 'lucide-react';
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

  const runAdvancedStrategy = () => {
    if (lastDigitTicks.length < 50) return null;

    // Step 1: Normalize distribution
    const counts = Array(10).fill(0);
    lastDigitTicks.forEach(d => counts[d]++);
    const total = lastDigitTicks.length;
    const P = counts.map(c => (c / total) * 100);
    const D = P.map(p => p - 10);

    // Step 2: Compute weighted directional strength
    const sEven = (D[0] + D[2] + D[4] + D[6] + D[8]) - 
                 (Math.abs(D[1]) + Math.abs(D[3]) + Math.abs(D[5]) + Math.abs(D[7]) + Math.abs(D[9]));
    const sOdd = (D[1] + D[3] + D[5] + D[7] + D[9]) - 
                (Math.abs(D[0]) + Math.abs(D[2]) + Math.abs(D[4]) + Math.abs(D[6]) + Math.abs(D[8]));

    // Step 3: Select direction
    const direction = sEven > sOdd ? 'Even' : 'Odd';

    // Step 4: Stability filter
    const mean = 10;
    const variance = P.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / 10;
    const stdDev = Math.sqrt(variance);
    
    // Proceed only under moderate dispersion (e.g., 0.5 to 6.5)
    if (stdDev < 0.5 || stdDev > 6.5) return null;

    // Step 5: Filter entry candidates
    const chosenSet = direction === 'Even' ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9];
    const sortedChosen = [...chosenSet].sort((a, b) => P[b] - P[a]);
    
    // Exclude top 2 and bottom 2
    const candidates = sortedChosen.filter(d => 
        d !== sortedChosen[0] && 
        d !== sortedChosen[1] && 
        d !== sortedChosen[sortedChosen.length - 1] && 
        d !== sortedChosen[sortedChosen.length - 2]
    );

    if (candidates.length === 0) return null;

    // Step 6 & 7: Structural balance filter & Score candidates
    const scores = candidates.map(i => {
        const nextIdx = (i + 1) % 10;
        const prevIdx = (i + 9) % 10;
        const jump = Math.abs(D[nextIdx] - D[prevIdx]);
        const score = (10 - P[i]) * (1 - jump);
        return { digit: i, score, jump };
    });

    // Step 8: Select entry digit
    const best = scores.sort((a, b) => b.score - a.score)[0];
    
    const confidence = Math.min(99.9, 55 + Math.max(sEven, sOdd) + (best.score * 1.5));

    return {
        direction,
        entryDigit: best.digit,
        confidence,
        stdDev,
        reasoning: `Market identified subtle equilibrium deviation in ${direction} territory. Selected Digit ${best.digit} due to structural stability and zone flow.`
    };
  };

  const handleScan = () => {
    if (isScanning) return;

    if (scanResultLines) {
      setScanResultLines(null);
      return;
    }
    
    setIsScanning(true);

    if (lastDigitTicks.length < 50) {
        setTimeout(() => {
            setScanResultLines(['ERROR: Low data precision.', 'Accumulate 50+ ticks for advanced parity analysis.']);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }

    setTimeout(() => {
        const result = runAdvancedStrategy();
        
        if (!result) {
            setScanResultLines(['ENGINE ALERT: No stable vector.', 'Market distribution currently too erratic for 100+1 execution.']);
            setIsScanning(false);
            return;
        }

        const tickSeq = [...lastDigitTicks].slice(0, 10).reverse().join(',');

        const initialResults = [
          'STRATEGY HUB - ADVANCED PARITY',
          `--> ENTRY TRIGGER: WATCH FOR DIGIT ${result.entryDigit}`,
          `--> DIRECTION: ${result.direction.toUpperCase()}`,
          `--> CONFIDENCE: ${result.confidence.toFixed(1)}%`,
          '',
          `REASONING: ${result.reasoning}`,
          `LIVE SEQUENCE: [${tickSeq}]`,
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
                  const newLines = [...initialResults, `SIGNAL ACTIVE: Auto-entry in ${countdown}s...`];
                  countdown--;
                  return newLines;
              } else {
                  clearInterval(interval);
                  const finalLines = [...initialResults, `SIGNAL ACTIVE: Entry locked at Trigger ${result.entryDigit}.`, 'STABILITY CONFIRMED.'];
                  return finalLines;
              }
          });
        }, 1000);
    }, 2500);
  };

  const displayedOutcomes = outcomes.slice(0, 8);
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