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

    if (outcomes.length < 25) {
        setTimeout(() => {
            setScanResultLines(["Not enough tick data to run analysis.", "Please wait for at least 25 ticks."]);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }
    
    setTimeout(() => {
        let predictedOutcome: 'OVER' | 'UNDER';
        let predictedDigit: number;
        let reasoning: string;

        // Strategy: Don't use selectedDigit for prediction. Use safer, fixed digits.
        const overThreshold = 60;
        const underThreshold = 60;
        const streakThreshold = 5;

        if (percentages.over > overThreshold) {
            predictedOutcome = 'OVER';
            predictedDigit = 2;
            reasoning = `High 'Over' probability detected (${percentages.over.toFixed(1)}%). Predicting OVER a low digit.`;
        } else if (percentages.under > underThreshold) {
            predictedOutcome = 'UNDER';
            predictedDigit = 7;
            reasoning = `High 'Under' probability detected (${percentages.under.toFixed(1)}%). Predicting UNDER a high digit.`;
        } else if (streak.count >= streakThreshold) {
            if (streak.type === 'O') {
                predictedOutcome = 'UNDER';
                predictedDigit = 7;
                reasoning = `A long streak of 'Over' (${streak.count}x) suggests a potential reversal to Under.`;
            } else { // streak.type === 'U'
                predictedOutcome = 'OVER';
                predictedDigit = 2;
                reasoning = `A long streak of 'Under' (${streak.count}x) suggests a potential reversal to Over.`;
            }
        } else {
            // Fallback: If no strong signal, choose the higher probability and a safe digit.
            if (percentages.over >= percentages.under) {
                predictedOutcome = 'OVER';
                predictedDigit = 2;
                reasoning = 'No strong signal found. Defaulting to safer OVER trade based on general tendency.';
            } else {
                predictedOutcome = 'UNDER';
                predictedDigit = 7;
                reasoning = 'No strong signal found. Defaulting to safer UNDER trade based on general tendency.';
            }
        }
        
        let entryPointDigit: number;
        const predictionText = `${predictedOutcome} ${predictedDigit}`;

        if (predictedOutcome === 'OVER') {
            // Random digit between predictedDigit + 1 and 9
            entryPointDigit = Math.floor(Math.random() * (9 - (predictedDigit + 1) + 1)) + (predictedDigit + 1);
        } else { // UNDER
            // Random digit between 0 and predictedDigit - 1
            entryPointDigit = Math.floor(Math.random() * predictedDigit);
        }

        const initialResults = [
            'Analysis Complete!',
            `--> Prediction: ${predictionText}`,
            `--> Entry Point: ${entryPointDigit}`,
            '',
            `Reasoning: ${reasoning}`,
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
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-semibold">Over/Under Analysis</h3>
                <p className="text-sm text-muted-foreground -mt-1">{marketName}</p>
            </div>
            <div className="flex items-start gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-medium text-sm">
                        Current Streak: <br/> {streak.count}x {streak.type === 'O' ? 'Over' : 'Under'}
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
                <div key={index} className={cn("flex items-center justify-center w-12 h-12 rounded-lg shadow-inner",
                  outcome === 'O' ? 'bg-accent/10 border border-accent/20' : outcome === 'U' ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted border'
                )}>
                    <span className={cn("font-bold text-lg",
                      outcome === 'O' ? 'text-accent' : outcome === 'U' ? 'text-destructive' : 'text-muted-foreground'
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
            <Card className="bg-gradient-to-br from-accent to-green-400 border-0 text-accent-foreground">
                <CardContent className="p-4">
                    <p className="text-sm text-green-100/80">OVER</p>
                    <p className="text-3xl font-bold my-2">{percentages.over.toFixed(1)}%</p>
                    <Progress value={percentages.over} className="h-2 bg-white/20 [&>div]:bg-white" />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-destructive to-red-400 border-0 text-destructive-foreground">
                 <CardContent className="p-4">
                    <p className="text-sm text-red-100/80">UNDER</p>
                    <p className="text-3xl font-bold my-2">{percentages.under.toFixed(1)}%</p>
                    <Progress value={percentages.under} className="h-2 bg-white/20 [&>div]:bg-white" />
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
                 <HackerAnimation title={`Analysis Dashboard - Over/Under on ${marketName}`}>
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
