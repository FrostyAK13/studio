'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2 } from 'lucide-react';

type Outcome = 'O' | 'U';

export function OverUnderAnalysis({ lastDigitTicks }: { lastDigitTicks: number[]; }) {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'U', count: 0 });
  const [percentages, setPercentages] = React.useState({ over: 0, under: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [prediction, setPrediction] = React.useState<{ outcome: Outcome; digit: number } | null>(null);
  const [animatedDigit, setAnimatedDigit] = React.useState(0);

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
        return;
    }
    if (lastDigitTicks.length < 10) return;

    setIsScanning(true);
    setShowScanner(false);
    setPrediction(null);
    
    const animationInterval = setInterval(() => {
        setAnimatedDigit(Math.floor(Math.random() * 10));
    }, 80);

    setTimeout(() => {
        clearInterval(animationInterval);
        let bestBet = { outcome: 'U' as Outcome, digit: 5, rate: 0 };

        // Check "Over" bets from 1 to 8 (excluding Over 0)
        for (let d = 1; d <= 8; d++) {
          const relevantTicks = lastDigitTicks.filter(tick => tick !== d);
          if (relevantTicks.length > 0) {
              const overCount = relevantTicks.filter(tick => tick > d).length;
              const rate = overCount / relevantTicks.length;
              if (rate > bestBet.rate) {
                  bestBet = { outcome: 'O', digit: d, rate: rate };
              }
          }
        }
  
        // Check "Under" bets from 1 to 8 (excluding Under 9)
        for (let d = 1; d <= 8; d++) {
          const relevantTicks = lastDigitTicks.filter(tick => tick !== d);
          if (relevantTicks.length > 0) {
              const underCount = relevantTicks.filter(tick => tick < d).length;
              const rate = underCount / relevantTicks.length;
              if (rate > bestBet.rate) {
                  bestBet = { outcome: 'U', digit: d, rate: rate };
              }
          }
        }
        
        setPrediction({ outcome: bestBet.outcome, digit: bestBet.digit });
        handleSelectDigit(bestBet.digit);
      
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
                                {prediction.outcome === 'O' ? `OVER ${prediction.digit}` : `UNDER ${prediction.digit}`}
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
