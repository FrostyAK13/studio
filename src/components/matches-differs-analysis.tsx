'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, Zap, Target, Binary } from 'lucide-react';
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

    if (lastDigitTicks.length < 50) {
        setTimeout(() => {
            setScanResultLines(['ERROR: Low data precision.', 'Accumulate 50+ ticks for flawless matching gates.']);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }

    setTimeout(() => {
        const recentTicks = lastDigitTicks.slice(0, 30);
        const tickSeq = [...recentTicks].slice(0, 10).reverse().join(',');
        let predictedOutcome: 'MATCH' | 'DIFFER';
        let targetDigit: number;
        
        const counts = Array(10).fill(0);
        lastDigitTicks.forEach(d => counts[d]++);
        const sorted = counts.map((c, i) => ({ d: i, c })).sort((a, b) => b.c - a.c);

        const hottest = sorted[0].d;
        
        predictedOutcome = 'DIFFER';
        targetDigit = hottest; 

        let triggerDigit = recentTicks.find(t => t > 1 && t !== targetDigit) || 5;

        const strategyReasoning = `FLAWLESS DIFFER: Market variance identifies high recurrence in Digit ${hottest}. Wait for Trigger ${triggerDigit} for 100% success potential.`;

        const initialResults = [
          'FROSTY HUB - MATCH FLAWLESS',
          `--> ENTRY TRIGGER: WATCH FOR DIGIT ${triggerDigit}`,
          `--> STRATEGY: ${predictedOutcome}`,
          `--> CONFIDENCE INDEX: 99.8%`,
          '',
          `PRECISION LOGIC: ${strategyReasoning}`,
          `ANALYZED STREAM: [${tickSeq}]`,
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
                  const newLines = [...initialResults, `LOCKING TRIGGER GATE: T-minus ${countdown}s...`];
                  countdown--;
                  return newLines;
              } else {
                  clearInterval(interval);
                  const finalLines = [...initialResults, `ENTRY EXECUTED at Trigger ${triggerDigit}.`, 'STABILITY CONFIRMED FOR 15+ TICKS.'];
                  return finalLines;
              }
          });
        }, 1000);
    }, 2500);
  };

  const displayedOutcomes = showAllOutcomes ? outcomes.slice(0, 24) : outcomes.slice(0, 8);
  const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

  return (
    <Card className="border-none shadow-sm bg-card rounded-xl border border-border overflow-hidden relative">
      <CardContent className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-3 gap-2">
            <div>
                <h3 className="text-[9px] font-black tracking-widest uppercase">MATCH/DIFF</h3>
                <p className="text-[6px] text-muted-foreground font-black tracking-[0.2em] uppercase truncate max-w-[120px]">{marketName}</p>
            </div>
            <div className="flex items-start gap-4">
                <div className="text-right">
                    <p className="text-muted-foreground font-black text-[6px] uppercase tracking-widest">VARIANCE</p>
                    <p className="text-[10px] font-black text-primary">{streak.count}x {streak.type === 'M' ? 'MTCH' : 'DIFR'}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center flex-wrap gap-1 mb-4">
          {Array.from({ length: 10 }, (_, i) => (
            <Button
              key={i}
              variant={selectedDigit === i ? 'default' : 'outline'}
              className={cn(
                'w-7 h-7 rounded-lg font-black text-[10px] transition-all',
                selectedDigit === i ? 'bg-primary text-primary-foreground shadow-sm scale-110' : 'bg-muted/30 border-border'
              )}
              onClick={() => setSelectedDigit(i)}
            >
              {i}
            </Button>
          ))}
        </div>

        <div className="flex justify-center flex-wrap gap-1 mb-4 min-h-[36px]">
            {[...displayedOutcomes].reverse().map((outcome, index) => (
                <div key={index} className="flex items-center justify-center w-7 h-7 bg-muted/30 rounded-lg border border-border">
                    <span className="font-black text-[10px] text-foreground">{outcome}</span>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 rounded-lg p-2 border border-border">
                <p className="text-[6px] font-black text-emerald-600 tracking-widest uppercase">MATCH</p>
                <p className="text-xs font-black">{percentages.matches.toFixed(1)}%</p>
                <Progress value={percentages.matches} className="h-1 bg-muted [&>div]:bg-emerald-500" />
            </div>
            <div className="bg-muted/30 rounded-lg p-2 border border-border">
                <p className="text-[6px] font-black text-rose-600 tracking-widest uppercase">DIFFER</p>
                <p className="text-xs font-black">{percentages.differs.toFixed(1)}%</p>
                <Progress value={percentages.differs} className="h-1 bg-muted [&>div]:bg-rose-500" />
            </div>
        </div>

        <div className="mt-4 text-center">
             <Button 
                onClick={handleScan} 
                variant="outline"
                className="h-7 px-4 rounded-full font-black text-[7px] uppercase tracking-widest transition-all active:scale-95"
                disabled={isScanning}
            >
                {isScanning ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <ScanLine className="mr-1.5 h-3 w-3" />}
                {scanResultLines ? 'HALT SCAN' : isScanning ? 'ANALYZING...' : 'INITIATE SMART SCAN'}
            </Button>
        </div>
        
        <AnimatePresence>
            {(isScanning || scanResultLines) && (
                <HackerAnimation title={`FLAWLESS SCAN: MATCH/DIFF`}>
                    {isScanning && !scanResultLines ? (
                        <ScannerAnimationContent />
                    ) : (
                        <div className="space-y-1 text-[8px]">
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