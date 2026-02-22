'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine } from 'lucide-react';

type Outcome = 'M' | 'D';

export function MatchesDiffersAnalysis({ lastDigitTicks }: { lastDigitTicks: number[] }) {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'D', count: 0 });
  const [percentages, setPercentages] = React.useState({ matches: 0, differs: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [showScanner, setShowScanner] = React.useState(false);
  const [scannerStats, setScannerStats] = React.useState<{ longestMatch: number; longestDiffer: number; totalSwitches: number } | null>(null);

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
    if (showScanner) {
        setShowScanner(false);
        return;
    }
    if (outcomes.length === 0) return;

    const streaks = outcomes.reduce((acc: {type: Outcome, count: number}[], outcome) => {
        if (acc.length === 0 || acc[acc.length - 1].type !== outcome) {
            acc.push({ type: outcome, count: 1 });
        } else {
            acc[acc.length - 1].count++;
        }
        return acc;
    }, []);

    const longestMatch = Math.max(0, ...streaks.filter(s => s.type === 'M').map(s => s.count));
    const longestDiffer = Math.max(0, ...streaks.filter(s => s.type === 'D').map(s => s.count));
    const totalSwitches = streaks.length > 1 ? streaks.length - 1 : 0;
    
    setScannerStats({ longestMatch, longestDiffer, totalSwitches });
    setShowScanner(true);
  };

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);

  return (
    <Card className="bg-card/50">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Matches/Differs Analysis</h3>
          <p className="text-muted-foreground font-medium">
            Current Streak: {streak.count}x {streak.type === 'M' ? 'Match' : 'Differ'}
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
                <div key={index} className="flex items-center justify-center w-12 h-12 bg-card rounded-lg border border-orange-400/30 shadow-inner">
                    <span className="font-bold text-orange-300 text-lg">{outcome}</span>
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
            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-0">
                <CardContent className="p-4">
                    <p className="text-sm text-blue-200/80">MATCHES</p>
                    <p className="text-3xl font-bold my-2">{percentages.matches.toFixed(1)}%</p>
                    <Progress value={percentages.matches} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-cyan-400 [&>div]:to-blue-500" />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500/30 to-yellow-500/30 border-0">
                 <CardContent className="p-4">
                    <p className="text-sm text-orange-200/80">DIFFERS</p>
                    <p className="text-3xl font-bold my-2">{percentages.differs.toFixed(1)}%</p>
                    <Progress value={percentages.differs} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-orange-400 [&>div]:to-yellow-500" />
                </CardContent>
            </Card>
        </div>

        <div className="mt-6 text-center">
            <Button onClick={handleScan} variant="secondary">
                <ScanLine className="mr-2 h-4 w-4" />
                {showScanner ? 'Hide Scanner' : 'Run Scanner'}
            </Button>
        </div>

        <AnimatePresence>
            {showScanner && scannerStats && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="mt-6"
                >
                  <Card className="bg-card/70 w-full">
                    <CardHeader>
                        <CardTitle className="text-lg">Scanner Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Longest Match</p>
                                <p className="text-2xl font-bold text-primary">{scannerStats.longestMatch}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Longest Differ</p>
                                <p className="text-2xl font-bold text-primary">{scannerStats.longestDiffer}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Switches</p>
                                <p className="text-2xl font-bold text-primary">{scannerStats.totalSwitches}</p>
                            </div>
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
