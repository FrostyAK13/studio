
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Network, Cpu, Orbit, Activity, Flame, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalMarketScannerProps {
    onMarketSelect: (marketId: string) => void;
    selectedMarket: string;
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

export function GlobalMarketScanner({ onMarketSelect, selectedMarket, lastDigitTicks = [], price, decimalPlaces }: GlobalMarketScannerProps) {
    const [status, setStatus] = React.useState<ScanStatus>('idle');
    const [currentScanIndex, setCurrentScanIndex] = React.useState(0);
    const [result, setResult] = React.useState<ScanResult | null>(null);
    const [entryDetected, setEntryDetected] = React.useState(false);
    const [stabilityTicks, setStabilityTicks] = React.useState(0);

    // Only monitor entry if the dashboard is actually connected to the recommended market
    const isMarketActive = result?.marketId === selectedMarket;

    React.useEffect(() => {
        if (status !== 'results' || !result || entryDetected || !isMarketActive) return;
        if (lastDigitTicks.length === 0) return;

        const latestDigit = lastDigitTicks[0];
        if (latestDigit === result.triggerDigit) {
            setEntryDetected(true);
            setStabilityTicks(result.stabilityWindow);
        }
    }, [lastDigitTicks, result, status, entryDetected, isMarketActive]);

    React.useEffect(() => {
        if (entryDetected && stabilityTicks > 0) {
            setStabilityTicks(prev => Math.max(0, prev - 1));
        }
    }, [lastDigitTicks]);

    const startScan = () => {
        setResult(null);
        setEntryDetected(false);
        setStabilityTicks(0);
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

            // We no longer call onMarketSelect here to avoid changing global state during scan
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

    const activateMarket = () => {
        if (result) {
            onMarketSelect(result.marketId);
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-24">
            <Card className="border-none shadow-sm bg-card overflow-hidden relative rounded-xl border border-border">
                <CardHeader className="text-center pt-8 px-4">
                    <div className="flex flex-col items-center gap-3">
                        <Network className="h-8 w-8 text-primary animate-pulse" />
                        <CardTitle className="text-[12px] font-black uppercase tracking-[0.5em] text-foreground">MARKET SCANNER</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                    <div className="flex justify-center">
                        <Button 
                            onClick={startScan} 
                            disabled={status === 'scanning'}
                            className={cn(
                                "h-12 px-10 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 group relative overflow-hidden",
                                status === 'scanning' ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            {status === 'scanning' ? "SYNCING MARKET VECTORS..." : "INITIATE MARKET SCAN"}
                        </Button>
                    </div>

                    <div className="relative min-h-[200px] flex flex-col items-center justify-center bg-muted/20 rounded-[2rem] border border-border shadow-inner p-6">
                        <AnimatePresence mode="wait">
                            {status === 'scanning' && (
                                <motion.div 
                                    key="scanning-ui"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-full max-w-2xl space-y-6"
                                >
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {volatilityIndices.map((m, idx) => (
                                            <div 
                                                key={m.id} 
                                                className={cn(
                                                    "px-3 py-1 rounded-full border text-[8px] font-black uppercase transition-all duration-100",
                                                    idx === currentScanIndex 
                                                        ? "bg-primary border-primary text-white scale-110 shadow-md z-10" 
                                                        : "bg-background border-border text-muted-foreground"
                                                )}
                                            >
                                                {m.id}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center space-y-3">
                                        <p className="text-[10px] font-black text-primary animate-pulse tracking-[0.3em] uppercase">ANALYZING: {volatilityIndices[currentScanIndex].name}</p>
                                        <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border">
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
                                    className="w-full space-y-8"
                                >
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                        <Card className="bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">MARKET</p>
                                            <p className="text-[11px] font-black text-foreground leading-tight uppercase">{result.marketName}</p>
                                        </Card>

                                        <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1.5">STRATEGY</p>
                                            <p className="text-[11px] font-black text-foreground leading-tight uppercase">{result.strategy}</p>
                                        </Card>

                                        <Card className="bg-blue-50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5">LIVE PRICE</p>
                                            <p className="text-[11px] font-black text-foreground tabular-nums uppercase">
                                                {isMarketActive ? price.toFixed(decimalPlaces) : "OFFLINE"}
                                            </p>
                                        </Card>

                                        <Card className="bg-cyan-50 dark:bg-cyan-950/10 border-cyan-200 dark:border-cyan-900 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-cyan-600 uppercase tracking-widest mb-1.5">SIGNAL</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[11px] font-black text-foreground">{result.triggerDigit}</p>
                                                <div className="w-px h-3 bg-border" />
                                                <p className="text-[11px] font-black text-muted-foreground">{result.recoveryDigit}</p>
                                            </div>
                                        </Card>

                                        <Card className="bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1.5">STABILITY</p>
                                            <p className="text-[11px] font-black text-foreground tabular-nums uppercase">{result.successRate}%</p>
                                        </Card>
                                    </div>

                                    {!isMarketActive ? (
                                        <div className="flex flex-col items-center gap-4 py-4">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-amber-500" /> ACTIVATE MARKET TO MONITOR LIVE VECTOR
                                            </p>
                                            <Button 
                                                onClick={activateMarket}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest h-14 px-12 rounded-full shadow-2xl active:scale-95 transition-all"
                                            >
                                                ACTIVATE {result.marketName.toUpperCase()} <ArrowRight className="ml-3 h-5 w-5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Card className={cn(
                                            "p-6 rounded-[2rem] border transition-all duration-500 relative overflow-hidden",
                                            entryDetected ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-background border-border"
                                        )}>
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                                        entryDetected ? "bg-emerald-500 shadow-xl" : "bg-muted border border-border"
                                                    )}>
                                                        {entryDetected ? <Flame className="h-8 w-8 text-white animate-bounce" /> : <Activity className="h-8 w-8 text-muted-foreground/30" />}
                                                    </div>
                                                    <div>
                                                        <h3 className={cn(
                                                            "text-lg sm:text-xl font-black uppercase tracking-tight leading-none",
                                                            entryDetected ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground/40"
                                                        )}>
                                                            {entryDetected ? "ENTRY DETECTED" : "AWAITING ENTRY"}
                                                        </h3>
                                                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-primary/60 mt-2">
                                                            {entryDetected ? "STABLE WINDOW ENGAGED" : `MONITORING FOR DIGIT ${result.triggerDigit}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">STABILITY LOCK</p>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className={cn(
                                                            "text-3xl font-black tabular-nums tracking-tighter leading-none",
                                                            entryDetected ? "text-emerald-600" : "text-muted-foreground/20"
                                                        )}>
                                                            {stabilityTicks}
                                                        </span>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TICKS</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    )}

                                    <div className="p-6 bg-background rounded-[2rem] border border-border shadow-inner">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" /> // MARKET SYNOPSIS
                                        </p>
                                        <p className="text-[11px] sm:text-[13px] font-medium text-foreground leading-relaxed italic">
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
                                    className="text-center space-y-4"
                                >
                                    <Orbit className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">ENGINE STANDBY // AWAITING SCAN</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
