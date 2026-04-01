
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Activity, Layers, SignalHigh, Hash, Boxes, Timer, BarChart3, Scale, LayoutGrid, Target, ArrowRightLeft, Sparkles, TrendingUp, TrendingDown, Crosshair, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalyzerViewProps {
    price: number;
    lastDigitTicks: number[];
    priceHistory: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    decimalPlaces: number;
    tickTimestamps: number[];
}

export function AnalyzerView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
    tickTimestamps,
}: AnalyzerViewProps) {
    const [tradeType, setTradeType] = React.useState('over-under');
    const [overValue, setOverValue] = React.useState(4);
    const [underValue, setUnderValue] = React.useState(5);
    const [selectedSignalDigit, setSelectedSignalDigit] = React.useState<number | null>(null);

    const stats = React.useMemo(() => {
        const total = lastDigitTicks.length || 1;
        const overCount = lastDigitTicks.filter(d => d > overValue).length;
        const underCount = lastDigitTicks.filter(d => d < underValue).length;
        
        const signalStats = selectedSignalDigit !== null ? {
            count: lastDigitTicks.filter(d => d === selectedSignalDigit).length,
            perc: (lastDigitTicks.filter(d => d === selectedSignalDigit).length / total) * 100
        } : null;

        return {
            overCount,
            underCount,
            overPerc: (overCount / total) * 100,
            underPerc: (underCount / total) * 100,
            signalStats
        };
    }, [lastDigitTicks, overValue, underValue, selectedSignalDigit]);

    const renderPattern = () => {
        const slice = [...lastDigitTicks.slice(0, 24)].reverse();
        return slice.map((digit, i) => {
            const isOver = digit > overValue;
            const isUnder = digit < underValue;
            
            let label = "-";
            let color = "bg-white/5 border-white/10 text-muted-foreground/20";
            
            if (isOver) {
                label = "O";
                color = "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400/50";
            } else if (isUnder) {
                label = "U";
                color = "bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] border-rose-400/50";
            }

            return (
                <motion.div 
                    key={i} 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.02 }}
                    className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-xs sm:text-base border transition-all duration-300 backdrop-blur-md",
                        color
                    )}
                >
                    {label}
                </motion.div>
            );
        });
    };

    return (
        <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
            {/* Top Configuration Grid */}
            <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden border border-white/5">
                <CardContent className="p-8 sm:p-14 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">MARKET VECTOR</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-16 bg-black/50 border-white/10 rounded-[1.5rem] font-black text-sm sm:text-lg shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                                    <SelectValue placeholder="Select Market" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-[1.5rem]">
                                    {syntheticIndices.map(m => (
                                        <SelectItem key={m.id} value={m.id} className="font-bold text-sm sm:text-base">{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">TRADE STRATEGY</Label>
                            <Select value={tradeType} onValueChange={setTradeType}>
                                <SelectTrigger className="h-16 bg-black/50 border-white/10 rounded-[1.5rem] font-black text-sm sm:text-lg shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white rounded-[1.5rem]">
                                    <SelectItem value="over-under" className="font-bold text-sm sm:text-base">Over/Under Engine</SelectItem>
                                    <SelectItem value="even-odd" className="font-bold text-sm sm:text-base">Even/Odd Matrix</SelectItem>
                                    <SelectItem value="matches-differs" className="font-bold text-sm sm:text-base">Matches/Differs Hub</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">OVER BARRIER</Label>
                            <Input 
                                type="number" 
                                value={overValue} 
                                onChange={(e) => setOverValue(parseInt(e.target.value))}
                                className="h-16 bg-black/50 border-white/10 rounded-[1.5rem] font-black text-center text-xl sm:text-2xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">UNDER BARRIER</Label>
                            <Input 
                                type="number" 
                                value={underValue} 
                                onChange={(e) => setUnderValue(parseInt(e.target.value))}
                                className="h-16 bg-black/50 border-white/10 rounded-[1.5rem] font-black text-center text-xl sm:text-2xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                        <div className="space-y-4">
                            <Label className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.4em] text-primary ml-4">DATA HORIZON</Label>
                            <Input 
                                type="number" 
                                value={maxTicks === 0 ? '' : maxTicks} 
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-16 bg-black/50 border-white/10 rounded-[1.5rem] font-black text-center text-xl sm:text-2xl text-primary shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Digit Signal Pop-up Tool */}
            <AnimatePresence>
                {(tradeType === 'over-under' || tradeType === 'matches-differs') && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: 20 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: 20 }}
                        className="overflow-hidden"
                    >
                        <Card className="border-none bg-primary/10 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] border border-primary/20 shadow-2xl">
                            <CardContent className="p-8 sm:p-12">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-16">
                                    <div className="space-y-4 text-center md:text-left">
                                        <h3 className="text-sm sm:text-xl font-black uppercase tracking-[0.5em] text-primary flex items-center gap-3 justify-center md:justify-start">
                                            <Zap className="h-5 w-5 sm:h-7 sm:w-7" /> SIGNAL BARRIER ENGINE
                                        </h3>
                                        <p className="text-[9px] sm:text-[11px] font-black uppercase text-muted-foreground tracking-[0.2em]">SELECT SIGNAL TO TRACK RELATIVE DELTA</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                                        {Array.from({ length: 10 }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedSignalDigit(selectedSignalDigit === i ? null : i)}
                                                className={cn(
                                                    "w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.5rem] font-black text-lg sm:text-2xl transition-all duration-500 border",
                                                    selectedSignalDigit === i 
                                                        ? "bg-primary text-white scale-110 shadow-[0_0_25px_rgba(var(--primary),0.6)] border-white/20" 
                                                        : "bg-black/40 border-white/5 text-white/40 hover:bg-white/5"
                                                )}
                                            >
                                                {i}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedSignalDigit !== null && stats.signalStats && (
                                        <motion.div 
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-black/40 border border-primary/30 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] text-center shadow-xl min-w-[150px] sm:min-w-[200px]"
                                        >
                                            <p className="text-[10px] font-black text-primary uppercase mb-2">TACTICAL DELTA</p>
                                            <p className="text-3xl sm:text-5xl font-black text-white tabular-nums">{stats.signalStats.perc.toFixed(1)}%</p>
                                            <p className="text-[8px] font-black text-muted-foreground uppercase mt-1 tracking-widest">{stats.signalStats.count} TOTAL TICKS</p>
                                        </motion.div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Price & Stats Hub */}
            <Card className="border-none shadow-2xl bg-slate-950/80 backdrop-blur-3xl rounded-[2rem] sm:rounded-[4rem] overflow-hidden border-t border-white/10 relative">
                <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120} className="text-primary" /></div>
                <CardContent className="p-10 sm:p-20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-32">
                        <div className="text-center lg:text-left space-y-4">
                            <p className="text-[10px] sm:text-[12px] font-black text-primary uppercase tracking-[0.5em] ml-1">TECHNICAL HUD PIVOT</p>
                            <p className="text-5xl sm:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                {price.toFixed(decimalPlaces)}
                            </p>
                        </div>
                        <div className="flex gap-12 sm:gap-24 items-center">
                            <div className="text-center space-y-3">
                                <p className="text-[10px] sm:text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-2 flex items-center gap-2 justify-center">
                                    <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5" /> OVER {overValue}
                                </p>
                                <p className="text-4xl sm:text-7xl font-black text-white tabular-nums tracking-tighter">{stats.overCount}</p>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black text-[9px] sm:text-[11px] px-4 py-1">STRENGTH: {stats.overPerc.toFixed(0)}%</Badge>
                            </div>
                            <div className="w-px h-24 sm:h-40 bg-white/10" />
                            <div className="text-center space-y-3">
                                <p className="text-[10px] sm:text-[12px] font-black text-rose-500 uppercase tracking-[0.5em] mb-2 flex items-center gap-2 justify-center">
                                    <TrendingDown className="h-3 w-3 sm:h-5 sm:w-5" /> UNDER {underValue}
                                </p>
                                <p className="text-4xl sm:text-7xl font-black text-white tabular-nums tracking-tighter">{stats.underCount}</p>
                                <Badge className="bg-rose-500/10 text-rose-500 border-none font-black text-[9px] sm:text-[11px] px-4 py-1">STRENGTH: {stats.underPerc.toFixed(0)}%</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Visual Sequence Scanner */}
            <Card className="border-none shadow-2xl bg-slate-900/40 border border-white/10 p-10 sm:p-20 rounded-[2.5rem] sm:rounded-[5rem] overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 sm:mb-16">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-2xl border border-primary/30">
                            <LayoutGrid className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-xl font-black uppercase tracking-[0.4em] text-white">SEQUENCE FLUX SCANNER</h3>
                            <p className="text-[9px] sm:text-[11px] font-black uppercase text-primary/60 mt-1 tracking-[0.2em]">REAL-TIME NUMERICAL TELEMETRY</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                         <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">STREAMING ACTIVE</span>
                    </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6 relative z-10">
                    {renderPattern()}
                </div>
            </Card>

            {/* Probability Analysis Bars */}
            <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[5rem] overflow-hidden border border-white/5">
                <CardHeader className="p-10 sm:p-20 pb-4">
                    <div className="flex items-center gap-4">
                        <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        <CardTitle className="text-xs sm:text-xl font-black uppercase tracking-[0.5em] text-primary">PROBABILITY DENSITY MATRIX</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-10 sm:p-20 pt-4 space-y-16">
                    <div className="space-y-6">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">OVER {overValue} VECTOR</p>
                                <span className="text-3xl sm:text-6xl font-black text-emerald-400 tabular-nums">{stats.overPerc.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400/60 font-black text-[10px] uppercase">
                                <Crosshair size={16} /> ACCURACY GAUGE
                            </div>
                        </div>
                        <div className="relative h-16 sm:h-24 bg-black/60 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.overPerc}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]" 
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">UNDER {underValue} VECTOR</p>
                                <span className="text-3xl sm:text-6xl font-black text-rose-500 tabular-nums">{stats.underPerc.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-rose-500/60 font-black text-[10px] uppercase">
                                <Crosshair size={16} /> ACCURACY GAUGE
                            </div>
                        </div>
                        <div className="relative h-16 sm:h-24 bg-black/60 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.underPerc}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]" 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
