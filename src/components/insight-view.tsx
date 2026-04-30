
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Zap, Activity, ShieldCheck, RefreshCw, Target, Flame, TrendingUp, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalAnalysisResult } from './dashboard';

interface InsightViewProps {
    globalResults: Record<string, GlobalAnalysisResult>;
    activeScanId: string | null;
}

export function InsightView({ globalResults, activeScanId }: InsightViewProps) {
    // Sniper Step 5: Select ONLY the single best market globally
    const topSniperMatch = React.useMemo(() => {
        return Object.values(globalResults)
            .filter(r => r.tradeType === 'MATCHES' && r.entryDigit !== null)
            .sort((a, b) => b.marketScore - a.marketScore)[0];
    }, [globalResults]);

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
                                <CardTitle className="text-2xl font-black text-white tracking-tighter uppercase leading-none">SNIPER MATCHES ENGINE</CardTitle>
                                <CardDescription className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-3">ZERO-ERROR GLOBAL SURVEILLANCE</CardDescription>
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
                        {!topSniperMatch ? (
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
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">REJECTING LOW-PROBABILITY VECTORS...</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={topSniperMatch.marketId} 
                                initial={{ opacity: 0, scale: 0.98, y: 30 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="max-w-5xl mx-auto"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-2 h-16 bg-emerald-500 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.9)]" />
                                            <div>
                                                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">ELITE MARKET IDENTIFIED</p>
                                                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase leading-none">{topSniperMatch.marketName}</h2>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5 shadow-2xl group hover:border-primary/20 transition-all duration-500">
                                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-3">TRIGGER DIGIT</p>
                                                <div className="flex items-baseline gap-4">
                                                    <span className="text-6xl font-black text-white tabular-nums group-hover:text-primary transition-colors">{topSniperMatch.entryDigit}</span>
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[9px] font-black uppercase px-3 py-1">STABLE CLUSTER</Badge>
                                                </div>
                                            </div>
                                            <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5 shadow-2xl">
                                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-3">MARKET SCORE</p>
                                                <div className="flex items-baseline gap-4">
                                                    <span className="text-6xl font-black text-white tabular-nums">{(topSniperMatch.marketScore * 10).toFixed(1)}</span>
                                                    <span className="text-xs text-muted-foreground font-black uppercase">UNITS</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-emerald-500/20 rounded-[2.5rem] border border-emerald-500/40 shadow-2xl shadow-emerald-500/10 flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg">
                                                    <Target className="h-8 w-8 text-white animate-pulse" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white uppercase tracking-widest">TACTICAL COMMAND</p>
                                                    <p className="text-2xl font-black text-white uppercase mt-1">WAIT FOR TRIGGER: {topSniperMatch.entryDigit}</p>
                                                </div>
                                            </div>
                                            <Zap className="h-8 w-8 text-emerald-400 opacity-30 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <Card className="bg-black/40 border-white/5 p-8 rounded-[2.5rem] shadow-inner">
                                            <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
                                                <ShieldCheck className="h-5 w-5" /> // SNIPER ANALYSIS
                                            </h4>
                                            <div className="space-y-6">
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between items-end px-1">
                                                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">CONFIDENCE INDEX</p>
                                                        <p className="text-lg font-black text-emerald-400 tabular-nums">{topSniperMatch.confidence.toFixed(1)}%</p>
                                                    </div>
                                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                        <motion.div 
                                                            initial={{ width: 0 }} 
                                                            animate={{ width: `${topSniperMatch.confidence}%` }} 
                                                            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                    <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2">EXECUTION RULE</p>
                                                    <p className="text-[10px] font-bold text-white uppercase leading-relaxed">
                                                        "Trade on first appearance of {topSniperMatch.entryDigit}, re-enter only after {topSniperMatch.entryDigit} repeats consecutively."
                                                    </p>
                                                </div>
                                                <p className="text-[13px] font-medium text-foreground leading-relaxed italic border-l-4 border-emerald-500/40 pl-6 py-1">
                                                    "Sniper model identifies optimal structural flow in {topSniperMatch.marketName}. Digit {topSniperMatch.entryDigit} selected via multi-factor cluster analysis. Enter MATCHES exclusively upon manifestation."
                                                </p>
                                            </div>
                                        </Card>

                                        <div className="flex items-center justify-between p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/20">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                                                </div>
                                                <p className="text-[11px] font-black text-white uppercase tracking-widest">ELITE MATCHES VECTOR ACTIVE</p>
                                            </div>
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] px-6 py-1.5 uppercase tracking-tighter">ULTRA-STABLE</Badge>
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
                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.5em] mb-5 flex items-center gap-3"><Activity className="h-5 w-5" /> // SNIPER PROTOCOL</h4>
                    <p className="text-[12px] font-medium text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-5">
                        "The Sniper Model filters out noise by analyzing global market scores (Direction, Concentration, Stability). Only the absolute highest probability setup is displayed, ensuring tactical focus remains on zero-error environments."
                    </p>
                </Card>
                <Card className="bg-slate-900/40 backdrop-blur-3xl border-white/5 p-8 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Zap className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-widest">AUTONOMOUS FLOW</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1.5 tracking-widest">REAL-TIME GLOBAL TACTICAL HUD</p>
                        </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] px-5 py-2 uppercase tracking-tighter">LIVE FEED ACTIVE</Badge>
                </Card>
            </div>
        </div>
    );
}
