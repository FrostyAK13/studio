'use client';

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScanLine, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { HackerAnimation } from './hacker-animation';
import { syntheticIndices } from '@/lib/mock-data';
import { ScannerAnimationContent } from './scanner-animation-content';
import { SimplePriceChart } from './simple-price-chart';
import { PieChart, Pie, Tooltip, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

type Outcome = 'R' | 'F' | 'S'; // Rise, Fall, Same

interface RiseFallAnalysisProps {
  priceHistory: number[];
  selectedMarket: string;
  price: number;
  decimalPlaces: number;
  variant?: 'default' | 'compact';
}

export function RiseFallAnalysis({ 
    priceHistory, 
    selectedMarket, 
    price, 
    decimalPlaces, 
    variant = 'default' 
}: RiseFallAnalysisProps) {
  const [outcomes, setOutcomes] = React.useState<Outcome[]>([]);
  const [streak, setStreak] = React.useState<{ type: 'R' | 'F'; count: number }>({ type: 'R', count: 0 });
  const [percentages, setPercentages] = React.useState({ rise: 0, fall: 0 });
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResultLines, setScanResultLines] = React.useState<string[] | null>(null);

  React.useEffect(() => {
    if (priceHistory.length < 2) {
        setOutcomes([]);
        setStreak({ type: 'R', count: 0 });
        setPercentages({ rise: 0, fall: 0 });
        return;
    }
    
    // Newest prices are at the start of the array
    const newOutcomes: Outcome[] = [];
    for (let i = 0; i < priceHistory.length - 1; i++) {
        if (priceHistory[i] > priceHistory[i+1]) newOutcomes.push('R');
        else if (priceHistory[i] < priceHistory[i+1]) newOutcomes.push('F');
        else newOutcomes.push('S');
    }
    setOutcomes(newOutcomes);

    const riseFallOutcomes = newOutcomes.filter(o => o !== 'S') as ('R' | 'F')[];

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
  }, [priceHistory]);

  const handleScan = () => {
    if (isScanning) return;

    if (scanResultLines) {
      setScanResultLines(null);
      return;
    }
    
    setIsScanning(true);

    if (outcomes.length < 10) {
        setTimeout(() => {
            setScanResultLines(['Not enough data. Need at least 10 ticks.']);
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
        const streakThreshold = 5;

        if (percentages.rise > riseThreshold) {
            predictedOutcome = 'RISE';
            reasoning = `High 'Rise' probability detected (${percentages.rise.toFixed(1)}%).`;
        } else if (percentages.fall > fallThreshold) {
            predictedOutcome = 'FALL';
            reasoning = `High 'Fall' probability detected (${percentages.fall.toFixed(1)}%).`;
        } else if (streak.count >= streakThreshold) {
            if (streak.type === 'R') {
                predictedOutcome = 'FALL';
                reasoning = `A long streak of 'Rise' (${streak.count}x) suggests a potential reversal.`;
            } else { // streak.type === 'F'
                predictedOutcome = 'RISE';
                reasoning = `A long streak of 'Fall' (${streak.count}x) suggests a potential reversal.`;
            }
        } else {
            predictedOutcome = percentages.rise >= percentages.fall ? 'RISE' : 'FALL';
            reasoning = 'No strong signal. Defaulting to general tendency.';
        }

        const initialResults = [
          'Analysis Complete!',
          `--> Prediction: ${predictedOutcome}`,
          '',
          `Reasoning: ${reasoning}`,
          `Rise Probability: ${percentages.rise.toFixed(2)}%`,
          `Fall Probability: ${percentages.fall.toFixed(2)}%`,
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
  
  const chartData = React.useMemo(() => {
      // Reverse history so oldest is first for the chart
      return [...priceHistory].reverse().map(p => ({ price: p }));
  }, [priceHistory]);

  const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;
  
  const riseFallPieData = [
    { name: 'Rise', value: percentages.rise, fill: 'hsl(var(--accent))' },
    { name: 'Fall', value: percentages.fall, fill: 'hsl(var(--destructive))' },
  ];

  const MiniChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
        <div className="rounded-lg border bg-background p-2 text-sm shadow-sm">
            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                    {payload[0].name}
                    </span>
                    <span className="font-bold text-foreground">
                    {payload[0].value.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
        )
    }
    return null
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
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

        <SimplePriceChart data={chartData.slice(-100)} />

        {variant === 'default' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card className="bg-gradient-to-br from-accent to-green-400 border-0 text-white">
                        <CardContent className="p-4">
                            <p className="text-sm text-green-100/80 flex items-center gap-1"><TrendingUp size={16} /> RISE</p>
                            <p className="text-3xl font-bold my-2">{percentages.rise.toFixed(1)}%</p>
                            <Progress value={percentages.rise} className="h-2 bg-white/20 [&>div]:bg-white" />
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-destructive to-red-400 border-0 text-white">
                        <CardContent className="p-4">
                            <p className="text-sm text-red-100/80 flex items-center gap-1"><TrendingDown size={16} /> FALL</p>
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
            </>
        )}

        {variant === 'compact' && (
            <div className="grid grid-cols-2 items-center gap-4 mt-6">
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between mb-1 text-sm">
                            <span className="font-medium">Rise</span>
                            <span className="text-muted-foreground">{percentages.rise.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-accent h-full rounded-full" style={{ width: `${percentages.rise}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-1 text-sm">
                            <span className="font-medium">Fall</span>
                            <span className="text-muted-foreground">{percentages.fall.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-destructive h-full rounded-full" style={{ width: `${percentages.fall}%` }}></div>
                        </div>
                    </div>
                </div>
                <ChartContainer config={{}} className="h-40 w-40 mx-auto">
                    <PieChart>
                        <Tooltip content={<MiniChartTooltip />} />
                        <Pie data={riseFallPieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={2}>
                            {riseFallPieData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
