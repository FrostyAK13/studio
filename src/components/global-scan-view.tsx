'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Network, Activity, ShieldCheck, Zap, ArrowRight, Loader2, ScanLine, Cpu, Search, Binary, Target } from 'lucide-react';
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

        // Simulate deep neural scanning of all protocols
        setTimeout(() => {
            const counts = Array(10).fill(0);
            lastDigitTicks.forEach(d => counts[d]++);
            const total = lastDigitTicks.length || 1;
            const percentages = counts.map(c => (c / total) * 100);
            
            // Logic to find the best edge
            const evenCount = lastDigitTicks.filter(d => d % 2 === 0).length;
            const evenPerc = (evenCount / total) * 100;
            const oddPerc = 100 - evenPerc;

            let strategy = "EVEN/ODD";
            let prediction = evenPerc > oddPerc ? "ODD (Reversion)" : "EVEN (Reversion)";
            let trigger = evenPerc > oddPerc ? "Even Digit" : "Odd Digit";
            let confidence = Math.abs(evenPerc - oddPerc) + 50;

            // If Over/Under has a bigger edge
            const overCount = lastDigitTicks.filter(d => d > 5).length;
            const underCount = total - overCount;
            const overPerc = (overCount / total) * 100;
            const underPerc = (underCount / total) * 100;

            if (Math.abs(overPerc - underPerc) > Math.abs(evenPerc - oddPerc)) {
                strategy = "OVER/UNDER";
                prediction = overPerc > underPerc ? "UNDER 8" : "OVER 1";
                trigger = overPerc > underPerc ? "High Digit (7-9)" : "Low Digit (0-2)";
                confidence = Math.abs(overPerc - underPerc) + 55;
            }

            setScanResults({
                strategy,
                prediction,
                trigger,
                confidence: Math.min(99.8, confidence),
                reasoning: `Multi-vector analysis identified structural imbalance in ${strategy} territory. Reversion logic prioritized for 100+1 accuracy sequence.`,
            });
            setIsScanning(false);
        }, 3000);
    };

    const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            <Card className="border-none shadow-sm bg-card rounded-3xl border border-primary/5">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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

            <div className="flex flex-col items-center justify-center py-10 gap-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                    <Button 
                        onClick={handleInitiateScan}
                        disabled={isScanning}
                        className={cn(
                            "relative w-64 h-64 rounded-full border-8 border-background bg-card shadow-2xl transition-all duration-500 group overflow-hidden",
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
                                className="absolute left-0 w-full h-20 bg-gradient-to-b from-transparent via-primary/20 to-transparent pointer-events-none"
                            />
                        )}
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">100+1 ACCURACY PROTOCOL ACTIVE</p>
                </div>
            </div>

            <AnimatePresence>
                {isScanning && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto w-full">
                        <HackerAnimation title="NEURAL PROTOCOL SCAN">
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
                                <Card key={i} className="bg-card border-primary/5 shadow-sm rounded-2xl p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">{stat.label}</p>
                                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                                    </div>
                                    <p className="text-sm sm:text-lg font-black text-foreground uppercase truncate">{stat.value}</p>
                                </Card>
                            ))}
                        </div>

                        <Card className="bg-primary/5 border-primary/10 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-white rounded-2xl shadow-sm">
                                    <Cpu className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">SYSTEM SYNOPSIS</p>
                                    <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed italic border-l-2 border-primary/20 pl-4 py-1">
                                        "{scanResults.reasoning}"
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="flex justify-center">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest h-14 px-12 rounded-full shadow-2xl active:scale-95 transition-all">
                                EXECUTE TRADE VECTOR <ArrowRight className="ml-3 h-5 w-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
