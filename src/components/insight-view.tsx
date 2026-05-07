'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Zap, Activity, ShieldCheck, RefreshCw, Target, TrendingUp, Crosshair, Lock, Timer, ArrowRight, AlertCircle, Cpu, Layers, MoveRight, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalAnalysisResult } from './dashboard';
import { Progress } from '@/components/ui/progress';
import { syntheticIndices } from '@/lib/mock-data';

interface InsightViewProps {
    globalResults: Record<string, GlobalAnalysisResult>;
    activeScanId: string | null;
    dashboardPrice: number;
    dashboardMarketId: string;
}

const SIGNAL_LOCK_DURATION = 60000; // 1 minute lock-on before rotation

export function InsightView({ globalResults, activeScanId, dashboardPrice, dashboardMarketId }: InsightViewProps) {
    const [livePrice, setLivePrice] = React.useState<number>(0);
    const [liveDigits, setLiveDigits] = React.useState<number[]>([]);
    const [livePip, setLivePip] = React.useState<number>(2);
    
    // Signal Lock States
    const [lockedSignal, setLockedSignal] = React.useState<GlobalAnalysisResult | null>(null);
    const [lockTimestamp, setLockTimestamp] = React.useState<number>(0);
    const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
    const [lastMarketId, setLastMarketId] = React.useState<string | null>(null);

    // Probability Flow Lock-On Logic
    React.useEffect(() => {
        const now = Date.now();
        const sortedMatches = Object.values(globalResults)
            .filter(r => r.tradeType === 'FLOW' && r.triggerDigit !== null && r.targetDigit !== null)
            .sort((a, b) => b.confidence - a.confidence);

        if (!lockedSignal) {
            // Find the best global setup that wasn't the last one we used
            const bestGlobal = sortedMatches.find(r => r.marketId !== lastMarketId) || sortedMatches[0];
            if (bestGlobal) {
                setLockedSignal(bestGlobal);
                setLockTimestamp(now);
                setLastMarketId(bestGlobal.marketId);
            }
        } else {
            const elapsed = now - lockTimestamp;
            if (elapsed >= SIGNAL_LOCK_DURATION) {
                // Unlock and prepare for rotation
                setLockedSignal(null);
                setLivePrice(0);
                setLiveDigits([]);
            } else {
                // Update currently locked signal data if available in global results
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

    // Real-Time Feed for Flow Market
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

    // Trigger Logic: Current digit is Trigger [e]
    const triggerDetected = React.useMemo(() => {
        if (!lockedSignal || liveDigits.length < 1) return false;
        return liveDigits[0] === lockedSignal.triggerDigit;
    }, [liveDigits, lockedSignal]);

    // Target Logic: Current digit is Target [t] AND previous digit was Trigger [e]
    const targetHit = React.useMemo(() => {
        if (!lockedSignal || liveDigits.length < 2) return false;
        return liveDigits[0] === lockedSignal.targetDigit && liveDigits[1] === lockedSignal.triggerDigit;
    }, [liveDigits, lockedSignal]);

    const progressValue = (timeRemaining / SIGNAL_LOCK_DURATION) * 100;

    const currentScanMarket = React.useMemo(() => {
        if (!activeScanId) return null;
        return syntheticIndices.find(m => m.id === activeScanId);
    }, [activeScanId]);

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
                                <CardTitle className="text-2xl font-black text-white tracking-tighter uppercase leading-none">PROBABILITY FLOW v8.5+</CardTitle>
                                <CardDescription className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3">SNIPER SURVEILLANCE</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ACTIVE SECTOR: {lockedSignal?.marketName || 'SCANNING...'}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 sm:p-12">
                    <AnimatePresence mode="wait">
                        {!lockedSignal ? (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center justify-center gap-10 text-center">
                                <div className="relative">
                                    <RefreshCw className="h-24 w-24 animate-spin text-primary opacity-20" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Radio className="h-8 w-8 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <div className="space-y-6 max-w-xl w-full">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-white/80">SURVEILLANCE IN PROGRESS</p>
                                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center">
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">SCANNING MARKET</p>
                                            <p className="text-sm font-black text-white truncate w-full">
                                                {currentScanMarket?.name.toUpperCase() || 'INITIALIZING...'}
                                            </p>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center">
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">LIVE PRICE</p>
                                            <p className="text-sm font-black text-emerald-400 tabular-nums">
                                                {globalResults[activeScanId || '']?.currentPrice?.toFixed(globalResults[activeScanId || '']?.pip || 2) || '0.00'}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4 mx-auto text-left max-w-sm">
                                        "Global engine is cycling synthetic sectors. Analyzing probability flow vectors to identify a 100+1 stable opportunity."
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key={lockedSignal.marketId} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                                    <div className="lg:col-span-7 space-y-8">
                                        <div className="flex items-center justify-between gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-500/20 rounded-lg"><Lock className="h-4 w-4 text-amber-500" /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">SIGNAL LOCKED</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ROTATION: {Math.ceil(timeRemaining / 1000)}s</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 max-w-[200px] space-y-1.5">
                                                <Progress value={progressValue} className="h-1.5 bg-white/5 [&>div]:bg-amber-500" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="p-8 rounded-[2.5rem] bg-black/60 border border-white/5 shadow-2xl relative group overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">TRIGGER [e]</p>
                                                    <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest">GATEKEEPER</Badge>
                                                </div>
                                                <div className="flex items-baseline gap-4">
                                                    <span className={cn(
                                                        "text-7xl font-black transition-all duration-300 tabular-nums tracking-tighter",
                                                        triggerDetected ? "text-emerald-400 scale-110" : "text-white"
                                                    )}>{lockedSignal.triggerDigit}</span>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">IMBALANCE</p>
                                                        <p className="text-sm font-black text-white/40">{lockedSignal.flowScore.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 rounded-[2.5rem] bg-black/60 border border-white/5 shadow-2xl relative group overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">TARGET [t]</p>
                                                    <Badge className="bg-emerald-500/20 text-emerald-500 border-none text-[8px] font-black uppercase tracking-widest">DOMINANT</Badge>
                                                </div>
                                                <div className="flex items-baseline gap-4">
                                                    <span className={cn(
                                                        "text-7xl font-black transition-all duration-300 tabular-nums tracking-tighter",
                                                        targetHit ? "text-emerald-400 scale-125" : "text-white"
                                                    )}>{lockedSignal.targetDigit}</span>
                                                    <div className="space-y-1">
                                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">PRESSURE</p>
                                                        <p className="text-sm font-black text-emerald-500/40">{(lockedSignal.confidence / 10).toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500",
                                            triggerDetected ? "bg-emerald-500/20 border-emerald-500 shadow-emerald-500/20" : "bg-white/5 border-white/5"
                                        )}>
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn("p-4 rounded-2xl", triggerDetected ? "bg-emerald-500" : "bg-white/10")}>
                                                        {triggerDetected ? <Zap className="h-8 w-8 text-white animate-pulse" /> : <Target className="h-8 w-8 text-white/20" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-white uppercase tracking-[0.4em]">EXECUTION GATE</p>
                                                        <h4 className="text-2xl font-black text-white uppercase mt-1">
                                                            {targetHit ? "TARGET HIT" : triggerDetected ? "TRIGGER ACTIVE" : "AWAITING TRIGGER"}
                                                        </h4>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">LIVE PRICE</p>
                                                    <p className="text-lg font-black text-white tabular-nums tracking-tighter leading-none">
                                                        {(livePrice || lockedSignal.currentPrice).toFixed(livePip || lockedSignal.pip)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.5em]">TICK STREAM</p>
                                                    <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                         <span className="text-[9px] font-black text-white uppercase tracking-widest">REAL-TIME SYNC</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2.5 justify-start overflow-hidden h-14 items-center">
                                                    {liveDigits.map((digit, idx) => {
                                                        const isTrigger = digit === lockedSignal.triggerDigit;
                                                        const isTarget = digit === lockedSignal.targetDigit;
                                                        const isSuccessFlow = isTarget && liveDigits[idx + 1] === lockedSignal.triggerDigit;
                                                        
                                                        return (
                                                            <div key={`${idx}-${digit}`} className={cn(
                                                                "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border transition-all shrink-0",
                                                                isTrigger ? "bg-primary/90 border-primary text-white shadow-xl scale-110 z-10" : 
                                                                isSuccessFlow ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-125 z-20" :
                                                                isTarget ? "bg-white/10 border-emerald-500/30 text-emerald-500/60" :
                                                                "bg-white/5 border-white/10 text-white/20"
                                                            )}>
                                                                {digit}
                                                            </div>
                                                        );
                                                    })}
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
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">FLOW SCORE</p>
                                                        <p className="text-sm font-black text-emerald-400 tabular-nums">{lockedSignal.flowScore.toFixed(2)}</p>
                                                    </div>
                                                    <Progress value={Math.min(100, (lockedSignal.flowScore + 2) * 25)} className="h-2 bg-white/5 [&>div]:bg-emerald-500" />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <div className="flex justify-between px-1">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">CONCENTRATION (CI)</p>
                                                        <p className="text-sm font-black text-blue-400 tabular-nums">{lockedSignal.ci.toFixed(1)}</p>
                                                    </div>
                                                    <Progress value={Math.min(100, (lockedSignal.ci / 250) * 100)} className="h-2 bg-white/5 [&>div]:bg-blue-500" />
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
                                                    "Trigger on <span className="text-primary">{lockedSignal.triggerDigit}</span>, trade toward <span className="text-emerald-500">{lockedSignal.targetDigit}</span> on next tick. Sequential confirmation enforced. Re-entry permitted only after trigger manifestation."
                                                </p>
                                            </div>
                                        </Card>
                                        
                                        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Layers className="h-5 w-5 text-primary" />
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">FLOW CONFIDENCE</p>
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
