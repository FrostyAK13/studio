
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Zap, Activity, ShieldCheck, RefreshCw, Target, TrendingUp, Crosshair, Wallet, Lock, Timer, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalAnalysisResult } from './dashboard';
import { Progress } from '@/components/ui/progress';

interface InsightViewProps {
    globalResults: Record<string, GlobalAnalysisResult>;
    activeScanId: string | null;
    dashboardPrice: number;
    dashboardMarketId: string;
}

const SIGNAL_LOCK_DURATION = 60000; // 1 minute lock-on duration as requested

export function InsightView({ globalResults, activeScanId, dashboardPrice, dashboardMarketId }: InsightViewProps) {
    const [livePrice, setLivePrice] = React.useState<number>(0);
    const [liveDigits, setLiveDigits] = React.useState<number[]>([]);
    const [livePip, setLivePip] = React.useState<number>(2);
    
    // Signal Lock States
    const [lockedSignal, setLockedSignal] = React.useState<GlobalAnalysisResult | null>(null);
    const [lockTimestamp, setLockTimestamp] = React.useState<number>(0);
    const [timeRemaining, setTimeRemaining] = React.useState<number>(0);
    const [lastMarketId, setLastMarketId] = React.useState<string | null>(null);

    // Sniper Step: Global Best Market Selection with Lock-in and Rotation Logic
    React.useEffect(() => {
        const now = Date.now();
        const sortedMatches = Object.values(globalResults)
            .filter(r => r.tradeType === 'MATCHES' && r.entryDigit !== null && r.targetDigit !== null)
            .sort((a, b) => b.marketScore - a.marketScore);

        if (!lockedSignal) {
            // Pick the best market that isn't the one we just finished with (rotation)
            const bestGlobal = sortedMatches.find(r => r.marketId !== lastMarketId) || sortedMatches[0];
            
            if (bestGlobal) {
                setLockedSignal(bestGlobal);
                setLockTimestamp(now);
                setLastMarketId(bestGlobal.marketId);
            }
        } else {
            const elapsed = now - lockTimestamp;
            
            // If lock expired, clear current to trigger rotation on next tick
            if (elapsed >= SIGNAL_LOCK_DURATION) {
                setLockedSignal(null);
                setLivePrice(0);
                setLiveDigits([]);
            } else {
                // Keep the current locked signal updated with live score/data if still valid
                const updatedData = globalResults[lockedSignal.marketId];
                if (updatedData) {
                    setLockedSignal(updatedData);
                }
            }
        }
    }, [globalResults, lockedSignal, lockTimestamp, lastMarketId]);

    // Timer Update Effect
    React.useEffect(() => {
        if (!lockTimestamp) return;

        const interval = setInterval(() => {
            const elapsed = Date.now() - lockTimestamp;
            const remaining = Math.max(0, SIGNAL_LOCK_DURATION - elapsed);
            setTimeRemaining(remaining);
        }, 100);

        return () => clearInterval(interval);
    }, [lockTimestamp]);

    const targetMarketId = lockedSignal?.marketId;

    // Independent Real-Time Subscription for the Locked Sniper Market
    React.useEffect(() => {
        if (!targetMarketId) return;

        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');
        
        ws.onopen = () => {
            ws.send(JSON.stringify({
                "ticks": targetMarketId,
                "subscribe": 1
            }));
        };

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

        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [targetMarketId]);

    const progressValue = (timeRemaining / SIGNAL_LOCK_DURATION) * 100;

    // Sequential Trigger Logic: Has the trigger appeared in the latest tick?
    const isTriggerActive = liveDigits.length > 0 && liveDigits[0] === lockedSignal?.entryDigit;

    return (
        <div className="space-y-6 animate-in fade-in duration-1000 pb-24 max-w-[1600px] mx-auto px-2">
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-emerald-400 to-primary" />
                <CardHeader className="pb-4 pt-10 px-8 text-center sm:text-left border-b border-white/5 bg-black/40">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-primary/20 rounded-3xl border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                                <Crosshair className="h-7 w-7 text-primary animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-white tracking-tighter uppercase leading-none">PROBABILITY FLOW SNIPER</CardTitle>
                                <CardDescription className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3">TRIGGER-FIRST FLOW PROTOCOL</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">GLOBAL SYNC: {activeScanId || 'IDLE'}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 sm:p-12">
                    <AnimatePresence mode="wait">
                        {!lockedSignal ? (
                            <motion.div 
                                key="idle" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 0.6 }} 
                                exit={{ opacity: 0 }}
                                className="py-32 flex flex-col items-center justify-center gap-8 text-center"
                            >
                                <div className="relative">
                                    <RefreshCw className="h-20 w-20 animate-spin text-primary opacity-20" />
                                    <Search className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-black uppercase tracking-[0.6em] text-white">SCANNING GLOBAL SECTORS</p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">ROTATING MARKET VECTORS...</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={lockedSignal.marketId} 
                                initial={{ opacity: 0, scale: 0.98, y: 30 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="max-w-5xl mx-auto"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between gap-4 bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                                    <Lock className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">SIGNAL LOCKED</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">ROTATING IN {Math.ceil(timeRemaining / 1000)}S</p>
                                                </div>
                                            </div>
                                            <div className="flex-1 max-w-[150px] space-y-1.5">
                                                <div className="flex justify-between items-center text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                                                    <span>STABILITY</span>
                                                    <span>{Math.ceil(progressValue)}%</span>
                                                </div>
                                                <Progress value={progressValue} className="h-1.5 bg-white/5 [&>div]:bg-amber-500" />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-5">
                                            <div className="w-2 h-16 bg-emerald-500 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.9)]" />
                                            <div>
                                                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">OPTIMAL FLOW IDENTIFIED</p>
                                                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-none">{lockedSignal.marketName}</h2>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className={cn(
                                                "p-6 rounded-[2rem] border transition-all duration-500 shadow-2xl group",
                                                isTriggerActive ? "bg-amber-500 border-amber-400" : "bg-black/60 border-white/5 hover:border-primary/20"
                                            )}>
                                                <p className={cn("text-[9px] font-black uppercase tracking-[0.4em] mb-3", isTriggerActive ? "text-white" : "text-primary")}>TRIGGER DIGIT (e)</p>
                                                <div className="flex items-baseline gap-4">
                                                    <span className={cn("text-6xl font-black tabular-nums transition-colors", isTriggerActive ? "text-white" : "text-white group-hover:text-amber-500")}>{lockedSignal.entryDigit}</span>
                                                    <Badge className={cn("border-none text-[9px] font-black uppercase px-3 py-1", isTriggerActive ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-400")}>
                                                        {isTriggerActive ? "SIGNAL ACTIVE" : "AWAITING ZONE"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5 shadow-2xl group hover:border-primary/20 transition-all duration-500">
                                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-3">TARGET DIGIT (t)</p>
                                                <div className="flex items-baseline gap-4">
                                                    <span className="text-6xl font-black text-white tabular-nums group-hover:text-emerald-400 transition-colors">{lockedSignal.targetDigit}</span>
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[9px] font-black uppercase px-3 py-1">STRENGTH ZONE</Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn(
                                            "p-8 rounded-[2.5rem] border shadow-2xl transition-all duration-500 flex flex-col gap-6 group",
                                            isTriggerActive 
                                                ? "bg-emerald-500/20 border-emerald-500/60 shadow-emerald-500/20" 
                                                : "bg-white/5 border-white/5 opacity-80"
                                        )}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn(
                                                        "p-3 rounded-2xl transition-all duration-500 shadow-lg",
                                                        isTriggerActive ? "bg-emerald-500" : "bg-white/10"
                                                    )}>
                                                        <Target className={cn("h-8 w-8 text-white", isTriggerActive && "animate-pulse")} />
                                                    </div>
                                                    <div>
                                                        <p className={cn("text-[11px] font-black uppercase tracking-widest", isTriggerActive ? "text-white" : "text-white/40")}>TACTICAL COMMAND</p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-2xl font-black text-white uppercase">{lockedSignal.entryDigit}</span>
                                                            <ArrowRight className={cn("h-5 w-5", isTriggerActive ? "text-emerald-400" : "text-white/20")} />
                                                            <span className="text-2xl font-black text-white uppercase">{lockedSignal.targetDigit}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isTriggerActive ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-pulse">EXECUTE NOW</span>
                                                        <Zap className="h-6 w-6 text-emerald-400 mt-1" />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 opacity-30">
                                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">AWAITING TRIGGER</span>
                                                        <Timer className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">LIVE DIGIT STREAM</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[8px] font-black text-white uppercase tracking-widest leading-none">LIVE PRICE:</p>
                                                        <span className="text-[10px] font-black text-emerald-400 tabular-nums">{livePrice.toFixed(livePip)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 justify-start overflow-hidden h-12 items-center">
                                                    {liveDigits.map((digit, idx) => {
                                                        const isTriggerMark = digit === lockedSignal?.entryDigit;
                                                        // Highlight Target ONLY if preceded by Trigger immediately
                                                        const isTargetMark = digit === lockedSignal?.targetDigit && 
                                                                           idx < liveDigits.length - 1 && 
                                                                           liveDigits[idx + 1] === lockedSignal?.entryDigit;

                                                        return (
                                                            <motion.div
                                                                key={`${digit}-${idx}-${livePrice}`}
                                                                initial={{ scale: 0.8, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border transition-all shrink-0",
                                                                    isTriggerMark 
                                                                        ? "bg-amber-500 border-amber-500 text-white shadow-lg ring-2 ring-amber-500 ring-offset-2 ring-offset-slate-900" 
                                                                        : isTargetMark
                                                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-lg ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-900 animate-pulse"
                                                                        : "bg-white/5 border-white/10 text-white/60"
                                                                )}
                                                            >
                                                                {digit}
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <Card className="bg-black/40 border-white/5 p-8 rounded-[2.5rem] shadow-inner">
                                            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
                                                <ShieldCheck className="h-5 w-5" /> // FLOW ANALYSIS
                                            </h4>
                                            <div className="space-y-6">
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between items-end px-1">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">CONFIDENCE INDEX</p>
                                                        <p className="text-lg font-black text-emerald-400 tabular-nums">{lockedSignal.confidence.toFixed(1)}%</p>
                                                    </div>
                                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                        <motion.div 
                                                            initial={{ width: 0 }} 
                                                            animate={{ width: `${lockedSignal.confidence}%` }} 
                                                            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <AlertCircle className="h-3 w-3 text-amber-500" />
                                                        <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">SEQUENTIAL EXECUTION</p>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-white uppercase leading-relaxed">
                                                        "Protocol requires trigger {lockedSignal.entryDigit} to precede target {lockedSignal.targetDigit}. Target is highlighted immediately upon valid sequence detection. Market rotates every 60 seconds to maintain high-density probability edges."
                                                    </p>
                                                </div>
                                                <p className="text-[13px] font-medium text-foreground leading-relaxed italic border-l-4 border-emerald-500/40 pl-6 py-1">
                                                    "Current vector identified in {lockedSignal.marketName}. Sniper engine is locked for 1 minute before forcing a rotation to the next highest-probability global sector."
                                                </p>
                                            </div>
                                        </Card>

                                        <div className="flex items-center justify-between p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/20">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                                </div>
                                                <p className="text-[11px] font-black text-white uppercase tracking-widest">FLOW VECTOR ACTIVE</p>
                                            </div>
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] px-5 py-2 uppercase tracking-tighter">SURVEILLANCE LIVE</Badge>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-900/40 backdrop-blur-3xl border-white/5 p-8 rounded-[2rem]">
                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-5 flex items-center gap-3"><Activity className="h-5 w-5" /> // ROTATION PROTOCOL</h4>
                    <p className="text-[12px] font-medium text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-5">
                        "Markets are locked for 60-second intervals to allow manual setup. After each lock expires, the engine rotates to a different high-probability sector, ensuring a constant stream of fresh, zero-error tactical vectors."
                    </p>
                </Card>
                <Card className="bg-slate-900/40 backdrop-blur-3xl border-white/5 p-8 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Zap className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">AUTONOMOUS SNIPER</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1.5 tracking-widest">MARKET ROTATION ACTIVE</p>
                        </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] px-5 py-2 uppercase tracking-tighter">ZERO-ERROR SYNC</Badge>
                </Card>
            </div>
        </div>
    );
}

