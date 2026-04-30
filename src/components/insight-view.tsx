'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Zap, Activity, ShieldCheck, RefreshCw, Target, TrendingUp, Crosshair, Lock, Timer, ArrowRight, AlertCircle, Cpu, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalAnalysisResult } from './dashboard';
import { Progress } from '@/components/ui/progress';

interface InsightViewProps {
    globalResults: Record<string, GlobalAnalysisResult>;
    activeScanId: string | null;
    dashboardPrice: number;
    dashboardMarketId: string;
}

const SIGNAL_LOCK_DURATION = 60000; // 1 minute lock-on

export function InsightView({ globalResults, activeScanId, dashboardPrice, dashboardMarketId }: InsightViewProps) {
    const [livePrice, setLivePrice] = React.useState<number>(0);
    const [liveDigits, setLiveDigits] = React.useState<number[]>([]);
    const [livePip, setLivePip] = React.useState<number>(2);
    
    // Signal Lock States
    const [lockedSignal, setLockedSignal] = React.useState<GlobalAnalysisResult | null>(null);
    const [lockTimestamp, setLockTimestamp] = React.useState<number>(0);
    const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
    const [lastMarketId, setLastMarketId] = React.useState<string | null>(null);

    // Sniper 8.5+ Market Selection
    React.useEffect(() => {
        const now = Date.now();
        const sortedMatches = Object.values(globalResults)
            .filter(r => r.tradeType === 'MATCHES' && r.entryDigit !== null)
            .sort((a, b) => b.marketScore - a.marketScore);

        if (!lockedSignal) {
            const bestGlobal = sortedMatches.find(r => r.marketId !== lastMarketId) || sortedMatches[0];
            if (bestGlobal) {
                setLockedSignal(bestGlobal);
                setLockTimestamp(now);
                setLastMarketId(bestGlobal.marketId);
            }
        } else {
            const elapsed = now - lockTimestamp;
            if (elapsed >= SIGNAL_LOCK_DURATION) {
                setLockedSignal(null);
                setLivePrice(0);
                setLiveDigits([]);
            } else {
                const updatedData = globalResults[lockedSignal.marketId];
                if (updatedData) setLockedSignal(updatedData);
            }
        }
    }, [globalResults, lockedSignal, lockTimestamp, lastMarketId]);

    // Timer Update
    React.useEffect(() => {
        if (!lockTimestamp) return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - lockTimestamp;
            setTimeRemaining(Math.max(0, SIGNAL_LOCK_DURATION - elapsed));
        }, 100);
        return () => clearInterval(interval);
    }, [lockTimestamp]);

    const targetMarketId = lockedSignal?.marketId;

    // Real-Time Feed for Sniper Market
    React.useEffect(() => {
        if (!targetMarketId) return;
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');
        ws.onopen = () => ws.send(JSON.stringify({ "ticks": targetMarketId, "subscribe": 1 }));
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.msg_type === 'tick' && data.tick) {
                const pip = data.tick.pip_size ?? 2;
                const quote = data.tick.quote;
                const pStr = quote.toFixed(8);
                const dec = pStr.split('.')[1] || '00';
                const digit = parseInt(dec[pip - 1] || '0');

                setLivePip(pip);
                setLivePrice(quote);
                setLiveDigits(prev => [digit, ...prev].slice(0, 15));
            }
        };
        return () => { if (ws.readyState < 2) ws.close(); };
    }, [targetMarketId]);

    // v8.5+ Execution Logic: Repetition + Local Dominance Stability
    const repetitionActivation = React.useMemo(() => {
        if (!lockedSignal || liveDigits.length < 8) return false;
        // Digit must appear >= 2 times in the last 8 ticks to activate sniper pressure
        const count = liveDigits.slice(0, 8).filter(d => d === lockedSignal.entryDigit).length;
        return count >= 2;
    }, [liveDigits, lockedSignal]);

    const isTriggerActive = React.useMemo(() => {
        if (!lockedSignal || liveDigits.length < 2) return false;
        const current = liveDigits[0];
        const prev = liveDigits[1];
        
        // Rule: Current = d, Previous != d (Enter on manifestation, not mid-run)
        return current === lockedSignal.entryDigit && prev !== lockedSignal.entryDigit && repetitionActivation;
    }, [liveDigits, lockedSignal, repetitionActivation]);

    const progressValue = (timeRemaining / SIGNAL_LOCK_DURATION) * 100;

    return (
        <div className="space-y-6 animate-in fade-in duration-1000 pb-24 max-w-[1600px] mx-auto px-2">
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-emerald-400 to-primary" />
                <CardHeader className="pb-4 pt-10 px-8 border-b border-white/5 bg-black/40">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-primary/20 rounded-3xl border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                                <Crosshair className="h-7 w-7 text-primary animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-white tracking-tighter uppercase leading-none">SNIPER PROTOCOL v8.5+</CardTitle>
                                <CardDescription className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3">LOCAL DOMINANCE ENGINE</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ACTIVE SYNC: {lockedSignal?.marketName || 'IDLE'}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 sm:p-12">
                    <AnimatePresence mode="wait">
                        {!lockedSignal ? (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="py-32 flex flex-col items-center justify-center gap-8 text-center">
                                <RefreshCw className="h-20 w-20 animate-spin text-primary opacity-20" />
                                <p className="text-sm font-black uppercase tracking-[0.6em] text-white">SCANNING FOR LOCAL PEAKS</p>
                            </motion.div>
                        ) : (
                            <motion.div key={lockedSignal.marketId} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                                    <div className="lg:col-span-7 space-y-8">
                                        <div className="flex items-center justify-between gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-500/20 rounded-lg"><Lock className="h-4 w-4 text-amber-500" /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">SECTOR LOCK</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ROTATION: {Math.ceil(timeRemaining / 1000)}s</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 max-w-[200px] space-y-1.5">
                                                <Progress value={progressValue} className="h-1.5 bg-white/5 [&>div]:bg-amber-500" />
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-[2.5rem] bg-black/60 border border-white/5 shadow-2xl relative group overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">TRIGGER DIGIT [d]</p>
                                                <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest">LOCAL PEAK</Badge>
                                            </div>
                                            <div className="flex items-baseline gap-6">
                                                <span className="text-8xl font-black text-white tabular-nums tracking-tighter">{lockedSignal.entryDigit}</span>
                                                <div className="space-y-2">
                                                    <Badge className={cn("border-none text-[10px] font-black uppercase px-4 py-1.5", repetitionActivation ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40")}>
                                                        {repetitionActivation ? "REPETITION ACTIVE" : "AWAITING PRESSURE"}
                                                    </Badge>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">LD SCORE: {lockedSignal.localDominance.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500",
                                            isTriggerActive ? "bg-emerald-500/20 border-emerald-500 shadow-emerald-500/20" : "bg-white/5 border-white/5"
                                        )}>
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn("p-4 rounded-2xl", isTriggerActive ? "bg-emerald-500" : "bg-white/10")}>
                                                        <Target className="h-8 w-8 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-white uppercase tracking-[0.4em]">EXECUTION GATES</p>
                                                        <h4 className="text-2xl font-black text-white uppercase mt-1">MATCHES AT TRIGGER {lockedSignal.entryDigit}</h4>
                                                    </div>
                                                </div>
                                                {isTriggerActive && <Zap className="h-8 w-8 text-emerald-400 animate-pulse" />}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.5em]">LIVE FEED</p>
                                                    <span className="text-[10px] font-black text-emerald-400 tabular-nums">{(livePrice || lockedSignal.currentPrice).toFixed(livePip || lockedSignal.pip)}</span>
                                                </div>
                                                <div className="flex gap-2.5 justify-start overflow-hidden h-14 items-center">
                                                    {liveDigits.map((digit, idx) => (
                                                        <div key={`${idx}-${digit}`} className={cn(
                                                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border transition-all shrink-0",
                                                            digit === lockedSignal.entryDigit ? "bg-primary border-primary text-white shadow-xl scale-110" : "bg-white/5 border-white/10 text-white/30"
                                                        )}>
                                                            {digit}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-5 space-y-6">
                                        <Card className="bg-black/40 border-white/5 p-8 rounded-[2.5rem] space-y-8">
                                            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.5em] flex items-center gap-3">
                                                <Cpu className="h-5 w-5" /> // STABILITY HUBS
                                            </h4>
                                            
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between px-1">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CONCENTRATION (CI)</p>
                                                        <p className="text-sm font-black text-emerald-400 tabular-nums">{lockedSignal.ci.toFixed(1)}</p>
                                                    </div>
                                                    <Progress value={Math.min(100, (lockedSignal.ci / 200) * 100)} className="h-2 bg-white/5 [&>div]:bg-emerald-500" />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <div className="flex justify-between px-1">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CLUSTER SMOOTHNESS</p>
                                                        <p className="text-sm font-black text-blue-400 tabular-nums">{(1 - (lockedSignal.stability / 2)).toFixed(2)}</p>
                                                    </div>
                                                    <Progress value={Math.max(0, (1 - (lockedSignal.stability / 2)) * 100)} className="h-2 bg-white/5 [&>div]:bg-blue-500" />
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between px-1">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">GLOBAL STABILITY (SS)</p>
                                                        <p className="text-sm font-black text-cyan-400 tabular-nums">{lockedSignal.ss.toFixed(2)}</p>
                                                    </div>
                                                    <Progress value={lockedSignal.ss * 100} className="h-2 bg-white/5 [&>div]:bg-cyan-500" />
                                                </div>
                                            </div>

                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                                    <p className="text-[9px] font-black text-white uppercase tracking-widest">v8.5+ EXECUTION RULE</p>
                                                </div>
                                                <p className="text-[10px] font-bold text-white/80 leading-relaxed italic uppercase">
                                                    "Sniper identifies local peak at {lockedSignal.entryDigit}. Trade only on manifestation of {lockedSignal.entryDigit} after repetition pressure is confirmed. Lock digit for cycle reset after execution."
                                                </p>
                                            </div>
                                        </Card>
                                        
                                        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Layers className="h-5 w-5 text-primary" />
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">SNIPER SCORE</p>
                                            </div>
                                            <span className="text-xl font-black text-primary">{lockedSignal.confidence.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
}
