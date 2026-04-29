
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, Zap, Activity, Layers, ShieldAlert, Target, RefreshCw, History, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { syntheticIndices } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisResult {
    marketId: string;
    marketName: string;
    ci: number;
    rp: number;
    tradeType: 'MATCHES' | 'DIFFERS' | 'NO TRADE';
    entryCondition: string;
    canExecute: boolean;
    stabilityStatus: string;
    explanation: string;
    lastDigit: number | null;
    status: 'scanning' | 'complete' | 'error';
}

export function InsightView() {
    const [scanResults, setScanResults] = React.useState<Record<string, AnalysisResult>>({});
    const [activeScanId, setActiveScanId] = React.useState<string | null>(null);
    const [progress, setProgress] = React.useState(0);

    const runAnalysis = (ticks: number[]): Omit<AnalysisResult, 'marketId' | 'marketName' | 'status' | 'lastDigit'> => {
        const total = ticks.length || 1;
        const counts = Array(10).fill(0);
        ticks.forEach(d => counts[d]++);
        const P = counts.map(c => (c / total) * 100);
        
        // Step 1: Concentration Index (CI)
        const CI = P.reduce((sum, p) => sum + Math.pow(p - 10, 2), 0);

        // Step 2: Identify dominant digits
        const dominantDigits = P.map((p, i) => p > 10 ? i : null).filter(d => d !== null) as number[];

        // Step 3: Measure repetition pressure (RP)
        let repeatCount = 0;
        for (let i = 0; i < ticks.length - 1; i++) {
            if (ticks[i] === ticks[i + 1]) repeatCount++;
        }
        const RP = (repeatCount / (total - 1)) || 0;

        // Thresholds
        const CI_HIGH = 18;
        const CI_LOW = 10;
        const RP_HIGH = 0.12;
        const RP_LOW = 0.08;

        let tradeType: 'MATCHES' | 'DIFFERS' | 'NO TRADE' = 'NO TRADE';
        if (CI > CI_HIGH && RP > RP_HIGH) tradeType = 'MATCHES';
        else if (CI < CI_LOW && RP < RP_LOW) tradeType = 'DIFFERS';

        const lastDigit = ticks[0];
        let entryCondition = 'AWAITING SIGNAL';
        let canExecute = false;

        if (tradeType === 'MATCHES') {
            const isDominant = P[lastDigit] > 10 && dominantDigits.includes(lastDigit);
            const inRecent = ticks.slice(1, 15).includes(lastDigit);
            if (isDominant && inRecent) {
                entryCondition = `MATCH @ ${lastDigit}`;
                canExecute = true;
            } else {
                entryCondition = 'WAITING REPEAT';
            }
        } else if (tradeType === 'DIFFERS') {
            const isWeak = P[lastDigit] < 10 && !dominantDigits.includes(lastDigit);
            if (isWeak) {
                entryCondition = `DIFF @ ${lastDigit}`;
                canExecute = true;
            } else {
                entryCondition = 'WAITING WEAK';
            }
        }

        const extremeDominant = P.some(p => p > 12.5);
        let stabilityStatus = 'STABLE';
        if (extremeDominant) {
            tradeType = 'NO TRADE';
            stabilityStatus = 'ERRATIC';
        } else if (CI < 5) {
            tradeType = 'NO TRADE';
            stabilityStatus = 'FLAT';
        }

        return {
            ci: CI,
            rp: RP,
            tradeType,
            entryCondition,
            canExecute,
            stabilityStatus,
            explanation: tradeType === 'NO TRADE' ? `Stability Mismatch` : `${tradeType} Protocol Synced`
        };
    };

    React.useEffect(() => {
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');
        let currentIndex = 0;

        const scanNext = () => {
            if (currentIndex >= syntheticIndices.length) {
                currentIndex = 0;
                setTimeout(scanNext, 5000); // Wait 5s before next global loop
                return;
            }

            const market = syntheticIndices[currentIndex];
            setActiveScanId(market.id);
            setProgress(((currentIndex + 1) / syntheticIndices.length) * 100);

            ws.send(JSON.stringify({
                "ticks_history": market.id,
                "count": 200,
                "end": "latest",
                "style": "ticks"
            }));
        };

        ws.onopen = () => scanNext();

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.msg_type === 'history' && data.history) {
                const prices = data.history.prices;
                const marketId = data.echo_req.ticks_history;
                const marketName = syntheticIndices.find(m => m.id === marketId)?.name || marketId;

                const ticks = prices.map((p: number) => {
                    const pStr = p.toFixed(8);
                    const dec = pStr.split('.')[1] || '00';
                    const pip = data.echo_req.pip_size || 2;
                    return parseInt(dec[pip - 1] || '0');
                }).reverse();

                const analysis = runAnalysis(ticks);
                
                setScanResults(prev => ({
                    ...prev,
                    [marketId]: {
                        ...analysis,
                        marketId,
                        marketName,
                        lastDigit: ticks[0],
                        status: 'complete'
                    }
                }));

                currentIndex++;
                setTimeout(scanNext, 200); // 200ms pause between markets
            }
        };

        return () => ws.close();
    }, []);

    const sortedResults = Object.values(scanResults).sort((a, b) => {
        if (a.canExecute && !b.canExecute) return -1;
        if (!a.canExecute && b.canExecute) return 1;
        return 0;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-1000 pb-24 max-w-[1600px] mx-auto px-2">
            <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] border border-white/5 overflow-hidden">
                <CardHeader className="pb-4 pt-8 px-8 text-center sm:text-left border-b border-white/5 bg-black/20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/20 rounded-2xl">
                                <Search className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-white tracking-tight uppercase leading-none">GLOBAL REPETITION SCANNER</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-2">AUTONOMOUS MATCHES/DIFFERS SURVEILLANCE</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] tracking-widest px-4">SCANNING: {activeScanId}</Badge>
                            <div className="w-48 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-primary" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {sortedResults.map((res) => (
                                <motion.div
                                    key={res.marketId}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Card className={cn(
                                        "border-none transition-all duration-500 rounded-[1.5rem] overflow-hidden relative group",
                                        res.canExecute ? "bg-primary/10 border border-primary/30 shadow-xl shadow-primary/5" : "bg-card/40 border border-white/5"
                                    )}>
                                        <div className="p-4 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">MARKET</p>
                                                    <p className="text-[10px] font-black text-white truncate max-w-[120px]">{res.marketName.toUpperCase()}</p>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest border-none px-3",
                                                    res.tradeType === 'MATCHES' ? "bg-emerald-500 text-white" : 
                                                    res.tradeType === 'DIFFERS' ? "bg-cyan-500 text-white" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {res.tradeType}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                                    <p className="text-[6px] font-black text-muted-foreground uppercase mb-1">CI INDEX</p>
                                                    <p className="text-sm font-black text-white tabular-nums">{res.ci.toFixed(1)}</p>
                                                    <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, (res.ci / 30) * 100)}%` }} />
                                                    </div>
                                                </div>
                                                <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                                    <p className="text-[6px] font-black text-muted-foreground uppercase mb-1">REP RATE</p>
                                                    <p className="text-sm font-black text-white tabular-nums">{(res.rp * 100).toFixed(1)}%</p>
                                                    <div className="mt-1.5 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, res.rp * 400)}%` }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "p-3 rounded-xl border flex items-center justify-between transition-all duration-500",
                                                res.canExecute ? "bg-primary/20 border-primary animate-pulse" : "bg-muted/10 border-white/5"
                                            )}>
                                                <div className="flex items-center gap-2">
                                                    {res.canExecute ? <Zap className="h-3 w-3 text-white" /> : <Activity className="h-3 w-3 text-muted-foreground/30" />}
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest",
                                                        res.canExecute ? "text-white" : "text-muted-foreground"
                                                    )}>
                                                        {res.entryCondition}
                                                    </span>
                                                </div>
                                                {res.canExecute && <div className="h-2 w-2 rounded-full bg-white animate-ping" />}
                                            </div>
                                        </div>
                                        {res.canExecute && (
                                            <div className="absolute top-0 left-0 w-full h-[2px] bg-white animate-pulse" />
                                        )}
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {Object.keys(scanResults).length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center gap-6 opacity-20">
                            <RefreshCw className="h-16 w-16 animate-spin text-primary" />
                            <p className="text-sm font-black uppercase tracking-[0.5em]">INITIALIZING GLOBAL SCANNER...</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/40 border-white/5 p-6 rounded-[2rem]">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" /> // REPETITION PROTOCOL
                    </h4>
                    <p className="text-[11px] font-medium text-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4">
                        "Surveillance monitors behavioral echoes across all markets. Tactical locks are only issued when high concentration (CI) synchronizes with active repetition behavior (RP)."
                    </p>
                </Card>
                <Card className="bg-card/40 border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <History className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">NETWORK LATENCY</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">OPTIMIZED FOR ZERO-ERROR EXECUTION</p>
                        </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[9px] px-4">ULTRA-STABLE</Badge>
                </Card>
            </div>
        </div>
    );
}

