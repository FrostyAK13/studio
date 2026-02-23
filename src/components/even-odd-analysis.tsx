'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2 } from 'lucide-react';

type Outcome = 'E' | 'O';

export function EvenOddAnalysis({ lastDigitTicks }: { lastDigitTicks: number[] }) {
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'E', count: 0 });
  const [percentages, setPercentages] = React.useState({ even: 0, odd: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [prediction, setPrediction] = React.useState<Outcome | null>(null);
  const [animatedDigit, setAnimatedDigit] = React.useState(0);

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
    if (showScanner) {
        setShowScanner(false);
        setPrediction(null);
        return;
    }
    if (outcomes.length < 10) return;

    setIsScanning(true);
    setShowScanner(false);
    setPrediction(null);

    const animationInterval = setInterval(() => {
        setAnimatedDigit(Math.floor(Math.random() * 10));
    }, 80);

    setTimeout(() => {
        clearInterval(animationInterval);
        let predictedOutcome: Outcome;

        // Strategy:
        // 1. If one outcome is heavily dominant (>65%), predict that.
        // 2. If there's a long streak (>= 5), predict a reversal (break of pattern).
        // 3. Otherwise, predict the currently dominant outcome.
        if (percentages.even > 65) {
            predictedOutcome = 'E';
        } else if (percentages.odd > 65) {
            predictedOutcome = 'O';
        } else if (streak.count >= 5) {
            // Predict reversal of a long streak
            predictedOutcome = streak.type === 'E' ? 'O' : 'E';
        } else {
            // Predict the most frequent outcome
            predictedOutcome = percentages.even >= percentages.odd ? 'E' : 'O';
        }
        
        setPrediction(predictedOutcome);
        setShowScanner(true);
        setIsScanning(false);
    }, 2500);
  };

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);

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
                {isScanning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <ScanLine className="mr-2 h-4 w-4" />
                )}
                {showScanner ? 'Hide Scanner' : isScanning ? 'Analyzing...' : 'Run Scanner'}
            </Button>
        </div>
        
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6"
          >
            <Card className="w-full">
              <CardHeader>
                  <CardTitle className="text-lg">Analyzing Market...</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex justify-center items-center h-24 overflow-hidden">
                      <AnimatePresence mode="popLayout">
                          <motion.div
                              key={animatedDigit}
                              initial={{ y: 50, opacity: 0, position: 'absolute' }}
                              animate={{ y: 0, opacity: 1, position: 'relative' }}
                              exit={{ y: -50, opacity: 0, position: 'absolute' }}
                              transition={{ duration: 0.1, ease: 'easeInOut' }}
                              className="text-6xl font-bold text-primary"
                          >
                              {animatedDigit}
                          </motion.div>
                      </AnimatePresence>
                  </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <AnimatePresence>
            {showScanner && prediction && !isScanning && (
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
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Next Outcome</p>
                            <p className="text-4xl font-bold text-primary">
                                {prediction === 'E' ? 'EVEN' : 'ODD'}
                            </p>
                        </div>
                    </CardContent>
                  </Card>
                </motion.div>
            )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
