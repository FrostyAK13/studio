'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type Outcome = 'E' | 'O';

export function EvenOddAnalysis() {
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'E', count: 0 });
  const [percentages, setPercentages] = React.useState({ even: 0, odd: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const lastDigit = Math.floor(Math.random() * 10);
      const newOutcome: Outcome = lastDigit % 2 === 0 ? 'E' : 'O';

      setOutcomes(prev => [newOutcome, ...prev].slice(0, 100));

      setStreak(prev => {
        if (newOutcome === prev.type) {
          return { ...prev, count: prev.count + 1 };
        }
        return { type: newOutcome, count: 1 };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (outcomes.length === 0) {
      setPercentages({ even: 0, odd: 0 });
      return;
    }
    const evenCount = outcomes.filter(o => o === 'E').length;
    const oddCount = outcomes.length - evenCount;
    setPercentages({
      even: (evenCount / outcomes.length) * 100,
      odd: (oddCount / outcomes.length) * 100,
    });
  }, [outcomes]);

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);

  return (
    <Card className="bg-card/50">
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
                  outcome === 'E' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-pink-500 to-red-500'
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
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-0 text-primary-foreground">
                <CardContent className="p-4">
                    <p className="text-sm text-purple-200/80">EVEN</p>
                    <p className="text-3xl font-bold my-2">{percentages.even.toFixed(1)}%</p>
                    <Progress value={percentages.even} className="h-2 bg-white/20 [&>div]:bg-white/80" />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-pink-500 to-red-500 border-0 text-primary-foreground">
                 <CardContent className="p-4">
                    <p className="text-sm text-red-200/80">ODD</p>
                    <p className="text-3xl font-bold my-2">{percentages.odd.toFixed(1)}%</p>
                    <Progress value={percentages.odd} className="h-2 bg-white/20 [&>div]:bg-white/80" />
                </CardContent>
            </Card>
        </div>

      </CardContent>
    </Card>
  );
}
