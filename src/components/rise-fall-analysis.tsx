'use client';

import * as React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ScanLine, Loader2, TrendingUp, TrendingDown, Gauge } from 'lucide-react';
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

    if (priceHistory.length < 30) {
        setTimeout(() => {
            setScanResultLines(['ERROR: Insufficient price history.', 'Minimum 30 price points required for momentum profiling.']);
            setIsScanning(false);
            setTimeout(() => setScanResultLines(null), 3000);
        }, 1000);
        return;
    }

    setTimeout(() => {
        let predictedOutcome: 'RISE' | 'FALL';
        let reasoning: string;

        const recentPrices = priceHistory.slice(0, 10);
        const roc = ((recentPrices[0] - recentPrices[9]) / (recentPrices[9] || 1)) * 100;
        
        const ema3 = (recentPrices[0] + recentPrices[1] + recentPrices[2]) / 3;
        const ema10 = recentPrices.reduce((a, b) => a + b, 0) / 10;

        if (streak.count >= 6) {
            predictedOutcome = streak.type === 'R' ? 'FALL' : 'RISE';
            reasoning = `EXHAUSTION DETECTED: Asset identifies ${streak.count}x consecutive ${streak.type === 'R' ? 'Rises' : 'Falls'}. High probability trend correction at current pivot.`;
        } else if (roc > 0.05 && ema3 > ema10) {
            predictedOutcome = 'RISE';
            reasoning = `MOMENTUM ACCELERATION: Price identifies bullish ROC [${roc.toFixed(4)}%] and EMA-3 crossover. Trend following is prioritized.`;
        } else if (roc < -0.05 && ema3 < ema10) {
            predictedOutcome = 'FALL';
            reasoning = `MOMENTUM DECELERATION: Bearish ROC [${roc.toFixed(4)}%] identified with sustained downward pressure. Entering Fall vector.`;
        } else {
            predictedOutcome = percentages.rise > percentages.fall ? 'FALL' : 'RISE';
            reasoning = `RANGE MEAN REVERSION: Market identifying sideways oscillation. Targeting corrective vector based on global density variance.`;
        }

        const initialResults = [
          'MOMENTUM HUB V8.1 - ACTIVE',
          `--> ENTRY SIGNAL: ${predictedOutcome}`,
          `--> ROC INDEX: ${roc.toFixed(4)}%`,
          `--> TREND SKEW: ${percentages.rise.toFixed(1)}% BULL / ${percentages.fall.toFixed(1)}% BEAR`,
          '',
          `TECHNICAL REASONING: ${reasoning}`,
          `LIVE PRICE PIVOT: ${price.toFixed(decimalPlaces)}`,
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
                  const newLines = [...initialResults, `BUFFERING ENTRY: T-minus ${countdown}s...`];
                  countdown--;
                  return newLines;
              } else {
                  clearInterval(interval);
                  const finalLines = [...initialResults, `SIGNAL ACTIVE: Auto-entry confirmed.`, 'MONITORING FOR ACCELERATION ANOMALIES...'];
                  return finalLines;
              }
          });
        }, 1000);
    }, 2500);
  };
  
  const chartData = React.useMemo(() => {
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
        <div className="rounded-lg border bg-background p-2 text-xs shadow-sm">
            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                    <span className="text-[0.60rem] uppercase text-muted-foreground">
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
    <Card className="border-none shadow-xl bg-card/60 backdrop-blur-md overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary to-rose-500" />
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-4 gap-2">
            <div>
                <h3 className="text-xs sm:text-lg font-black tracking-tight uppercase">RISE/FALL</h3>
                <p className="text-[7px] sm:text-[10px] text-muted-foreground font-bold tracking-widest uppercase truncate max-w-[120px] sm:max-w-none">{marketName}</p>
            </div>
            <div className="flex items-start gap-3 sm:gap-8">
                <div className="text-right">
                    <p className="text-muted-foreground font-bold text-[7px] sm:text-[10px] uppercase tracking-widest">
                        TREND STREAK
                    </p>
                    <p className="text-xs sm:text-xl font-black text-primary">{streak.count}x {streak.type === 'R' ? 'RISE' : 'FALL'}</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">PRICE</p>
                    <p className="text-xl font-black text-primary">{price.toFixed(decimalPlaces)}</p>
                </div>
            </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-white/5 bg-black/40 p-2 mb-6">
             <SimplePriceChart data={chartData.slice(-100)} />
        </div>

        {variant === 'default' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-6">
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-0 text-white shadow-xl">
                        <CardContent className="p-3 sm:p-4">
                            <p className="text-[7px] sm:text-xs text-emerald-100/80 flex items-center gap-1 font-black uppercase tracking-widest"><TrendingUp size={12} /> RISE DENSITY</p>
                            <p className="text-lg sm:text-3xl font-black my-1 sm:my-2">{percentages.rise.toFixed(1)}%</p>
                            <Progress value={percentages.rise} className="h-1 sm:h-2 bg-white/20 [&>div]:bg-white" />
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-rose-500 to-rose-700 border-0 text-white shadow-xl">
                        <CardContent className="p-3 sm:p-4">
                            <p className="text-[7px] sm:text-xs text-rose-100/80 flex items-center gap-1 font-black uppercase tracking-widest"><TrendingDown size={12} /> FALL DENSITY</p>
                            <p className="text-lg sm:text-3xl font-black my-1 sm:my-2">{percentages.fall.toFixed(1)}%</p>
                            <Progress value={percentages.fall} className="h-1 sm:h-2 bg-white/20 [&>div]:bg-white" />
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-6 sm:mt-8 text-center">
                    <Button 
                        onClick={handleScan} 
                        className={cn(
                            "h-10 sm:h-14 px-6 sm:px-10 rounded-full font-black text-[8px] sm:text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95",
                            scanResultLines ? "bg-rose-500 hover:bg-rose-600" : "bg-primary hover:bg-primary/90"
                        )}
                        disabled={isScanning}
                    >
                        {isScanning && !scanResultLines ? (
                            <Loader2 className="mr-2 sm:mr-3 h-3 w-3 sm:h-5 sm:w-5 animate-spin" />
                        ) : (
                            <ScanLine className="mr-2 sm:mr-3 h-3 w-3 sm:h-5 sm:w-5" />
                        )}
                        {scanResultLines ? 'HALT SCAN' : isScanning ? 'ANALYZING...' : 'INITIATE SMART SCAN'}
                    </Button>
                </div>
                
                <AnimatePresence>
                    {(isScanning || scanResultLines) && (
                        <HackerAnimation title={`MOMENTUM SCAN: ${marketName.toUpperCase()}`}>
                            {isScanning && !scanResultLines ? (
                                <ScannerAnimationContent />
                            ) : (
                                <div className="space-y-1 sm:space-y-1.5 text-[8px] sm:text-sm">
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
            </>
        )}

        {variant === 'compact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 sm:gap-6 mt-6">
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <div className="flex justify-between mb-1 sm:mb-2 text-[8px] sm:text-xs font-black uppercase tracking-widest">
                            <span className="text-emerald-400">RISE MOMENTUM</span>
                            <span className="text-muted-foreground">{percentages.rise.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentages.rise} className="h-1 sm:h-2.5 bg-white/5 [&>div]:bg-emerald-500" />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1 sm:mb-2 text-[8px] sm:text-xs font-black uppercase tracking-widest">
                            <span className="text-rose-500">FALL MOMENTUM</span>
                            <span className="text-muted-foreground">{percentages.fall.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentages.fall} className="h-1 sm:h-2.5 bg-white/5 [&>div]:bg-rose-500" />
                    </div>
                </div>
                <ChartContainer config={{}} className="h-24 sm:h-40 w-24 sm:w-40 mx-auto aspect-square">
                    <PieChart>
                        <Tooltip content={<MiniChartTooltip />} />
                        <Pie 
                          data={riseFallPieData} 
                          dataKey="value" 
                          nameKey="name" 
                          innerRadius={25} 
                          outerRadius={40} 
                          paddingAngle={2}
                          stroke="none"
                        >
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
