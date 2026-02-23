'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2 } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';

type Outcome = 'O' | 'U';

interface OverUnderAnalysisProps {
  lastDigitTicks: number[];
}

export function OverUnderAnalysis({ lastDigitTicks }: OverUnderAnalysisProps) {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'U', count: 0 });
  const [percentages, setPercentages] = React.useState({ over: 0, under: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [prediction, setPrediction] = React.useState<{ outcome: 'OVER' | 'UNDER'; digit: number; reasoning: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);


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
    
    const newOutcomes: Outcome[] = lastDigitTicks.reduce((acc: Outcome[], digit) => {
      if (digit > selectedDigit) {
        acc.push('O');
      } else if (digit < selectedDigit) {
        acc.push('U');
      }
      return acc;
    }, []);

    setOutcomes(newOutcomes);

    if(newOutcomes.length > 0) {
        let currentStreak = { type: newOutcomes[0], count: 0 };
        for (const outcome of newOutcomes) {
          if (outcome === currentStreak.type) {
            currentStreak.count++;
          } else {
            break;
          }
        }
        setStreak(currentStreak);
    
        const overCount = newOutcomes.filter(o => o === 'O').length;
        const underCount = newOutcomes.length - overCount;
        setPercentages({
          over: newOutcomes.length > 0 ? (overCount / newOutcomes.length) * 100 : 0,
          under: newOutcomes.length > 0 ? (underCount / newOutcomes.length) * 100 : 0,
        });
    } else {
        setStreak({ type: 'U', count: 0 });
        setPercentages({ over: 0, under: 0 });
    }
  }, [lastDigitTicks, selectedDigit]);

  const handleScan = () => {
    if (showScanner) {
        setShowScanner(false);
        setPrediction(null);
        setError(null);
        return;
    }

    if (outcomes.length < 25) {
        setError("Not enough tick data to run analysis. Please wait for at least 25 ticks.");
        setShowScanner(true);
        return;
    }

    setIsScanning(true);
    setShowScanner(false);
    setPrediction(null);
    setError(null);
    
    setTimeout(() => {
        let predictedOutcome: 'OVER' | 'UNDER';
        let predictedDigit: number;
        let reasoning: string;

        // Strategy:
        // 1. If 'Over' is heavily dominant (>65%), predict OVER a low digit.
        // 2. If 'Under' is heavily dominant (>65%), predict UNDER a high digit.
        // 3. If there's a long streak (>= 5), predict a reversal.
        // 4. Otherwise, predict the current dominant trend.

        if (percentages.over > 65) {
            predictedOutcome = 'OVER';
            predictedDigit = 2;
            reasoning = `Over ${percentages.over.toFixed(0)}% of recent ticks were 'Over'. Predicting a continuation of the trend over a low digit.`;
        } else if (percentages.under > 65) {
            predictedOutcome = 'UNDER';
            predictedDigit = 7;
            reasoning = `Over ${percentages.under.toFixed(0)}% of recent ticks were 'Under'. Predicting a continuation of the trend under a high digit.`;
        } else if (streak.count >= 5) {
            // Predict reversal
            if (streak.type === 'O') {
                predictedOutcome = 'UNDER';
                predictedDigit = selectedDigit;
                reasoning = `A long streak of 'Over' (${streak.count}x) suggests a potential reversal.`;
            } else {
                predictedOutcome = 'OVER';
                predictedDigit = selectedDigit;
                reasoning = `A long streak of 'Under' (${streak.count}x) suggests a potential reversal.`;
            }
        } else {
            // Predict continuation of dominant trend
            if (percentages.over >= percentages.under) {
                predictedOutcome = 'OVER';
                predictedDigit = selectedDigit;
                reasoning = 'The market is currently showing a tendency for digits to be over the selected value.';
            } else {
                predictedOutcome = 'UNDER';
                predictedDigit = selectedDigit;
                reasoning = 'The market is currently showing a tendency for digits to be under the selected value.';
            }
        }

        setPrediction({ outcome: predictedOutcome, digit: predictedDigit, reasoning: reasoning });
        setShowScanner(true);
        setIsScanning(false);
    }, 2500);
  };

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Over/Under Analysis</h3>
          <p className="text-muted-foreground font-medium">
            Current Streak: {streak.count}x {streak.type === 'O' ? 'Over' : 'Under'}
          </p>
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
            {displayedOutcomes.map((outcome, index) => (
                <div key={index} className={cn("flex items-center justify-center w-12 h-12 rounded-lg shadow-inner",
                  outcome === 'O' ? 'bg-teal-100 border border-teal-200' : 'bg-sky-100 border border-sky-200'
                )}>
                    <span className={cn("font-bold text-lg",
                      outcome === 'O' ? 'text-teal-700' : 'text-sky-700'
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
            <Card className="bg-gradient-to-br from-teal-300 to-cyan-400 border-0 text-white">
                <CardContent className="p-4">
                    <p className="text-sm text-cyan-100/80">OVER</p>
                    <p className="text-3xl font-bold my-2">{percentages.over.toFixed(1)}%</p>
                    <Progress value={percentages.over} className="h-2 bg-white/20 [&>div]:bg-white" />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-sky-300 to-indigo-400 border-0 text-white">
                 <CardContent className="p-4">
                    <p className="text-sm text-indigo-100/80">UNDER</p>
                    <p className="text-3xl font-bold my-2">{percentages.under.toFixed(1)}%</p>
                    <Progress value={percentages.under} className="h-2 bg-white/20 [&>div]:bg-white" />
                </CardContent>
            </Card>
        </div>

        <div className="mt-6 text-center">
            <Button onClick={handleScan} variant="secondary" disabled={isScanning}>
                 {isScanning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ScanLine className="mr-2 h-4 w-4" />
                )}
                {showScanner ? 'Hide Scanner' : isScanning ? 'Analyzing...' : 'Run Scanner'}
            </Button>
        </div>
        
        {isScanning && <HackerAnimation title="Analyzing Over/Under Market..." />}

        <AnimatePresence>
            {showScanner && !isScanning && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="mt-6"
                >
                  <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-lg">Prediction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {prediction ? (
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">Predicted Outcome</p>
                                <p className="text-4xl font-bold text-primary">
                                    {`${prediction.outcome} ${prediction.digit}`}
                                </p>
                                <p className="text-sm text-muted-foreground pt-2 italic">"{prediction.reasoning}"</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-muted-foreground">{error || "No trading signal found."}</p>
                            </div>
                        )}
                    </CardContent>
                  </Card>
                </motion.div>
            )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
