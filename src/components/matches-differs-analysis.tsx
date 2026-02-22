'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type Outcome = 'M' | 'D';

export function MatchesDiffersAnalysis() {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'D', count: 0 });
  const [percentages, setPercentages] = React.useState({ matches: 0, differs: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);

  const handleSelectDigit = (digit: number) => {
    setSelectedDigit(digit);
    setOutcomes([]);
    setStreak({ type: 'D', count: 0 });
    setPercentages({ matches: 0, differs: 0 });
  };
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      const lastDigit = Math.floor(Math.random() * 10);
      const newOutcome: Outcome = lastDigit === selectedDigit ? 'M' : 'D';

      setOutcomes(prev => [newOutcome, ...prev].slice(0, 100));

      setStreak(prev => {
        if (newOutcome === prev.type) {
          return { ...prev, count: prev.count + 1 };
        }
        return { type: newOutcome, count: 1 };
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [selectedDigit]);

  React.useEffect(() => {
    if (outcomes.length === 0) {
      setPercentages({ matches: 0, differs: 0 });
      return;
    }
    const matchCount = outcomes.filter(o => o === 'M').length;
    const differCount = outcomes.length - matchCount;
    setPercentages({
      matches: (matchCount / outcomes.length) * 100,
      differs: (differCount / outcomes.length) * 100,
    });
  }, [outcomes]);

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

      </CardContent>
    </Card>
  );
}
