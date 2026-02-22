'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DigitPatternAssistantInsightOutput } from '@/ai/flows/digit-pattern-assistant-insight';

type Outcome = 'O' | 'U';

const AnalysisCard = ({ title, prediction, confidence, analysis }: { title: string; prediction: string | number; confidence: number; analysis: string; }) => (
    <Card className="bg-card/70 w-full mt-4">
        <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-4xl font-bold text-primary">{prediction.toString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Confidence: {(confidence * 100).toFixed(0)}%</p>
            <p className="text-sm mt-4">{analysis}</p>
        </CardContent>
    </Card>
);

export function OverUnderAnalysis({ lastDigitTicks, analysis }: { lastDigitTicks: number[]; analysis: DigitPatternAssistantInsightOutput | null }) {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'U', count: 0 });
  const [percentages, setPercentages] = React.useState({ over: 0, under: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);

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

        <AnimatePresence>
            {analysis?.overUnder && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                >
                    <AnalysisCard 
                        title="AI Prediction: Over / Under"
                        prediction={analysis.overUnder.prediction}
                        confidence={analysis.overUnder.confidence}
                        analysis={analysis.overUnder.analysis}
                    />
                </motion.div>
            )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
}
