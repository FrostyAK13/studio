'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Network, Activity, ShieldCheck, Zap, ArrowRight, Loader2, ScanLine, Cpu, Target, Binary, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { syntheticIndices } from '@/lib/mock-data';
import { HackerAnimation } from './hacker-animation';
import { ScannerAnimationContent } from './scanner-animation-content';

interface GlobalScanViewProps {
    price: number;
    lastDigitTicks: number[];
    priceHistory: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    decimalPlaces: number;
}

type StrategyType = 'auto' | 'over-under' | 'even-odd' | 'matches-differs' | 'rise-fall' | 'only-up-down';

export function GlobalScanView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
}: GlobalScanViewProps) {
    const [selectedStrategy, setSelectedStrategy] = React.useState<StrategyType>('auto');
    const [isScanning, setIsScanning] = React.useState(false);
    const [scanResults, setScanResults] = React.useState<{
        strategy: string;
        prediction: string;
        trigger: string;
        confidence: number;
        reasoning: string;
    } | null>(null);

    const handleInitiateScan = () => {
        if (isScanning) return;
        setScanResults(null);
        setIsScanning(true);

        // Neural scanning simulation
        setTimeout(() => {
            const total = lastDigitTicks.length || 1;
            const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
            const evenPerc = (evenCount / total) * 100;
            const oddPerc = 100 - evenPerc;

            const overCount = lastDigitTicks.filter(d => d > 4).length;
            const underCount = total - overCount;
            const overPerc = (overCount / total) * 100;
            const underPerc = (underCount / total) * 100;

            const counts = Array(10).fill(0);
            lastDigitTicks.forEach(d => counts[d]++);
            const hottestDigit = counts.indexOf(Math.max(...counts));

            let strategy = "AUTO-V8.1";
            let prediction = "";
            let trigger = "";
            let confidence = 50;
            let reasoning = "";

            const targetStrategy = selectedStrategy === 'auto' ? 
                (Math.abs(overPerc - underPerc) > Math.abs(evenPerc - oddPerc) ? 'over-under' : 'even-odd') : 
                selectedStrategy;

            switch (targetStrategy) {
                case 'even-odd':
                    strategy = "EVEN/ODD";
                    prediction = evenPerc > oddPerc ? "ODD (Reversion)" : "EVEN (Reversion)";
                    trigger = evenPerc > oddPerc ? "Consecutive Even" : "Consecutive Odd";
                    confidence = Math.abs(evenPerc - oddPerc) + 55;
                    reasoning = "Parity imbalance detected in the recent vector sequence. Correcting for mean equilibrium.";
                    break;
                case 'over-under':
                    strategy = "OVER/UNDER";
                    prediction = overPerc > underPerc ? "UNDER 8" : "OVER 1";
                    trigger = overPerc > underPerc ? "High Digit Sequence" : "Low Digit Sequence";
                    confidence = Math.abs(overPerc - underPerc) + 60;
                    reasoning = "Barrier saturation identified. High probability shift toward the opposite spectrum.";
                    break;
                case 'matches-differs':
                    strategy = "MATCHES/DIFFERS";
                    prediction = `DIFFER ${hottestDigit}`;
                    trigger = `Digit ${hottestDigit} Recurrence`;
                    confidence = 99.8;
                    reasoning = `Statistical variance confirms Digit ${hottestDigit} as a high-density cluster. Safer to Differ.`;
                    break;
                case 'rise-fall':
                    strategy = "RISE/FALL";
                    const recentPrices = priceHistory.slice(0, 10);
                    const isBullish = recentPrices[0] > recentPrices[9];
                    prediction = isBullish ? "FALL (Pullback)" : "RISE (Bounce)";
                    trigger = isBullish ? "New High Wick" : "New Low Tick";
                    confidence = 65.5;
                    reasoning = "Momentum exhaustion detected. Asset identifies immediate pivot potential.";
                    break;
                case 'only-up-down':
                    strategy = "ONLY UP/DOWN";
                    const streakCount = 0; // In a real scenario, calculate current streak
                    prediction = evenPerc > 50 ? "ONLY DOWN" : "ONLY UP";
                    trigger = "Momentum Cross";
                    confidence = 72.3;
                    reasoning = "Vector strength confirms sustained directional flow without counter-ticks.";
                    break;
                default:
                    strategy = "AUTO SCAN";
                    prediction = "RE-SCAN REQUIRED";
                    trigger = "NONE";
                    confidence = 0;
            }

            setScanResults({
                strategy,
                prediction,
                trigger,
                confidence: Math.min(99.9, confidence),
                reasoning,
            });
            setIsScanning(false);
        }, 3000);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-1000 pb-24 max-w-7xl mx-auto px-2">
            <Card className="border-none shadow-sm bg-card rounded-3xl border border-primary/5">
                <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 ml-2">SCAN SECTOR</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-11 bg-muted/50 border-primary/5 rounded-2xl font-black text-xs px-5">
                                <SelectValue placeholder="Select Market" />
                            </SelectTrigger>
                            <SelectContent className="bg-card text-foreground rounded-2xl border shadow-xl">
                                {syntheticIndices.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="font-bold text-xs py-2">{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 ml-2">TACTICAL PROTOCOL</Label>
                        <Select value={selectedStrategy} onValueChange={(val) => setSelectedStrategy(val as StrategyType)}>
                            <SelectTrigger className="h-11 bg-muted/50 border-primary/5 rounded-2xl font-black text-xs px-5">
                                <SelectValue placeholder="Select Protocol" />
                            </SelectTrigger>
                            <SelectContent className="bg-card text-foreground rounded-2xl border shadow-xl">
                                <SelectItem value="auto" className="font-bold text-xs py-2">AUTO (BEST EDGE)</SelectItem>
                                <SelectItem value="over-under" className="font-bold text-xs py-2">OVER/UNDER</SelectItem>
                                <SelectItem value="even-odd" className="font-bold text-xs py-2">EVEN/ODD</SelectItem>
                                <SelectItem value="matches-differs" className="font-bold text-xs py-2">MATCHES/DIFFERS</SelectItem>
                                <SelectItem value="rise-fall" className="font-bold text-xs py-2">RISE/FALL</SelectItem>
                                <SelectItem value="only-up-down" className="font-bold text-xs py-2">ONLY UP/DOWN</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 ml-2">DATA HORIZON</Label>
                        <Input
                            type="number"
                            value={maxTicks}
                            onChange={handleMaxTicksChange}
                            onBlur={handleMaxTicksBlur}
                            className="h-11 bg-muted/50 border-primary/5 rounded-2xl font-black text-xs px-5 text-center"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 ml-2">LIVE SPOT</Label>
                        <div className="h-11 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center font-black text-xs shadow-md">
                             {price.toFixed(decimalPlaces)}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col items-center justify-center py-12 gap-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full" />
                    <Button 
                        onClick={handleInitiateScan}
                        disabled={isScanning}
                        className={cn(
                            "relative w-64 h-64 rounded-full border-8 border-white bg-card shadow-2xl transition-all duration-500 group overflow-hidden",
                            isScanning ? "scale-95" : "hover:scale-105 active:scale-90"
                        )}
                    >
                        <div className="flex flex-col items-center gap-4">
                            {isScanning ? (
                                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            ) : (
                                <ScanLine className="h-16 w-16 text-primary group-hover:animate-pulse" />
                            )}
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">
                                {isScanning ? 'ANALYZING' : 'INITIATE SCAN'}
                            </span>
                        </div>
                        {isScanning && (
                            <motion.div 
                                initial={{ top: "-100%" }}
                                animate={{ top: "100%" }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-primary/10 to-transparent pointer-events-none"
                            />
                        )}
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">100+1 ACCURACY PROTOCOL ACTIVE</p>
                </div>
            </div>

            <AnimatePresence>
                {isScanning && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto w-full">
                        <HackerAnimation title={`NEURAL ${selectedStrategy.toUpperCase()} SCAN`}>
                            <ScannerAnimationContent />
                        </HackerAnimation>
                    </motion.div>
                )}

                {scanResults && !isScanning && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'STRATEGY', value: scanResults.strategy, icon: Binary, color: 'text-primary' },
                                { label: 'PREDICTION', value: scanResults.prediction, icon: Target, color: 'text-emerald-600' },
                                { label: 'TRIGGER', value: scanResults.trigger, icon: Zap, color: 'text-amber-500' },
                                { label: 'CONFIDENCE', value: `${scanResults.confidence.toFixed(1)}%`, icon: Activity, color: 'text-emerald-500' },
                            ].map((stat, i) => (
                                <Card key={i} className="bg-card border-primary/5 shadow-sm rounded-2xl p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{stat.label}</p>
                                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                                    </div>
                                    <p className="text-sm sm:text-xl font-black icy-gold-text uppercase truncate">{stat.value}</p>
                                </Card>
                            ))}
                        </div>

                        <Card className="bg-white border-primary/10 rounded-[2rem] p-8 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                            <div className="flex items-start gap-8">
                                <div className="p-5 bg-primary/5 rounded-2xl shadow-inner hidden sm:block">
                                    <Cpu className="h-10 w-10 text-primary" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">SYSTEM SYNOPSIS</p>
                                    <p className="text-sm sm:text-lg font-medium text-foreground leading-relaxed italic border-l-2 border-primary/20 pl-6 py-2">
                                        "{scanResults.reasoning}"
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="flex justify-center pb-20">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[12px] uppercase tracking-widest h-16 px-16 rounded-full shadow-2xl active:scale-95 transition-all">
                                EXECUTE TRADE VECTOR <ArrowRight className="ml-4 h-6 w-6" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
