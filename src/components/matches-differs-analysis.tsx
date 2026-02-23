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

type Outcome = 'M' | 'D';

interface MatchesDiffersAnalysisProps {
    lastDigitTicks: number[];
    selectedMarket: string;
    price: number;
    decimalPlaces: number;
}

export function MatchesDiffersAnalysis({ lastDigitTicks, selectedMarket, price, decimalPlaces }: MatchesDiffersAnalysisProps) {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'D', count: 0 });
  const [percentages, setPercentages] = React.useState({ matches: 0, differs: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResultLines, setScanResultLines] = React.useState<string[] | null>(null);

  const handleSelectDigit = (digit: number) => {
    setSelectedDigit(digit);
  };
  
  React.useEffect(() => {
    if (lastDigitTicks.length === 0) {
      setOutcomes([]);
      setStreak({ type: 'D', count: 0 });
      setPercentages({ matches: 0, differs: 0 });
      return;
    }

    const newOutcomes = lastDigitTicks.map(digit => (digit === selectedDigit ? 'M' : 'D'));
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
        setStreak({ type: 'D', count: 0 });
    }

    const matchCount = newOutcomes.filter(o => o === 'M').length;
    const differCount = newOutcomes.length - matchCount;
    setPercentages({
      matches: newOutcomes.length > 0 ? (matchCount / newOutcomes.length) * 100 : 0,
      differs: newOutcomes.length > 0 ? (differCount / newOutcomes.length) * 100 : 0,
    });
  }, [lastDigitTicks, selectedDigit]);

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
        let predictedOutcome: 'MATCH' | 'DIFFER';
        let entryDigit: number;
        let reasoning: string;

        // Strategy: Find the "hottest" digit for a potential MATCH trade.
        const digitCounts = Array(10).fill(0);
        lastDigitTicks.forEach(d => digitCounts[d]++);
        
        const digitPercentages = digitCounts.map(c => lastDigitTicks.length > 0 ? (c / lastDigitTicks.length) * 100 : 0);

        let hottestDigit = 0;
        let highestPercentage = 0;
        digitPercentages.forEach((p, i) => {
            if (p > highestPercentage) {
                highestPercentage = p;
                hottestDigit = i;
            }
        });

        const matchThreshold = 15; // A digit appearing >15% of the time is significant (baseline is 10%)
        
        if (highestPercentage > matchThreshold) {
            predictedOutcome = 'MATCH';
            entryDigit = hottestDigit;
            reasoning = `High frequency of digit ${entryDigit} detected (${highestPercentage.toFixed(1)}%).`;
        } else {
            // Default to a DIFFER trade on the user's selected digit if no hot digit is found.
            predictedOutcome = 'DIFFER';
            entryDigit = selectedDigit;
            reasoning = `No strong MATCH signal found. Defaulting to a DIFFER trade on the analyzed digit.`;
        }

      let entryPointDigitExample: number;
      const predictionText = `${predictedOutcome} ${entryDigit}`;

      if (predictedOutcome === 'MATCH') {
        entryPointDigitExample = entryDigit;
      } else { // DIFFER
        do {
          entryPointDigitExample = Math.floor(Math.random() * 10);
        } while (entryPointDigitExample === entryDigit);
      }
      
      const initialResults = [
        'Analysis Complete!',
        `--> Prediction: ${predictionText}`,
        `--> Entry Point: ${entryPointDigitExample}`,
        '',
        `Reasoning: ${reasoning}`,
        `Analyzed Frequency for Digit ${entryDigit}: ${digitPercentages[entryDigit].toFixed(2)}%`,
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
            }

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
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-semibold">Matches/Differs Analysis</h3>
                <p className="text-sm text-muted-foreground -mt-1">{marketName}</p>
            </div>
            <div className="flex items-start gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-medium text-sm">
                        Current Streak: <br /> {streak.count}x {streak.type === 'M' ? 'Match' : 'Differ'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">PRICE</p>
                    <p className="text-2xl font-bold text-primary">{price.toFixed(decimalPlaces)}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6">
          {Array.from({ length: 10 }, (_, i) => (
            <Button
              key={i}
              variant={selectedDigit === i ? 'default' : 'outline'}
              className={cn(
                'w-12 h-12 rounded-lg text-lg font-bold',
                selectedDigit === i ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-card'
              )}
              onClick={() => handleSelectDigit(i)}
            >
              {i}
            </Button>
          ))}
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6 min-h-[56px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className="flex items-center justify-center w-12 h-12 bg-card rounded-lg border border-border shadow-inner">
                    <span className="font-bold text-foreground text-lg">{outcome}</span>
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
            <Card className="bg-gradient-to-br from-cyan-300 to-blue-400 border-0 text-white">
                <CardContent className="p-4">
                    <p className="text-sm text-blue-100/80">MATCHES</p>
                    <p className="text-3xl font-bold my-2">{percentages.matches.toFixed(1)}%</p>
                    <Progress value={percentages.matches} className="h-2 bg-white/20 [&>div]:bg-white" />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-slate-300 to-gray-400 border-0 text-slate-800">
                 <CardContent className="p-4">
                    <p className="text-sm text-slate-700/80">DIFFERS</p>
                    <p className="text-3xl font-bold my-2">{percentages.differs.toFixed(1)}%</p>
                    <Progress value={percentages.differs} className="h-2 bg-slate-600/20 [&>div]:bg-slate-800" />
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
                <HackerAnimation title={`Analysis Dashboard - Matches & Differs on ${marketName}`}>
                    {isScanning && !scanResultLines ? (
                        <ScannerAnimationContent />
                    ) : (
                        <div className="space-y-1">
                            {scanResultLines?.map((line, index) => (
                                <p key={index}>{line}</p>
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
