'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Network, Activity, Flame, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalAnalysisResult } from './dashboard';

interface GlobalMarketScannerProps {
    onMarketSelect: (marketId: string) => void;
    selectedMarket: string;
    lastDigitTicks?: number[];
    price: number;
    decimalPlaces: number;
    globalResults: Record<string, GlobalAnalysisResult>;
    activeScanId: string | null;
}

export function GlobalMarketScanner({ 
    onMarketSelect, 
    selectedMarket, 
    price, 
    decimalPlaces, 
    globalResults,
    activeScanId 
}: GlobalMarketScannerProps) {
    const bestOpportunity = React.useMemo(() => {
        return Object.values(globalResults)
            .filter(r => r.scannerStrategy !== 'NONE' && r.scannerEntry !== null)
            .sort((a, b) => b.scannerConfidence - a.scannerConfidence)[0];
    }, [globalResults]);

    const isMarketActive = bestOpportunity?.marketId === selectedMarket;

    return (
        <div className="space-y-4 animate-in fade-in duration-700 pb-24">
            <Card className="border-none shadow-sm bg-card overflow-hidden relative rounded-xl border border-border">
                <CardHeader className="text-center pt-8 px-4">
                    <div className="flex flex-col items-center gap-3">
                        <Network className="h-8 w-8 text-primary animate-pulse" />
                        <CardTitle className="text-[12px] font-black uppercase tracking-[0.5em] text-foreground">SCANNER</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                    <div className="relative min-h-[300px] flex flex-col items-center justify-center bg-muted/20 rounded-[2rem] border border-border shadow-inner p-6">
                        <AnimatePresence mode="wait">
                            {!bestOpportunity ? (
                                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4">
                                    <div className="flex items-center gap-3 bg-primary/10 px-6 py-2 rounded-full border border-primary/20">
                                        <Activity className="h-4 w-4 text-primary animate-spin" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">SURVEILLANCE ACTIVE</span>
                                    </div>
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">SYNCING GLOBAL VECTORS: {activeScanId}</p>
                                </motion.div>
                            ) : (
                                <motion.div key="results" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                        <Card className="bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">MARKET</p>
                                            <p className="text-[11px] font-black text-foreground leading-tight uppercase truncate">{bestOpportunity.marketName}</p>
                                        </Card>
                                        <Card className="bg-primary/5 border-primary/20 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1.5">STRATEGY</p>
                                            <p className="text-[11px] font-black text-foreground leading-tight uppercase">{bestOpportunity.scannerStrategy}</p>
                                        </Card>
                                        <Card className="bg-blue-50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5">LIVE PRICE</p>
                                            <p className="text-[11px] font-black text-foreground tabular-nums uppercase">
                                                {isMarketActive ? price.toFixed(decimalPlaces) : "IDLE"}
                                            </p>
                                        </Card>
                                        <Card className="bg-cyan-50 dark:bg-cyan-950/10 border-cyan-200 dark:border-cyan-900 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-cyan-600 uppercase tracking-widest mb-1.5">SIGNAL</p>
                                            <p className="text-[11px] font-black text-foreground">{bestOpportunity.scannerEntry}</p>
                                        </Card>
                                        <Card className="bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900 p-4 rounded-2xl">
                                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1.5">STABILITY</p>
                                            <p className="text-[11px] font-black text-foreground tabular-nums uppercase">{bestOpportunity.scannerConfidence.toFixed(1)}%</p>
                                        </Card>
                                    </div>

                                    <div className="flex flex-col items-center gap-4 py-4">
                                        {!isMarketActive ? (
                                            <>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <Zap className="h-4 w-4 text-amber-500" /> TOP-TIER OPPORTUNITY IDENTIFIED
                                                </p>
                                                <Button onClick={() => onMarketSelect(bestOpportunity.marketId)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-widest h-14 px-12 rounded-full shadow-2xl active:scale-95 transition-all">
                                                    ACTIVATE {bestOpportunity.marketName.toUpperCase()} <ArrowRight className="ml-3 h-5 w-5" />
                                                </Button>
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-3 bg-emerald-500/10 px-8 py-3 rounded-full border border-emerald-500 text-emerald-600">
                                                <Zap className="h-4 w-4 animate-pulse" />
                                                <span className="text-xs font-black uppercase tracking-widest">ACTIVELY MONITORING VECTOR</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 bg-background rounded-[2rem] border border-border shadow-inner">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4" /> // SYNOPSIS
                                        </p>
                                        <p className="text-[11px] sm:text-[13px] font-medium text-foreground leading-relaxed italic">
                                            "Background engine identifies a stable mid-zone flow in {bestOpportunity.marketName}. Correctly positioned for {bestOpportunity.scannerStrategy} payoffs with high structural stability."
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}