'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2 } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { syntheticIndices } from '@/lib/mock-data';
import { ScannerAnimationContent } from './scanner-animation-content';

type Outcome = 'E' | 'O';

export function EvenOddAnalysis({ lastDigitTicks, selectedMarket }: { lastDigitTicks: number[], selectedMarket: string }) {
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

    if (outcomes.length < 10) {
        setTimeout(() => {
            setScanResultLines(['Not enough data. Need at least 10 ticks.']);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }

    setTimeout(() => {
        let predictedOutcome: Outcome;

        if (percentages.even > 65) {
            predictedOutcome = 'E';
        } else if (percentages.odd > 65) {
            predictedOutcome = 'O';
        } else if (streak.count >= 5) {
            predictedOutcome = streak.type === 'E' ? 'O' : 'E';
        } else {
            predictedOutcome = percentages.even >= percentages.odd ? 'E' : 'O';
        }

        const initialResults = [
          'Analysis Complete!',
          `--> Predicted Entry: ${predictedOutcome === 'E' ? 'EVEN' : 'ODD'}`,
          '',
          `Even Probability: ${percentages.even.toFixed(2)}%`,
          `Odd Probability: ${percentages.odd.toFixed(2)}%`,
          `Current Streak: ${streak.count}x ${streak.type === 'E' ? 'Even' : 'Odd'}`,
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
                  const newLines = [...initialResults, `Running bot in ${countdown} seconds...`];
                  countdown--;
                  return newLines;
              } else {
                  clearInterval(interval);
                  const finalLines = [...initialResults, `Running bot in 0 seconds...`, 'Bot activated!'];
                  setTimeout(() => {
                      setScanResultLines(null);
                  }, 60000);
                  return finalLines;
              }
          });
        }, 1000);
    }, 2500);
  };

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);
  const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Even/Odd Analysis</h3>
          <p className="text-muted-foreground font-medium">
            Current Streak: {streak.count}x {streak.type === 'E' ? 'Even' : 'Odd'}
          </p>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6 min-h-[56px]">
            {displayedOutcomes.map((outcome, index) => (
                <div key={index} className={cn("flex items-center justify-center w-12 h-12 rounded-lg shadow-inner",
                  outcome === 'E' ? 'bg-gradient-to-br from-blue-400 to-cyan-400' : 'bg-gradient-to-br from-violet-400 to-purple-500'
                )}>
                    <span className={cn("font-bold text-lg text-primary-foreground",
                    )}>{outcome}</span>
                </div>
            ))}
        </div>

        {outcomes.length > 8 && (
            <div className="text-center mb-6">
                <Button onClick={() => setShowAllOutcomes(prev => !prev)} variant="secondary">
                    {showAllOutcomes ? 'Show Less' : 'More'}
                </Button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-400 to-cyan-400 border-0 text-primary-foreground">
                <CardContent className="p-4">
                    <p className="text-sm text-blue-100/80">EVEN</p>
                    <p className="text-3xl font-bold my-2">{percentages.even.toFixed(1)}%</p>
                    <Progress value={percentages.even} className="h-2 bg-white/20 [&>div]:bg-white" />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-violet-400 to-purple-500 border-0 text-primary-foreground">
                 <CardContent className="p-4">
                    <p className="text-sm text-violet-100/80">ODD</p>
                    <p className="text-3xl font-bold my-2">{percentages.odd.toFixed(1)}%</p>
                    <Progress value={percentages.odd} className="h-2 bg-white/20 [&>div]:bg-white" />
                </CardContent>
            </Card>
        </div>

        <div className="mt-6 text-center">
            <Button onClick={handleScan} variant="secondary" disabled={isScanning}>
                {isScanning && !scanResultLines ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ScanLine className="mr-2 h-4 w-4" />
                )}
                {scanResultLines ? 'Hide Scanner' : isScanning ? 'Analyzing...' : 'Run Scanner'}
            </Button>
        </div>
        
        <AnimatePresence>
            {(isScanning || scanResultLines) && (
                <HackerAnimation title={`Analysis Dashboard - Even/Odd on ${marketName}`}>
                    {scanResultLines ? (
                        <div className="space-y-1">
                            {scanResultLines.map((line, index) => (
                                <p key={index}>{line}</p>
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
