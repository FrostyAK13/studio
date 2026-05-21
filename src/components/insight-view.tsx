
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

const SIGNAL_LOCK_DURATION = 60000; 

export function InsightView({ globalResults, activeScanId, dashboardPrice, dashboardMarketId }: InsightViewProps) {
    const [livePrice, setLivePrice] = React.useState<number>(0);
    const [liveDigits, setLiveDigits] = React.useState<number[]>([]);
    const [livePip, setLivePip] = React.useState<number>(2);
    
    const [lockedSignal, setLockedSignal] = React.useState<GlobalAnalysisResult | null>(null);
    const [lockTimestamp, setLockTimestamp] = React.useState<number>(0);
    const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
    const [lastMarketId, setLastMarketId] = React.useState<string | null>(null);

    React.useEffect(() => {
        const now = Date.now();
        const sortedMatches = Object.values(globalResults)
            .filter(r => r.tradeType === 'FLOW' && r.triggerDigit !== null && r.targetDigit !== null)
            .sort((a, b) => b.confidence - a.confidence);

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

    React.useEffect(() => {
        if (!lockTimestamp) return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - lockTimestamp;
            setTimeRemaining(Math.max(0, SIGNAL_LOCK_DURATION - elapsed));
        }, 100);
        return () => clearInterval(interval);
    }, [lockTimestamp]);

    const targetMarketId = lockedSignal?.marketId;

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

    const triggerDetected = React.useMemo(() => {
        if (!lockedSignal || liveDigits.length < 1) return false;
        return liveDigits[0] === lockedSignal.triggerDigit;
    }, [liveDigits, lockedSignal]);

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
            <Card className="border-none shadow-2xl bg-card rounded-3xl border border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-accent to-primary" />
                <CardHeader className="pb-4 pt-10 px-8 border-b border-primary/5 bg-muted/30">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                                <Crosshair className="h-7 w-7 text-primary animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-foreground uppercase leading-none tracking-tighter">PROBABILITY FLOW</CardTitle>
                                <CardDescription className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3">SNIPER</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                    {lockedSignal ? `SECTOR: ${lockedSignal.marketName}` : 'SURVEILLANCE'}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 sm:p-12">
                    <AnimatePresence mode="wait">
                        {!lockedSignal ? (
                            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center justify-center gap-10 text-center">
                                <RefreshCw className="h-24 w-24 animate-spin text-primary opacity-20" />
                                <div className="space-y-6 max-w-xl w-full">
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black uppercase tracking-[0.6em] text-foreground/80">SCANNING GLOBAL MARKETS</p>
                                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-muted/30 border border-primary/10 p-4 rounded-2xl flex flex-col items-center justify-center">
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">MARKET</p>
                                            <p className="text-sm font-black text-foreground truncate w-full uppercase">{currentScanMarket?.name || 'INITIALIZING...'}</p>
                                        </div>
                                        <div className="bg-muted/30 border border-primary/10 p-4 rounded-2xl flex flex-col items-center justify-center">
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">PRICE</p>
                                            <p className="text-sm font-black text-emerald-600 tabular-nums">{globalResults[activeScanId || '']?.currentPrice?.toFixed(globalResults[activeScanId || '']?.pip || 2) || 'SYNCING'}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key={lockedSignal.marketId} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                                    <div className="lg:col-span-7 space-y-8">
                                        <div className="flex items-center justify-between gap-4 bg-muted/20 p-4 rounded-2xl border border-primary/10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/20 rounded-lg"><Lock className="h-4 w-4 text-primary" /></div>
                                                <div>
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">SIGNAL LOCK</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ROTATION: {Math.ceil(timeRemaining / 1000)}s</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 max-w-[200px] space-y-1.5">
                                                <Progress value={progressValue} className="h-1.5 bg-muted [&>div]:bg-primary" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="p-8 rounded-[2rem] bg-muted/30 border border-primary/10 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">TRIGGER [e]</p>
                                                <div className="flex items-baseline gap-4">
                                                    <span className={cn("text-7xl font-black tabular-nums transition-all", triggerDetected ? "text-emerald-600 scale-110" : "text-foreground")}>{lockedSignal.triggerDigit}</span>
                                                </div>
                                            </div>
                                            <div className="p-8 rounded-[2rem] bg-muted/30 border border-primary/10 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-4">TARGET [t]</p>
                                                <div className="flex items-baseline gap-4">
                                                    <span className={cn("text-7xl font-black tabular-nums transition-all", targetHit ? "text-emerald-600 scale-125" : "text-foreground")}>{lockedSignal.targetDigit}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn("p-8 rounded-[2rem] border shadow-xl transition-all duration-500", triggerDetected ? "bg-emerald-50 border-emerald-500 shadow-emerald-500/10" : "bg-muted/10 border-primary/10")}>
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn("p-4 rounded-xl", triggerDetected ? "bg-emerald-500" : "bg-muted")}>
                                                        {triggerDetected ? <Zap className="h-8 w-8 text-white animate-pulse" /> : <Target className="h-8 w-8 text-foreground/20" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-foreground uppercase tracking-[0.4em]">EXECUTION</p>
                                                        <h4 className="text-2xl font-black text-foreground uppercase mt-1">{targetHit ? "SEQUENCE MATCH" : triggerDetected ? "AWAITING TARGET" : "AWAITING TRIGGER"}</h4>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] mb-1">LIVE PRICE</p>
                                                    <p className="text-xl font-black text-foreground tabular-nums tracking-tighter">{(livePrice || lockedSignal.currentPrice).toFixed(livePip || lockedSignal.pip)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between px-2">
                                                    <p className="text-[8px] font-black text-foreground/40 uppercase tracking-[0.5em]">TICKS</p>
                                                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full border border-primary/10">
                                                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                         <span className="text-[9px] font-black text-foreground uppercase tracking-widest">LIVE SYNC</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2.5 justify-start overflow-hidden h-14 items-center">
                                                    {liveDigits.map((digit, idx) => {
                                                        const isTrigger = digit === lockedSignal.triggerDigit;
                                                        const isTarget = digit === lockedSignal.targetDigit;
                                                        const isFlowSuccess = isTarget && liveDigits[idx + 1] === lockedSignal.triggerDigit;
                                                        return (
                                                            <div key={`${idx}-${digit}`} className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border transition-all shrink-0", isTrigger ? "bg-primary border-primary text-white scale-110 z-10" : isFlowSuccess ? "bg-emerald-500 border-emerald-500 text-white scale-125 z-20" : "bg-muted border-primary/10 text-foreground/20")}>{digit}</div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-5 space-y-6">
                                        <Card className="bg-muted/20 border-primary/10 p-8 rounded-[2rem] space-y-8 shadow-sm">
                                            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.5em] flex items-center gap-3"><Cpu className="h-5 w-5" /> ANALYSIS</h4>
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between px-1">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">FLOW SCORE</p>
                                                        <p className="text-sm font-black text-emerald-600 tabular-nums">{lockedSignal.flowScore.toFixed(2)}</p>
                                                    </div>
                                                    <Progress value={Math.min(100, (lockedSignal.flowScore + 2) * 25)} className="h-2 bg-muted [&>div]:bg-emerald-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between px-1">
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">STABILITY</p>
                                                        <p className="text-sm font-black text-primary tabular-nums">{lockedSignal.ss.toFixed(2)}</p>
                                                    </div>
                                                    <Progress value={lockedSignal.ss * 100} className="h-2 bg-muted [&>div]:bg-primary" />
                                                </div>
                                            </div>
                                            <div className="p-6 bg-card rounded-3xl border border-primary/10 shadow-sm">
                                                <p className="text-[10px] font-bold text-foreground/80 leading-relaxed italic uppercase">"TRIGGER ON <span className="text-primary">{lockedSignal.triggerDigit}</span>, TRADE TOWARD <span className="text-emerald-600">{lockedSignal.targetDigit}</span> ON NEXT TICK."</p>
                                            </div>
                                        </Card>
                                        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <Layers className="h-5 w-5 text-primary" />
                                                <p className="text-[10px] font-black text-foreground uppercase tracking-widest">CONFIDENCE</p>
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
