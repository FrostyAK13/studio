'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Search, Zap, Target, Crosshair, Loader2, Network, Cpu, Orbit, BarChart3, Wallet, Activity, ShieldCheck, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24 max-w-[1600px] mx-auto">
            <Card className="border-none shadow-sm bg-white overflow-hidden relative rounded-2xl sm:rounded-[3rem] border border-slate-200">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardHeader className="text-center pt-8 px-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                            <Network className="h-7 w-7 text-primary animate-pulse" />
                        </div>
                        <div>
                            <CardTitle className="text-lg sm:text-xl font-black uppercase tracking-widest text-slate-950 leading-tight">MARKET SCANNER</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-10 space-y-10">
                    <div className="flex justify-center">
                        <Button 
                            onClick={startScan} 
                            disabled={status === 'scanning'}
                            className={cn(
                                "h-12 sm:h-16 px-8 sm:px-12 rounded-full font-black text-[9px] sm:text-xs uppercase tracking-[0.2em] shadow-md transition-all active:scale-95 group relative overflow-hidden",
                                status === 'scanning' ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {status === 'scanning' ? (
                                <>
                                    <Loader2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                    SYNCING MARKET VECTORS...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                                    INITIATE MARKET SCAN
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="relative min-h-[200px] flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {status === 'scanning' && (
                                <motion.div 
                                    key="scanning-ui"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-full max-w-xl space-y-8"
                                >
                                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                                        {volatilityIndices.map((m, idx) => (
                                            <div 
                                                key={m.id} 
                                                className={cn(
                                                    "px-2 sm:px-3 py-1 rounded-full border text-[7px] sm:text-[9px] font-black uppercase transition-all duration-100",
                                                    idx === currentScanIndex 
                                                        ? "bg-primary border-primary text-white scale-110 shadow-md z-10" 
                                                        : "bg-slate-50 border-slate-200 text-slate-400"
                                                )}
                                            >
                                                {m.id}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[9px] sm:text-[11px] font-black text-primary animate-pulse tracking-widest uppercase">SCANNING: {volatilityIndices[currentScanIndex].name}</p>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shadow-inner">
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
                                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="w-full space-y-8"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                                        <Card className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl relative group" >
                                            <div className="absolute top-2 right-3"><Crosshair className="h-3 w-3 text-emerald-600" /></div>
                                            <p className="text-[7px] sm:text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">MARKET</p>
                                            <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{result.marketName}</p>
                                        </Card>

                                        <Card className="bg-primary/5 border border-primary/20 p-4 rounded-2xl relative">
                                            <div className="absolute top-2 right-3"><Zap className="h-3 w-3 text-primary" /></div>
                                            <p className="text-[7px] sm:text-[8px] font-black text-primary uppercase tracking-widest mb-1">STRATEGY</p>
                                            <p className="text-sm sm:text-lg font-black text-slate-900 leading-tight">{result.strategy}</p>
                                        </Card>

                                        <Card className="bg-blue-50 border border-blue-200 p-4 rounded-2xl relative animate-in zoom-in-95 duration-700">
                                            <div className="absolute top-2 right-3"><Wallet className="h-3 w-3 text-blue-600" /></div>
                                            <p className="text-[7px] sm:text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1">LIVE PIVOT</p>
                                            <p className="text-sm sm:text-lg font-black text-slate-900 tabular-nums">
                                                {price === 0 ? (
                                                    <span className="text-amber-600 animate-pulse">SYNCING...</span>
                                                ) : (
                                                    price.toFixed(decimalPlaces)
                                                )}
                                            </p>
                                        </Card>

                                        <Card className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl relative">
                                            <div className="absolute top-2 right-3"><Target className="h-3 w-3 text-cyan-600" /></div>
                                            <p className="text-[7px] sm:text-[8px] font-black text-cyan-600 uppercase tracking-widest mb-1">ENTRY SIGNAL</p>
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="text-[6px] text-slate-500 uppercase mb-0.5">TRIGGER</p>
                                                    <p className="text-base sm:text-xl font-black text-slate-900">{result.triggerDigit}</p>
                                                </div>
                                                <div className="w-px h-6 bg-slate-200" />
                                                <div>
                                                    <p className="text-[6px] text-slate-500 uppercase mb-0.5">RECOVERY</p>
                                                    <p className="text-base sm:text-xl font-black text-slate-900">{result.recoveryDigit}</p>
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="bg-amber-50 border border-amber-200 p-4 rounded-2xl relative">
                                            <div className="absolute top-2 right-3"><BarChart3 className="h-3 w-3 text-amber-600" /></div>
                                            <p className="text-[7px] sm:text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">STABILITY</p>
                                            <p className="text-base sm:text-xl font-black text-slate-900 leading-tight tabular-nums">{result.successRate}%</p>
                                            <div className="mt-1.5 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500" style={{ width: `100%` }} />
                                            </div>
                                        </Card>
                                    </div>

                                    <Card className={cn(
                                        "p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border-2 transition-all duration-500 relative overflow-hidden",
                                        entryDetected 
                                            ? "bg-emerald-50 border-emerald-500 shadow-sm" 
                                            : "bg-slate-50 border-slate-200"
                                    )}>
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4 text-center md:text-left">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                                    entryDetected ? "bg-emerald-500 shadow-sm" : "bg-white border border-slate-200"
                                                )}>
                                                    {entryDetected ? <Flame className="h-6 w-6 text-white animate-bounce" /> : <Activity className="h-6 w-6 text-slate-300" />}
                                                </div>
                                                <div>
                                                    <h3 className={cn(
                                                        "text-lg sm:text-xl font-black uppercase tracking-tighter leading-none",
                                                        entryDetected ? "text-emerald-700" : "text-slate-400"
                                                    )}>
                                                        {entryDetected ? "ENTRY DETECTED" : "AWAITING ENTRY"}
                                                    </h3>
                                                    <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-primary/60 mt-1.5">
                                                        {entryDetected ? "STABLE WINDOW ENGAGED" : `MONITORING TICK FLUX FOR TRIGGER DIGIT ${result.triggerDigit}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                {entryPrice && (
                                                    <div className="text-center animate-in zoom-in duration-500">
                                                        <p className="text-[7px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">ENTRY PRICE</p>
                                                        <p className="text-lg sm:text-2xl font-black text-slate-900 tabular-nums leading-none">{entryPrice.toFixed(decimalPlaces)}</p>
                                                    </div>
                                                )}
                                                <div className="w-px h-10 bg-slate-200" />
                                                <div className="text-center">
                                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">STABILITY LOCK</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-2xl sm:text-4xl font-black tabular-nums tracking-tighter leading-none",
                                                            entryDetected ? "text-emerald-600" : "text-slate-200"
                                                        )}>
                                                            {stabilityTicks}
                                                        </span>
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">TICKS</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {entryDetected && (
                                            <div className="mt-6 h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                                <motion.div 
                                                    className="h-full bg-emerald-500"
                                                    initial={{ width: "100%" }}
                                                    animate={{ width: `${(stabilityTicks / result.stabilityWindow) * 100}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                        )}
                                    </Card>

                                    <div className="p-5 sm:p-8 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-3 shadow-inner">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                                <Cpu className="h-4 w-4" /> MARKET ANALYSIS
                                            </h4>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm sm:text-lg text-emerald-600 font-black tabular-nums">{result.confidence.toFixed(2)}%</span>
                                                <p className="text-[7px] text-slate-500 uppercase tracking-widest font-black">STABILITY LOCK</p>
                                            </div>
                                        </div>
                                        <p className="text-[11px] sm:text-sm font-medium text-slate-700 leading-relaxed italic">
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
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto opacity-20">
                                        <Orbit className="h-7 sm:h-8 text-slate-400" />
                                    </div>
                                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">ENGINE STANDBY</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
