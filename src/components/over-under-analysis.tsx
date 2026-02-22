'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type Outcome = 'O' | 'U';

export function OverUnderAnalysis() {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'U', count: 0 });
  const [percentages, setPercentages] = React.useState({ over: 0, under: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);

  const handleSelectDigit = (digit: number) => {
    setSelectedDigit(digit);
    setOutcomes([]);
    setStreak({ type: 'U', count: 0 });
    setPercentages({ over: 0, under: 0 });
  };
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      const lastDigit = Math.floor(Math.random() * 10);
      let newOutcome: Outcome | null = null;
      if (lastDigit > selectedDigit) {
        newOutcome = 'O';
      } else if (lastDigit < selectedDigit) {
        newOutcome = 'U';
      }

      if (newOutcome) {
        setOutcomes(prev => [newOutcome!, ...prev].slice(0, 100));

        setStreak(prev => {
          if (newOutcome === prev.type) {
            return { ...prev, count: prev.count + 1 };
          }
          return { type: newOutcome!, count: 1 };
        });
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedDigit]);

  React.useEffect(() => {
    if (outcomes.length === 0) {
      setPercentages({ over: 0, under: 0 });
      return;
    }
    const overCount = outcomes.filter(o => o === 'O').length;
    const underCount = outcomes.length - overCount;
    setPercentages({
      over: (overCount / outcomes.length) * 100,
      under: (underCount / outcomes.length) * 100,
    });
  }, [outcomes]);

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);

  return (
    <Card className="bg-card/50">
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
                  outcome === 'O' ? 'bg-gradient-to-br from-green-500/30 to-cyan-500/30 border border-green-400/30' : 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-400/30'
                )}>
                    <span className={cn("font-bold text-lg",
                      outcome === 'O' ? 'text-green-300' : 'text-purple-300'
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
            <Card className="bg-gradient-to-br from-green-500/30 to-cyan-500/30 border-0">
                <CardContent className="p-4">
                    <p className="text-sm text-green-200/80">OVER</p>
                    <p className="text-3xl font-bold my-2">{percentages.over.toFixed(1)}%</p>
                    <Progress value={percentages.over} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-cyan-400" />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-0">
                 <CardContent className="p-4">
                    <p className="text-sm text-purple-200/80">UNDER</p>
                    <p className="text-3xl font-bold my-2">{percentages.under.toFixed(1)}%</p>
                    <Progress value={percentages.under} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-purple-400 [&>div]:to-blue-400" />
                </CardContent>
            </Card>
        </div>

      </CardContent>
    </Card>
  );
}
