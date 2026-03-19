'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, Zap, Target } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { syntheticIndices } from '@/lib/mock-data';
import { ScannerAnimationContent } from './scanner-animation-content';

type Outcome = 'M' | 'D';

interface MatchesDiffersAnalysisProps {
    lastDigitTicks: number[];
    selectedMarket: string;
    price: number;
    decimalPlaces: number;
}

export function MatchesDiffersAnalysis({ lastDigitTicks, selectedMarket, price, decimalPlaces }: MatchesDiffersAnalysisProps) {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: Outcome; count: number }>({ type: 'D', count: 0 });
  const [percentages, setPercentages] = React.useState({ matches: 0, differs: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResultLines, setScanResultLines] = React.useState<string[] | null>(null);

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
    if (isScanning) return;

    if (scanResultLines) {
      setScanResultLines(null);
      return;
    }
    
    setIsScanning(true);

    if (lastDigitTicks.length < 25) {
        setTimeout(() => {
            setScanResultLines(['ERROR: Data sample insufficient.', 'Need minimum 25 ticks to calculate variance accurately.']);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }

    setTimeout(() => {
        const recentTicks = lastDigitTicks.slice(0, 10);
        const tickSeq = [...recentTicks].reverse().join(',');
        let predictedOutcome: 'MATCH' | 'DIFFER';
        let targetDigits: number[] = [];
        let triggerDigit: number = recentTicks[0];
        let strategyReasoning = "";

        const digitCounts = Array(10).fill(0);
        lastDigitTicks.forEach(d => digitCounts[d]++);
        const digitPercentages = digitCounts.map(c => (c / lastDigitTicks.length) * 100);

        let hottestDigit = 0;
        let coldestDigit = 0;
        digitPercentages.forEach((p, i) => {
            if (p > digitPercentages[hottestDigit]) hottestDigit = i;
            if (p < digitPercentages[coldestDigit]) coldestDigit = i;
        });

        const recentRepetition = lastDigitTicks.slice(0, 8).filter(d => d === hottestDigit).length >= 2;

        if (recentRepetition && digitPercentages[hottestDigit] > 14) {
            predictedOutcome = 'MATCH';
            targetDigits = [hottestDigit];
            strategyReasoning = `PATTERN: Digit ${hottestDigit} appeared frequently in sequence [${tickSeq}]. Trigger ${triggerDigit} likely leads to repetition of ${hottestDigit}.`;
        } else {
            predictedOutcome = 'DIFFER';
            targetDigits = [coldestDigit];
            strategyReasoning = `VARIANCE: Digit ${coldestDigit} is highly cold in [${tickSeq}]. Using trigger ${triggerDigit} to enter Differ trade with high safety margin.`;
        }

        const initialResults = [
          'PATTERN RECOGNITION ENGINE - V4.0',
          `--> ENTRY TRIGGER: WAIT FOR DIGIT ${triggerDigit}`,
          `--> STRATEGY: ${predictedOutcome}`,
          `--> TARGET DIGIT: ${targetDigits[0]}`,
          '',
          `NUMERICAL REASONING: ${strategyReasoning}`,
          `ANALYZED FLOW: [${tickSeq}]`,
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
              }

              if (countdown >= 0) {
                  const newLines = [...initialResults, `BUFFERING ENTRY: T-minus ${countdown}s...`];
                  countdown--;
                  return newLines;
              } else {
                  clearInterval(interval);
                  const finalLines = [...initialResults, `ENTRY EXECUTED at Trigger ${triggerDigit}.`, 'MONITORING FOR REPETITION ANOMALIES...'];
                  return finalLines;
              }
          });
        }, 1000);
    }, 2500);
  };

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);
  const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

  return (
    <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-chart-2 to-blue-500" />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-black tracking-tight uppercase">MATCHES/DIFFERS SCANNER</h3>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{marketName}</p>
            </div>
            <div className="flex items-start gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-widest">VARIANCE STREAK</p>
                    <p className="text-xl font-black text-primary">{streak.count}x {streak.type === 'M' ? 'MTCH' : 'DIFR'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">LIVE PRICE</p>
                    <p className="text-xl font-black text-foreground">{price.toFixed(decimalPlaces)}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6">
          {Array.from({ length: 10 }, (_, i) => (
            <Button
              key={i}
              variant={selectedDigit === i ? 'default' : 'outline'}
              className={cn(
                'w-11 h-11 rounded-xl font-black text-base transition-all duration-300',
                selectedDigit === i 
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-110' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
              )}
              onClick={() => handleSelectDigit(i)}
            >
              {i}
            </Button>
          ))}
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-6 min-h-[56px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className="flex items-center justify-center w-12 h-12 bg-white/5 rounded-xl border border-white/10 shadow-inner">
                    <span className="font-black text-lg text-foreground">{outcome}</span>
                </div>
            ))}
        </div>

        {outcomes.length > 8 && (
            <div className="text-center mb-6">
                 <Button onClick={() => setShowAllOutcomes(prev => !prev)} variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest hover:bg-white/5">
                    {showAllOutcomes ? 'COLLAPSE DATA' : 'EXPAND HISTORY'}
                </Button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-chart-2/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black text-chart-2 tracking-widest">MATCHES RATIO</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-3xl font-black">{percentages.matches.toFixed(1)}%</p>
                    <div className="p-1.5 bg-chart-2/20 rounded-lg"><Zap className="h-4 w-4 text-chart-2" /></div>
                </div>
                <Progress value={percentages.matches} className="h-2.5 bg-white/5 [&>div]:bg-chart-2" />
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-chart-5/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black text-chart-5 tracking-widest">DIFFERS RATIO</p>
                <div className="flex items-end justify-between mt-1 mb-2">
                    <p className="text-3xl font-black">{percentages.differs.toFixed(1)}%</p>
                    <div className="p-1.5 bg-chart-5/20 rounded-lg"><Target className="h-4 w-4 text-chart-5" /></div>
                </div>
                <Progress value={percentages.differs} className="h-2.5 bg-white/5 [&>div]:bg-chart-5" />
            </div>
        </div>

        <div className="mt-8 text-center">
             <Button 
                onClick={handleScan} 
                className={cn(
                    "h-14 px-10 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                    scanResultLines ? "bg-rose-500 hover:bg-rose-600" : "bg-primary hover:bg-primary/90"
                )}
                disabled={isScanning}
            >
                {isScanning && !scanResultLines ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                    <ScanLine className="mr-3 h-5 w-5" />
                )}
                {scanResultLines ? 'STOP SCANNER' : isScanning ? 'ANALYZING...' : 'RUN SMART SCANNER'}
            </Button>
        </div>
        
        <AnimatePresence>
            {(isScanning || scanResultLines) && (
                <HackerAnimation title={`SYSTEM SCAN: MATCHES/DIFFERS ANALYTICS`}>
                    {isScanning && !scanResultLines ? (
                        <ScannerAnimationContent />
                    ) : (
                        <div className="space-y-1.5">
                            {scanResultLines?.map((line, index) => (
                                <p key={index} className={cn(
                                    line.startsWith('-->') ? "text-emerald-400 font-black" : "text-green-500/80"
                                )}>{line}</p>
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
