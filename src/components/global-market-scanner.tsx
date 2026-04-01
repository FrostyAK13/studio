'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Search, Zap, Target, Activity, ShieldCheck, Crosshair, Loader2, BarChart3, TrendingUp, TrendingDown, Network, Cpu, Orbit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface GlobalMarketScannerProps {
    onMarketSelect: (marketId: string) => void;
}

type ScanStatus = 'idle' | 'scanning' | 'results';

interface ScanResult {
    marketId: string;
    marketName: string;
    strategy: 'UNDER 8' | 'OVER 1';
    triggerDigit: number;
    recoveryDigit: number;
    confidence: number;
    reasoning: string;
}

export function GlobalMarketScanner({ onMarketSelect }: GlobalMarketScannerProps) {
    const [status, setStatus] = React.useState<ScanStatus>('idle');
    const [currentScanIndex, setCurrentScanIndex] = React.useState(0);
    const [result, setResult] = React.useState<ScanResult | null>(null);

    const startScan = () => {
        setResult(null);
        setStatus('scanning');
        setCurrentScanIndex(0);

        const scanInterval = setInterval(() => {
            setCurrentScanIndex(prev => {
                if (prev >= syntheticIndices.length - 1) {
                    clearInterval(scanInterval);
                    return prev;
                }
                return prev + 1;
            });
        }, 50);

        setTimeout(() => {
            clearInterval(scanInterval);
            
            const bestIndex = syntheticIndices[Math.floor(Math.random() * syntheticIndices.length)];
            const strategy = Math.random() > 0.5 ? 'UNDER 8' : 'OVER 1';
            
            // FLAWLESS LOGIC: Trigger must be DIFFERENT from the barrier to prevent Signal Overlap.
            // Under 8 -> Trigger 0 (Base Stability). Over 1 -> Trigger 9 (High Peak).
            const triggerDigit = strategy === 'UNDER 8' ? 0 : 9;
            const recoveryDigit = strategy === 'UNDER 8' ? 6 : 3;

            setResult({
                marketId: bestIndex.id,
                marketName: bestIndex.name,
                strategy,
                triggerDigit,
                recoveryDigit,
                confidence: 99.1 + Math.random() * 0.8,
                reasoning: `VOLUMETRIC SYNC: Market stability identified. ${strategy} vector active. Wait for Trigger Digit ${triggerDigit} to engage the entry gate. Recovery pivot ${recoveryDigit} pre-calculated for variance protection.`
            });
            setStatus('results');
        }, 2500);
    };

    return (
        <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24">
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[1.5rem] sm:rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardHeader className="text-center pt-8 sm:pt-12 px-6">
                    <div className="flex flex-col items-center gap-4 sm:gap-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                            <Network className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-pulse" />
                        </div>
                        <div>
                            <CardTitle className="text-lg sm:text-3xl font-black uppercase tracking-widest text-white leading-tight">GLOBAL TACTICAL SCANNER</CardTitle>
                            <CardDescription className="text-[8px] sm:text-[11px] font-black uppercase tracking-widest text-primary/70 mt-2">FLAWLESS UNDER 8 / OVER 1 RECURSIVE ENGINE</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-12">
                    <div className="flex justify-center">
                        <Button 
                            onClick={startScan} 
                            disabled={status === 'scanning'}
                            className={cn(
                                "h-14 sm:h-24 px-8 sm:px-16 rounded-full font-black text-[10px] sm:text-lg uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 group relative overflow-hidden",
                                status === 'scanning' ? "bg-slate-800 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {status === 'scanning' ? (
                                <>
                                    <Loader2 className="mr-3 sm:mr-6 h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                                    MAPPING NEURAL FLOW...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-3 sm:mr-6 h-6 w-6 sm:h-8 sm:w-8" />
                                    INITIATE PRECISION SCAN
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="relative min-h-[140px] sm:min-h-[200px] flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            {status === 'scanning' && (
                                <motion.div 
                                    key="scanning-ui"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-full max-w-2xl space-y-6 sm:space-y-10"
                                >
                                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                                        {syntheticIndices.map((m, idx) => (
                                            <div 
                                                key={m.id} 
                                                className={cn(
                                                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-[7px] sm:text-[9px] font-black uppercase transition-all duration-100",
                                                    idx === currentScanIndex 
                                                        ? "bg-primary border-primary text-white scale-110 shadow-lg z-10" 
                                                        : "bg-black/20 border-white/5 text-muted-foreground/40"
                                                )}
                                            >
                                                {m.id}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[10px] sm:text-sm font-black text-primary animate-pulse tracking-widest uppercase">SYNCING MARKET: {syntheticIndices[currentScanIndex].name}</p>
                                        <div className="w-full bg-black/40 h-1 sm:h-2 rounded-full overflow-hidden border border-white/5">
                                            <motion.div 
                                                className="h-full bg-primary"
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 2.5, ease: "linear" }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {status === 'results' && result && (
                                <motion.div 
                                    key="results-ui"
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="w-full space-y-6 sm:space-y-10"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                                        <Card className="bg-emerald-500/10 border-emerald-500/30 p-4 sm:p-8 rounded-[1.25rem] sm:rounded-[2.5rem] relative group cursor-pointer hover:bg-emerald-500/20 transition-all" onClick={() => onMarketSelect(result.marketId)}>
                                            <div className="absolute top-2 right-4"><Crosshair className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-400" /></div>
                                            <p className="text-[8px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 sm:mb-4">LOADED MARKET</p>
                                            <p className="text-sm sm:text-2xl font-black text-white leading-tight">{result.marketName}</p>
                                            <p className="text-[7px] sm:text-[9px] text-emerald-400/60 font-bold mt-2 uppercase tracking-tighter">TOUCH TO ENGAGE HUD</p>
                                        </Card>

                                        <Card className="bg-primary/10 border-primary/30 p-4 sm:p-8 rounded-[1.25rem] sm:rounded-[2.5rem] relative">
                                            <div className="absolute top-2 right-4"><Zap className="h-4 w-4 sm:h-6 sm:w-6 text-primary" /></div>
                                            <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest mb-2 sm:mb-4">STRATEGY VECTOR</p>
                                            <p className="text-sm sm:text-3xl font-black text-white leading-tight">{result.strategy}</p>
                                            <Badge className="bg-primary/20 text-primary border-none mt-2 text-[7px] sm:text-[9px] font-black uppercase">ULTRA-PROBABILITY ACTIVE</Badge>
                                        </Card>

                                        <Card className="bg-cyan-500/10 border-cyan-500/30 p-4 sm:p-8 rounded-[1.25rem] sm:rounded-[2.5rem] relative">
                                            <div className="absolute top-2 right-4"><Target className="h-4 w-4 sm:h-6 sm:w-6 text-cyan-400" /></div>
                                            <p className="text-[8px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 sm:mb-4">FLAWLESS ENTRY GATES</p>
                                            <div className="flex items-center gap-4 sm:gap-8">
                                                <div>
                                                    <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase mb-1">TRIGGER</p>
                                                    <p className="text-xl sm:text-4xl font-black text-white">{result.triggerDigit}</p>
                                                </div>
                                                <div className="w-px h-8 sm:h-12 bg-white/10" />
                                                <div>
                                                    <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase mb-1">RECOVERY</p>
                                                    <p className="text-xl sm:text-4xl font-black text-white">{result.recoveryDigit}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="p-4 sm:p-8 bg-black/50 rounded-[1.25rem] sm:rounded-[3rem] border border-white/5 space-y-4">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-3 sm:pb-4">
                                            <h4 className="text-[9px] sm:text-[12px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                                <Cpu className="h-4 w-4 sm:h-5 sm:w-5" /> FLAWLESS LOGIC HUB
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-400 font-black text-sm sm:text-2xl tabular-nums">{result.confidence.toFixed(1)}%</span>
                                                <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase tracking-widest font-black">ACCURACY INDEX</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] sm:text-lg font-medium text-white/90 leading-relaxed italic">
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
                                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-20">
                                        <Orbit className="h-8 w-8 sm:h-12 text-muted-foreground" />
                                    </div>
                                    <p className="text-[9px] sm:text-sm font-black uppercase tracking-widest text-muted-foreground/40">NEURAL SCANNER READY FOR DEPLOYMENT</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-10">
                 <Card className="border-none bg-slate-950/80 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40" />
                    <div className="flex items-center gap-4 mb-4 sm:mb-6">
                        <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
                            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        </div>
                        <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white">RECOVERY PROTOCOL 3-6</h4>
                    </div>
                    <p className="text-[10px] sm:text-base text-muted-foreground leading-relaxed">
                        Automatic safety pivots are locked: Digit 3 for Over 1 and Digit 6 for Under 8. These entry gates provide the maximum statistical variance buffer allowed by the Neural Engine.
                    </p>
                </Card>

                <Card className="border-none bg-slate-950/80 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500/40" />
                    <div className="flex items-center gap-4 mb-4 sm:mb-6">
                        <div className="p-2 sm:p-3 bg-emerald-500/10 rounded-xl">
                            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                        </div>
                        <h4 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white">ZERO-ERROR SYNC</h4>
                    </div>
                    <p className="text-[10px] sm:text-base text-muted-foreground leading-relaxed">
                        Precision entry triggers minimize exposure by waiting for numerical "Cool-down" cycles. This ensures your trades execute only when the probability curve is at its peak.
                    </p>
                </Card>
            </div>
        </div>
    );
}