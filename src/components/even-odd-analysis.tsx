'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, ShieldCheck, Target } from 'lucide-react';
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

    if (lastDigitTicks.length < 15) {
        setTimeout(() => {
            setScanResultLines(['ERROR: Insufficient data sequence.', 'Minimum 15 ticks required for safe analysis.']);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }

    setTimeout(() => {
        const recentTicks = lastDigitTicks.slice(0, 10);
        const tickSeq = [...recentTicks].reverse().join(',');
        let predictedOutcome: Outcome;
        let possibleDigits: number[] = [];
        let triggerDigit: number;
        let strategy = "";

        const recentCluster = outcomes.slice(0, 5);
        const evenCountRecent = recentCluster.filter(o => o === 'E').length;

        // Logic to determine trigger digit (the digit that likely precedes the outcome)
        triggerDigit = recentTicks[0]; 

        if (streak.count >= 6) {
            predictedOutcome = streak.type === 'E' ? 'O' : 'E';
            strategy = `REVERSAL: Sequence [${tickSeq}] shows ${streak.count}x ${streak.type === 'E' ? 'Even' : 'Odd'} exhaustion. Trigger digit ${triggerDigit} confirms peak variance.`;
        } else if (evenCountRecent >= 4) {
            predictedOutcome = 'E';
            strategy = `MOMENTUM: Cluster [${tickSeq.split(',').slice(-5).join(',')}] is heavily Even biased. Following flow after trigger ${triggerDigit}.`;
        } else {
            predictedOutcome = percentages.even >= percentages.odd ? 'E' : 'O';
            strategy = `PROBABILITY: Global distribution [E:${percentages.even.toFixed(1)}%] favors ${predictedOutcome === 'E' ? 'Even' : 'Odd'}. Trigger ${triggerDigit} is the entry pivot.`;
        }
        
        possibleDigits = predictedOutcome === 'E' ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9];

        const initialResults = [
          'ANALYSIS COMPLETE - HIGH ACCURACY MODE',
          `--> ENTRY TRIGGER: WATCH FOR DIGIT ${triggerDigit}`,
          `--> PREDICTED OUTCOME: ${predictedOutcome === 'E' ? 'EVEN' : 'ODD'}`,
          `--> TARGET RANGE: [${possibleDigits.join(', ')}]`,
          '',
          `STRATEGY REASONING: ${strategy}`,
          `SEQUENCE ANALYZED: [${tickSeq}]`,
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
                  const finalLines = [...initialResults, `SIGNAL ACTIVE: Entry confirmed at Trigger ${triggerDigit}.`, 'MONITORING FOR LOSS MITIGATION...'];
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
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-black tracking-tight uppercase">EVEN/ODD SCANNER</h3>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{marketName}</p>
            </div>
            <div className="flex items-start gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                        RHYTHM STREAK
                    </p>
                    <p className="text-xl font-black text-primary">{streak.count}x {streak.type === 'E' ? 'EVN' : 'ODD'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">LIVE PRICE</p>
                    <p className="text-xl font-black text-foreground">{price.toFixed(decimalPlaces)}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6 min-h-[56px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className={cn("flex items-center justify-center w-12 h-12 rounded-xl shadow-lg border border-white/5",
                  outcome === 'E' ? 'bg-gradient-to-br from-chart-1 to-blue-600' : 'bg-gradient-to-br from-chart-3 to-purple-700'
                )}>
                    <span className="font-black text-lg text-white drop-shadow-md">{outcome}</span>
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
                <div className="absolute inset-0 bg-chart-1/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black text-chart-1 tracking-widest">EVEN DISTRIBUTION</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-3xl font-black">{percentages.even.toFixed(1)}%</p>
                    <div className="p-1.5 bg-chart-1/20 rounded-lg"><Target className="h-4 w-4 text-chart-1" /></div>
                </div>
                <Progress value={percentages.even} className="h-2.5 bg-white/5 [&>div]:bg-chart-1" />
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-chart-3/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black text-chart-3 tracking-widest">ODD DISTRIBUTION</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-3xl font-black">{percentages.odd.toFixed(1)}%</p>
                    <div className="p-1.5 bg-chart-3/20 rounded-lg"><ShieldCheck className="h-4 w-4 text-chart-3" /></div>
                </div>
                <Progress value={percentages.odd} className="h-2.5 bg-white/5 [&>div]:bg-chart-3" />
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
                <HackerAnimation title={`SYSTEM SCAN: EVEN/ODD ANALYTICS`}>
                    {scanResultLines ? (
                        <div className="space-y-1.5">
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
