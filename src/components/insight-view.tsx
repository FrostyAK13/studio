
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Zap, Activity, ShieldCheck, RefreshCw, Target, Flame, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalAnalysisResult } from './dashboard';

interface InsightViewProps {
    globalResults: Record<string, GlobalAnalysisResult>;
    activeScanId: string | null;
}

export function InsightView({ globalResults, activeScanId }: InsightViewProps) {
    // Find only the SINGLE best Matches opportunity
    const topMatch = React.useMemo(() => {
        return Object.values(globalResults)
            .filter(r => r.tradeType === 'MATCHES' && r.canExecute)
            .sort((a, b) => b.confidence - a.confidence)[0];
    }, [globalResults]);

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
                                <CardTitle className="text-xl font-black text-white tracking-tight uppercase leading-none">SINGLE-DIGIT MATCHES ENGINE</CardTitle>
                                <CardDescription className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-2">ZERO-ERROR REPETITION PROTOCOL</CardDescription>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[10px] tracking-widest px-4 uppercase">ENGINE SYNC: {activeScanId || 'IDLE'}</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <AnimatePresence mode="wait">
                        {!topMatch ? (
                            <motion.div 
                                key="idle" 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 0.4 }} 
                                exit={{ opacity: 0 }}
                                className="py-24 flex flex-col items-center justify-center gap-6 text-center"
                            >
                                <RefreshCw className="h-16 w-16 animate-spin text-primary" />
                                <p className="text-sm font-black uppercase tracking-[0.5em]">SCANNING GLOBAL VECTORS FOR MATCHES...</p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={topMatch.marketId} 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="max-w-4xl mx-auto"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-12 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">OPTIMAL MARKET VECTOR</p>
                                                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase">{topMatch.marketName}</h2>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-black/40 p-5 rounded-[1.5rem] border border-white/5 shadow-inner">
                                                <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-2">TRIGGER DIGIT</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-white tabular-nums">{topMatch.entryDigit}</span>
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-black uppercase">DOMINANT</Badge>
                                                </div>
                                            </div>
                                            <div className="bg-black/40 p-5 rounded-[1.5rem] border border-white/5 shadow-inner">
                                                <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-2">REPETITION PRESSURE</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl font-black text-white tabular-nums">{topMatch.rp.toFixed(0)}</span>
                                                    <span className="text-xs text-muted-foreground font-black uppercase">BARS</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 bg-primary/20 rounded-[2rem] border border-primary/40 shadow-xl shadow-primary/5 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <Target className="h-8 w-8 text-white animate-pulse" />
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">TACTICAL COMMAND</p>
                                                    <p className="text-xl font-black text-white uppercase">TRADE MATCHES @ {topMatch.entryDigit}</p>
                                                </div>
                                            </div>
                                            <Flame className="h-6 w-6 text-white opacity-20 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Card className="bg-black/40 border-white/5 p-6 rounded-[2rem]">
                                            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4" /> // STABILITY ANALYSIS
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-end">
                                                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">CONFIDENCE INDEX</p>
                                                        <p className="text-sm font-black text-emerald-400 tabular-nums">{topMatch.confidence.toFixed(1)}%</p>
                                                    </div>
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }} 
                                                            animate={{ width: `${topMatch.confidence}%` }} 
                                                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-[11px] font-medium text-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4">
                                                    "System identifies a high-concentration repetition cycle in {topMatch.marketName}. Entry is optimal only when trigger digit {topMatch.entryDigit} manifests."
                                                </p>
                                            </div>
                                        </Card>

                                        <div className="flex items-center justify-between p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">REPETITION SKEW DETECTED</p>
                                            </div>
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-black text-[9px] px-4 uppercase">ULTRA-STABLE</Badge>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card/40 border-white/5 p-6 rounded-[2rem]">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> // REPETITION MODEL</h4>
                    <p className="text-[11px] font-medium text-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4">
                        "The Repetition Model measures echo behaviors rather than static frequency. By pre-selecting a trigger digit with high neighbor stability, we filter out noise for high-precision Matches entries."
                    </p>
                </Card>
                <Card className="bg-card/40 border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Zap className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">AUTONOMOUS SYNC</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">REAL-TIME GLOBAL MATCHES SURVEILLANCE</p>
                        </div>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] px-4 uppercase tracking-tighter">LIVE FEED ACTIVE</Badge>
                </Card>
            </div>
        </div>
    );
}
