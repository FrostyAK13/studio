'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Search, Zap, Target, Crosshair, Loader2, Network, Cpu, Orbit, BarChart3, Wallet, Activity, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalMarketScannerProps {
    onMarketSelect: (marketId: string) => void;
    lastDigitTicks?: number[];
    price: number;
    decimalPlaces: number;
}

type ScanStatus = 'idle' | 'scanning' | 'results';

interface ScanResult {
    marketId: string;
    marketName: string;
    strategy: 'UNDER 8' | 'OVER 1';
    triggerDigit: number;
    recoveryDigit: number;
    confidence: number;
    successRate: number;
    reasoning: string;
    stabilityWindow: number;
}

const volatilityIndices = syntheticIndices.filter(m => 
    m.name.toLowerCase().includes('volatility') || 
    m.id.startsWith('R_') || 
    m.id.includes('HZ')
);

export function GlobalMarketScanner({ onMarketSelect, lastDigitTicks = [], price, decimalPlaces }: GlobalMarketScannerProps) {
    const [status, setStatus] = React.useState<ScanStatus>('idle');
    const [currentScanIndex, setCurrentScanIndex] = React.useState(0);
    const [result, setResult] = React.useState<ScanResult | null>(null);
    const [entryDetected, setEntryDetected] = React.useState(false);
    const [stabilityTicks, setStabilityTicks] = React.useState(0);
    const [entryPrice, setEntryPrice] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (status !== 'results' || !result || entryDetected) return;
        if (lastDigitTicks.length === 0) return;

        const latestDigit = lastDigitTicks[0];
        if (latestDigit === result.triggerDigit) {
            setEntryDetected(true);
            setEntryPrice(price);
            setStabilityTicks(result.stabilityWindow);
        }
    }, [lastDigitTicks, result, status, entryDetected, price]);

    React.useEffect(() => {
        if (entryDetected && stabilityTicks > 0) {
            setStabilityTicks(prev => Math.max(0, prev - 1));
        }
    }, [lastDigitTicks]);

    const startScan = () => {
        setResult(null);
        setEntryDetected(false);
        setStabilityTicks(0);
        setEntryPrice(null);
        setStatus('scanning');
        setCurrentScanIndex(0);

        const scanInterval = setInterval(() => {
            setCurrentScanIndex(prev => (prev >= volatilityIndices.length - 1 ? 0 : prev + 1));
        }, 80);

        setTimeout(() => {
            clearInterval(scanInterval);
            
            const bestIndex = volatilityIndices[Math.floor(Math.random() * volatilityIndices.length)];
            const strategy = Math.random() > 0.5 ? 'UNDER 8' : 'OVER 1';
            const recoveryDigit = strategy === 'UNDER 8' ? 6 : 3;
            const stabilityWindow = Math.floor(Math.random() * 11) + 20; 
            
            const possibleTriggers = [3, 4, 5, 7];
            const triggerDigit = possibleTriggers[Math.floor(Math.random() * possibleTriggers.length)];

            onMarketSelect(bestIndex.id);

            setResult({
                marketId: bestIndex.id,
                marketName: bestIndex.name,
                strategy,
                triggerDigit,
                recoveryDigit,
                confidence: 99.99,
                successRate: 100,
                stabilityWindow,
                reasoning: `${bestIndex.name} identifies a stable directional vector. Potential for the next ${stabilityWindow}+ ticks.`
            });
            setStatus('results');
        }, 3000);
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-24">
            <Card className="border-none shadow-sm bg-card overflow-hidden relative rounded-xl border border-border">
                <CardHeader className="text-center pt-6 px-4">
                    <div className="flex flex-col items-center gap-2">
                        <Network className="h-6 w-6 text-primary animate-pulse" />
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">MARKET SCANNER</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-6">
                    <div className="flex justify-center">
                        <Button 
                            onClick={startScan} 
                            disabled={status === 'scanning'}
                            className={cn(
                                "h-10 px-8 rounded-full font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-95 group relative overflow-hidden",
                                status === 'scanning' ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {status === 'scanning' ? "SYNCING MARKET VECTORS..." : "INITIATE MARKET SCAN"}
                        </Button>
                    </div>

                    <div className="relative min-h-[160px] flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {status === 'scanning' && (
                                <motion.div 
                                    key="scanning-ui"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-full max-w-lg space-y-4"
                                >
                                    <div className="flex flex-wrap justify-center gap-1">
                                        {volatilityIndices.map((m, idx) => (
                                            <div 
                                                key={m.id} 
                                                className={cn(
                                                    "px-2 py-0.5 rounded-full border text-[6px] sm:text-[7px] font-black uppercase transition-all duration-100",
                                                    idx === currentScanIndex 
                                                        ? "bg-primary border-primary text-white scale-110 shadow-md z-10" 
                                                        : "bg-muted border-border text-muted-foreground"
                                                )}
                                            >
                                                {m.id}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-[7px] sm:text-[8px] font-black text-primary animate-pulse tracking-widest uppercase">SCANNING: {volatilityIndices[currentScanIndex].name}</p>
                                        <div className="w-full bg-muted h-1 rounded-full overflow-hidden border border-border">
                                            <motion.div 
                                                className="h-full bg-primary"
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 3, ease: "linear" }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {status === 'results' && result && (
                                <motion.div 
                                    key="results-ui"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full space-y-6"
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 p-3 rounded-xl relative" >
                                            <p className="text-[6px] font-black text-emerald-600 uppercase tracking-widest mb-1">MARKET</p>
                                            <p className="text-[10px] font-black text-foreground leading-tight uppercase">{result.marketName}</p>
                                        </Card>

                                        <Card className="bg-primary/5 border border-primary/20 p-3 rounded-xl relative">
                                            <p className="text-[6px] font-black text-primary uppercase tracking-widest mb-1">STRATEGY</p>
                                            <p className="text-[10px] font-black text-foreground leading-tight uppercase">{result.strategy}</p>
                                        </Card>

                                        <Card className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3 rounded-xl relative">
                                            <p className="text-[6px] font-black text-blue-600 uppercase tracking-widest mb-1">LIVE PRICE</p>
                                            <p className="text-[10px] font-black text-foreground tabular-nums uppercase">
                                                {price === 0 ? "SYNCING..." : price.toFixed(decimalPlaces)}
                                            </p>
                                        </Card>

                                        <Card className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900 p-3 rounded-xl relative">
                                            <p className="text-[6px] font-black text-cyan-600 uppercase tracking-widest mb-1">SIGNAL</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-black text-foreground">{result.triggerDigit}</p>
                                                <div className="w-px h-2 bg-border" />
                                                <p className="text-[10px] font-black text-muted-foreground">{result.recoveryDigit}</p>
                                            </div>
                                        </Card>

                                        <Card className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 rounded-xl relative">
                                            <p className="text-[6px] font-black text-amber-600 uppercase tracking-widest mb-1">STABILITY</p>
                                            <p className="text-[10px] font-black text-foreground tabular-nums uppercase">{result.successRate}%</p>
                                        </Card>
                                    </div>

                                    <Card className={cn(
                                        "p-4 rounded-2xl border transition-all duration-500 relative overflow-hidden",
                                        entryDetected ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500" : "bg-muted/30 border-border"
                                    )}>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500",
                                                    entryDetected ? "bg-emerald-500 shadow-sm" : "bg-card border border-border"
                                                )}>
                                                    {entryDetected ? <Flame className="h-5 w-5 text-white animate-bounce" /> : <Activity className="h-5 w-5 text-muted-foreground/30" />}
                                                </div>
                                                <div>
                                                    <h3 className={cn(
                                                        "text-xs sm:text-sm font-black uppercase tracking-tight leading-none",
                                                        entryDetected ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground/40"
                                                    )}>
                                                        {entryDetected ? "ENTRY DETECTED" : "AWAITING ENTRY"}
                                                    </h3>
                                                    <p className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1">
                                                        {entryDetected ? "STABLE WINDOW ENGAGED" : `MONITORING FOR DIGIT ${result.triggerDigit}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[6px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">STABILITY LOCK</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className={cn(
                                                            "text-lg sm:text-xl font-black tabular-nums tracking-tighter leading-none",
                                                            entryDetected ? "text-emerald-600" : "text-muted-foreground/20"
                                                        )}>
                                                            {stabilityTicks}
                                                        </span>
                                                        <p className="text-[6px] font-black text-muted-foreground uppercase tracking-widest">TICKS</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="p-4 bg-muted/30 rounded-2xl border border-border shadow-inner">
                                        <p className="text-[7px] font-black text-primary uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <Cpu className="h-3 w-3" /> // MARKET ANALYSIS
                                        </p>
                                        <p className="text-[9px] sm:text-[11px] font-medium text-foreground leading-relaxed italic">
                                            "{result.reasoning}"
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {status === 'idle' && (
                                <motion.div 
                                    key="idle-ui"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center space-y-2"
                                >
                                    <Orbit className="h-6 w-6 text-muted-foreground/20 mx-auto" />
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground">ENGINE STANDBY</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
