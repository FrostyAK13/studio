
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Zap, Activity, History, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalAnalysisResult } from './dashboard';

interface InsightViewProps {
    globalResults: Record<string, GlobalAnalysisResult>;
    activeScanId: string | null;
}

export function InsightView({ globalResults, activeScanId }: InsightViewProps) {
    const sortedResults = Object.values(globalResults).sort((a, b) => {
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
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] tracking-widest px-4 uppercase">ENGINE SYNC: {activeScanId || 'IDLE'}</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {sortedResults.map((res) => (
                                <motion.div key={res.marketId} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
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
                                                </div>
                                                <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                                                    <p className="text-[6px] font-black text-muted-foreground uppercase mb-1">REP RATE</p>
                                                    <p className="text-sm font-black text-white tabular-nums">{(res.rp * 100).toFixed(1)}%</p>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "p-3 rounded-xl border flex items-center justify-between transition-all duration-500",
                                                res.canExecute ? "bg-primary/20 border-primary animate-pulse" : "bg-muted/10 border-white/5"
                                            )}>
                                                <div className="flex items-center gap-2">
                                                    {res.canExecute ? <Zap className="h-3 w-3 text-white" /> : <Activity className="h-3 w-3 text-muted-foreground/30" />}
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", res.canExecute ? "text-white" : "text-muted-foreground")}>{res.entryCondition}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {sortedResults.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center gap-6 opacity-20 text-center">
                            <RefreshCw className="h-16 w-16 animate-spin text-primary" />
                            <p className="text-sm font-black uppercase tracking-[0.5em]">INITIALIZING BACKGROUND SURVEILLANCE...</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/40 border-white/5 p-6 rounded-[2rem]">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> // REPETITION PROTOCOL</h4>
                    <p className="text-[11px] font-medium text-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4">
                        "Surveillance monitors behavioral echoes in the background. CI and RP synchronization identifies zero-error repetition gates autonomously across all markets."
                    </p>
                </Card>
                <Card className="bg-card/40 border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20"><History className="h-5 w-5 text-emerald-500" /></div>
                        <div><p className="text-[10px] font-black text-white uppercase tracking-widest">NETWORK LATENCY</p><p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">OPTIMIZED FOR ZERO-ERROR EXECUTION</p></div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[9px] px-4">ULTRA-STABLE</Badge>
                </Card>
            </div>
        </div>
    );
}

