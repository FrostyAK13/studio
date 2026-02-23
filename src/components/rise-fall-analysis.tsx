'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { syntheticIndices } from '@/lib/mock-data';
import { ScannerAnimationContent } from './scanner-animation-content';
import { RiseFallChart } from './rise-fall-chart';

type Outcome = 'R' | 'F' | 'E';

interface RiseFallAnalysisProps {
  lastDigitTicks: number[];
  selectedMarket: string;
  price: number;
  decimalPlaces: number;
}

export function RiseFallAnalysis({ lastDigitTicks, selectedMarket, price, decimalPlaces }: RiseFallAnalysisProps) {
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: 'R' | 'F'; count: number }>({ type: 'R', count: 0 });
  const [percentages, setPercentages] = React.useState({ rise: 0, fall: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResultLines, setScanResultLines] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (lastDigitTicks.length < 2) {
        setOutcomes([]);
        setStreak({ type: 'R', count: 0 });
        setPercentages({ rise: 0, fall: 0 });
        return;
    }
    
    const newOutcomes: Outcome[] = [];
    for (let i = 0; i < lastDigitTicks.length - 1; i++) {
        const currentDigit = lastDigitTicks[i];
        const prevDigit = lastDigitTicks[i+1];
        if(currentDigit > prevDigit) newOutcomes.push('R');
        else if (currentDigit < prevDigit) newOutcomes.push('F');
        else newOutcomes.push('E');
    }

    setOutcomes(newOutcomes);
    
    const riseFallOutcomes = newOutcomes.filter(o => o !== 'E') as ('R' | 'F')[];

    if(riseFallOutcomes.length > 0) {
        let currentStreak = { type: riseFallOutcomes[0], count: 0 };
        for (const outcome of riseFallOutcomes) {
          if (outcome === currentStreak.type) {
            currentStreak.count++;
          } else {
            break;
          }
        }
        setStreak(currentStreak);
    
        const riseCount = riseFallOutcomes.filter(o => o === 'R').length;
        const fallCount = riseFallOutcomes.filter(o => o === 'F').length;
        setPercentages({
          rise: riseFallOutcomes.length > 0 ? (riseCount / riseFallOutcomes.length) * 100 : 0,
          fall: riseFallOutcomes.length > 0 ? (fallCount / riseFallOutcomes.length) * 100 : 0,
        });
    } else {
        setStreak({ type: 'R', count: 0 });
        setPercentages({ rise: 0, fall: 0 });
    }
  }, [lastDigitTicks]);

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
        let predictedOutcome: 'RISE' | 'FALL';
        let reasoning: string;

        const riseThreshold = 60;
        const fallThreshold = 60;
        const streakThreshold = 4;

        if (percentages.rise > riseThreshold) {
            predictedOutcome = 'RISE';
            reasoning = `High 'Rise' probability detected (${percentages.rise.toFixed(1)}%).`;
        } else if (percentages.fall > fallThreshold) {
            predictedOutcome = 'FALL';
            reasoning = `High 'Fall' probability detected (${percentages.fall.toFixed(1)}%).`;
        } else if (streak.count >= streakThreshold) {
            if (streak.type === 'R') {
                predictedOutcome = 'FALL';
                reasoning = `A long streak of 'Rise' (${streak.count}x) suggests a potential reversal to Fall.`;
            } else { // streak.type === 'F'
                predictedOutcome = 'RISE';
                reasoning = `A long streak of 'Fall' (${streak.count}x) suggests a potential reversal to Rise.`;
            }
        } else {
            if (percentages.rise >= percentages.fall) {
                predictedOutcome = 'RISE';
                reasoning = 'No strong signal found. Defaulting to Rise based on general tendency.';
            } else {
                predictedOutcome = 'FALL';
                reasoning = 'No strong signal found. Defaulting to Fall based on general tendency.';
            }
        }
        
        const initialResults = [
            'Analysis Complete!',
            `--> Prediction: ${predictedOutcome}`,
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
                <h3 className="text-lg font-semibold">Rise/Fall Analysis</h3>
                <p className="text-sm text-muted-foreground -mt-1">{marketName}</p>
            </div>
            <div className="flex items-start gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-medium text-sm">
                        Current Streak: <br/> {streak.count}x {streak.type === 'R' ? 'Rise' : 'Fall'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">PRICE</p>
                    <p className="text-2xl font-bold text-primary">{price.toFixed(decimalPlaces)}</p>
                </div>
            </div>
        </div>

        <RiseFallChart lastDigitTicks={lastDigitTicks} />

        <div className="flex justify-center flex-wrap gap-2 my-6 min-h-[56px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className={cn("flex items-center justify-center w-12 h-12 rounded-lg shadow-inner",
                  outcome === 'R' ? 'bg-green-100 border border-green-200' : outcome === 'F' ? 'bg-red-100 border border-red-200' : 'bg-slate-100 border border-slate-200'
                )}>
                    {outcome === 'R' ? <TrendingUp className="h-6 w-6 text-green-600" /> : outcome === 'F' ? <TrendingDown className="h-6 w-6 text-red-600" /> : <Minus className="h-6 w-6 text-slate-600" />}
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
            <Card className="bg-gradient-to-br from-green-400 to-emerald-500 border-0 text-white">
                <CardContent className="p-4">
                    <p className="text-sm text-emerald-100/80">RISE</p>
                    <p className="text-3xl font-bold my-2">{percentages.rise.toFixed(1)}%</p>
                    <Progress value={percentages.rise} className="h-2 bg-white/20 [&>div]:bg-white" />
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-400 to-rose-500 border-0 text-white">
                 <CardContent className="p-4">
                    <p className="text-sm text-rose-100/80">FALL</p>
                    <p className="text-3xl font-bold my-2">{percentages.fall.toFixed(1)}%</p>
                    <Progress value={percentages.fall} className="h-2 bg-white/20 [&>div]:bg-white" />
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
                 <HackerAnimation title={`Analysis Dashboard - Rise/Fall on ${marketName}`}>
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
