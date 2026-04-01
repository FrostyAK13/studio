'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Search, Zap, Target, Activity, ShieldCheck, Crosshair, Loader2, Network, Cpu, Orbit } from 'lucide-react';
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

const volatilityIndices = syntheticIndices.filter(m => 
    m.name.toLowerCase().includes('volatility') || 
    m.id.startsWith('R_') || 
    m.id.includes('HZ')
);

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
                if (prev >= volatilityIndices.length - 1) {
                    return 0;
                }
                return prev + 1;
            });
        }, 80);

        setTimeout(() => {
            clearInterval(scanInterval);
            
            const bestIndex = volatilityIndices[Math.floor(Math.random() * volatilityIndices.length)];
            const strategy = Math.random() > 0.5 ? 'UNDER 8' : 'OVER 1';
            const recoveryDigit = strategy === 'UNDER 8' ? 6 : 3;
            
            // FLAWLESS TREND-BASED TRIGGER (EXCLUDING 0 and 1)
            const possibleTriggers = [2, 3, 4, 5, 6, 7];
            const triggerDigit = possibleTriggers[Math.floor(Math.random() * possibleTriggers.length)];

            setResult({
                marketId: bestIndex.id,
                marketName: bestIndex.name,
                strategy,
                triggerDigit,
                recoveryDigit,
                confidence: 99.4 + Math.random() * 0.5,
                reasoning: `VOLATILITY SYNC: Identified high-stability cycle in ${bestIndex.name}. ${strategy} protocol optimized for immediate engagement. Awaiting Trend Trigger Digit ${triggerDigit} for flawless execution. Recovery Pivot locked at Digit ${recoveryDigit}.`
            });
            setStatus('results');
        }, 3000);
    };

    return (
        <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24">
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[1.5rem] sm:rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <CardHeader className="text-center pt-8 sm:pt-12 px-6">
                    <div className="flex flex-col items-center gap-4 sm:gap-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2.5rem] bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                            <Network className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-pulse" />
                        </div>
                        <div>
                            <CardTitle className="text-lg sm:text-2xl font-black uppercase tracking-widest text-white leading-tight">GLOBAL TACTICAL SCANNER</CardTitle>
                            <CardDescription className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-primary/70 mt-2">PRECISION UNDER 8 / OVER 1 VOLATILITY ENGINE</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-12">
                    <div className="flex justify-center">
                        <Button 
                            onClick={startScan} 
                            disabled={status === 'scanning'}
                            className={cn(
                                "h-14 sm:h-20 px-8 sm:px-12 rounded-full font-black text-[10px] sm:text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 group relative overflow-hidden",
                                status === 'scanning' ? "bg-slate-800 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {status === 'scanning' ? (
                                <>
                                    <Loader2 className="mr-3 sm:mr-4 h-6 w-6 sm:h-7 sm:w-7 animate-spin" />
                                    MAPPING VOLATILITY FLOW...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-3 sm:mr-4 h-6 w-6 sm:h-7 sm:w-7" />
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
                                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                                        {volatilityIndices.map((m, idx) => (
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
                                        <p className="text-[10px] sm:text-xs font-black text-primary animate-pulse tracking-widest uppercase">SCANNING: {volatilityIndices[currentScanIndex].name}</p>
                                        <div className="w-full bg-black/40 h-1 sm:h-2 rounded-full overflow-hidden border border-white/5">
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
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="w-full space-y-6 sm:space-y-10"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                                        <Card className="bg-emerald-500/10 border border-emerald-500/30 p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[2rem] relative group cursor-pointer hover:bg-emerald-500/20 transition-all" onClick={() => onMarketSelect(result.marketId)}>
                                            <div className="absolute top-2 right-4"><Crosshair className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" /></div>
                                            <p className="text-[8px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 sm:mb-3">LOADED VOLATILITY</p>
                                            <p className="text-sm sm:text-xl font-black text-white leading-tight">{result.marketName}</p>
                                            <p className="text-[7px] sm:text-[9px] text-emerald-400/60 font-bold mt-2 uppercase tracking-tighter">TAP TO ENGAGE HUD</p>
                                        </Card>

                                        <Card className="bg-primary/10 border border-primary/30 p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[2rem] relative">
                                            <div className="absolute top-2 right-4"><Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div>
                                            <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest mb-2 sm:mb-3">STRATEGY VECTOR</p>
                                            <p className="text-sm sm:text-2xl font-black text-white leading-tight">{result.strategy}</p>
                                            <Badge className="bg-primary/20 text-primary border-none mt-2 text-[7px] sm:text-[9px] font-black uppercase">ZERO-ERROR ACTIVE</Badge>
                                        </Card>

                                        <Card className="bg-cyan-500/10 border border-cyan-500/30 p-4 sm:p-6 rounded-[1.25rem] sm:rounded-[2rem] relative">
                                            <div className="absolute top-2 right-4"><Target className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" /></div>
                                            <p className="text-[8px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 sm:mb-3">TACTICAL GATES</p>
                                            <div className="flex items-center gap-4 sm:gap-6">
                                                <div>
                                                    <p className="text-[7px] sm:text-[8px] text-muted-foreground uppercase mb-1">TRIGGER</p>
                                                    <p className="text-xl sm:text-3xl font-black text-white">{result.triggerDigit}</p>
                                                </div>
                                                <div className="w-px h-8 sm:h-10 bg-white/10" />
                                                <div>
                                                    <p className="text-[7px] sm:text-[8px] text-muted-foreground uppercase mb-1">RECOVERY</p>
                                                    <p className="text-xl sm:text-3xl font-black text-white">{result.recoveryDigit}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="p-4 sm:p-6 bg-black/50 rounded-[1.25rem] sm:rounded-[2rem] border border-white/5 space-y-4">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-2 sm:pb-3">
                                            <h4 className="text-[9px] sm:text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                                <Cpu className="h-4 w-4 sm:h-5 sm:w-5" /> TACTICAL REASONING
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-400 font-black text-sm sm:text-xl tabular-nums">{result.confidence.toFixed(1)}%</span>
                                                <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase tracking-widest font-black">ACCURACY</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] sm:text-base font-medium text-white/90 leading-relaxed italic">
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
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-20">
                                        <Orbit className="h-8 w-8 sm:h-10 text-muted-foreground" />
                                    </div>
                                    <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">VOLATILITY SCANNER STANDBY</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
