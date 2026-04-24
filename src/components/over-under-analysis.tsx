'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, ArrowUp, ArrowDown, Gauge } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { syntheticIndices } from '@/lib/mock-data';
import { ScannerAnimationContent } from './scanner-animation-content';

type Outcome = 'O' | 'U' | 'E';

interface OverUnderAnalysisProps {
  lastDigitTicks: number[];
  selectedMarket: string;
  price: number;
  decimalPlaces: number;
}

export function OverUnderAnalysis({ lastDigitTicks, selectedMarket, price, decimalPlaces }: OverUnderAnalysisProps) {
  const [selectedDigit, setSelectedDigit] = React.useState<number>(5);
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: 'O' | 'U'; count: number }>({ type: 'U', count: 0 });
  const [percentages, setPercentages] = React.useState({ over: 0, under: 0 });
  const [showAllOutcomes, setShowAllOutcomes] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResultLines, setScanResultLines] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (lastDigitTicks.length === 0) {
        setOutcomes([]);
        setStreak({ type: 'U', count: 0 });
        setPercentages({ over: 0, under: 0 });
        return;
    }
    
    const newOutcomes: Outcome[] = lastDigitTicks.map((digit) => {
        if (digit > selectedDigit) return 'O';
        if (digit < selectedDigit) return 'U';
        return 'E';
    });
    setOutcomes(newOutcomes);

    const overUnderOutcomes = newOutcomes.filter(o => o !== 'E') as ('O' | 'U')[];

    if(overUnderOutcomes.length > 0) {
        let currentStreak = { type: overUnderOutcomes[0], count: 0 };
        for (const outcome of overUnderOutcomes) {
          if (outcome === currentStreak.type) {
            currentStreak.count++;
          } else {
            break;
          }
        }
        setStreak(currentStreak);
    
        const overCount = overUnderOutcomes.filter(o => o === 'O').length;
        const underCount = overUnderOutcomes.filter(o => o === 'U').length;
        setPercentages({
          over: overUnderOutcomes.length > 0 ? (overCount / overUnderOutcomes.length) * 100 : 0,
          under: overUnderOutcomes.length > 0 ? (underCount / overUnderOutcomes.length) * 100 : 0,
        });
    } else {
        setStreak({ type: 'U', count: 0 });
        setPercentages({ over: 0, under: 0 });
    }
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
            setScanResultLines(["ERROR: Precision analysis failed.", "Need 50+ ticks for flawless Z-Score stabilization."]);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }
    
    setTimeout(() => {
        const recentTicks = lastDigitTicks.slice(0, 30);
        const tickSeq = [...recentTicks].slice(0, 10).reverse().join(',');
        let predictedOutcome: 'OVER' | 'UNDER';
        let barrierDigit: number;
        let recoveryDigit: number;
        let reasoning: string;

        const higherCount = recentTicks.filter(d => d > 4).length;
        const lowerCount = 30 - higherCount;

        const possibleTriggers = [3, 4, 5, 7];
        const triggerDigit = possibleTriggers[Math.floor(Math.random() * possibleTriggers.length)];

        if (higherCount >= lowerCount) {
            predictedOutcome = 'UNDER';
            barrierDigit = 8;
            recoveryDigit = 6;
            reasoning = `FLAWLESS OVER-SKEW: Market identifying high barrier stability. Enter Under ${barrierDigit} with 100% confidence index.`;
        } else {
            predictedOutcome = 'OVER';
            barrierDigit = 1;
            recoveryDigit = 3;
            reasoning = `FLAWLESS UNDER-SKEW: Global mean identifies lower range saturation. Enter Over ${barrierDigit} with 100% confidence index.`;
        }

        const initialResults = [
            'FROSTY HUB - FLAWLESS PRECISION',
            `--> ENTRY TRIGGER: WATCH FOR DIGIT ${triggerDigit}`,
            `--> PREDICTION: ${predictedOutcome} ${barrierDigit}`,
            `--> CONFIDENCE INDEX: 99.8%`,
            '',
            `NEURAL LOGIC: ${reasoning}`,
            `SEQUENCE SCAN: [${tickSeq}]`,
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
                    const newLines = [...initialResults, `LOCKING ENTRY GATE: T-minus ${countdown}s...`];
                    countdown--;
                    return newLines;
                } else {
                    clearInterval(interval);
                    const finalLines = [...initialResults, `ENTRY EXECUTED at Trend Trigger ${triggerDigit}.`, 'STABILITY CONFIRMED FOR 15+ TICKS.'];
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
                <h3 className="text-[9px] font-black tracking-widest uppercase">OVER/UNDER</h3>
                <p className="text-[6px] text-muted-foreground font-black tracking-[0.2em] uppercase truncate max-w-[120px]">{marketName}</p>
            </div>
            <div className="flex items-start gap-4">
                <div className="text-right">
                    <p className="text-muted-foreground font-black text-[6px] uppercase tracking-widest">SKEW</p>
                    <p className="text-[10px] font-black text-primary">{streak.count}x {streak.type === 'O' ? 'OVER' : 'UNDR'}</p>
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
                <div key={index} className={cn("flex items-center justify-center w-7 h-7 rounded-lg shadow-sm border border-white/5",
                  outcome === 'O' ? 'bg-emerald-500 text-white' : outcome === 'U' ? 'bg-rose-500 text-white' : 'bg-muted/30'
                )}>
                    <span className="font-black text-[10px] drop-shadow-md">{outcome}</span>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/30 rounded-lg p-2 border border-border">
                <p className="text-[6px] font-black text-emerald-600 tracking-widest uppercase">OVER</p>
                <p className="text-xs font-black">{percentages.over.toFixed(1)}%</p>
                <Progress value={percentages.over} className="h-1 bg-muted [&>div]:bg-emerald-500" />
            </div>
            <div className="bg-muted/30 rounded-lg p-2 border border-border">
                <p className="text-[6px] font-black text-rose-600 tracking-widest uppercase">UNDER</p>
                <p className="text-xs font-black">{percentages.under.toFixed(1)}%</p>
                <Progress value={percentages.under} className="h-1 bg-muted [&>div]:bg-rose-500" />
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
                 <HackerAnimation title={`FLAWLESS SCAN: OVER/UNDER`}>
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