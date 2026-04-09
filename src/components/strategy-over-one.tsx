'use client';

import * as React from 'react';
import { 
    Zap, 
    Activity, 
    Network,
    ShieldCheck,
    ShieldAlert,
    TrendingUp,
    Square,
    Play,
    RotateCcw,
    RefreshCcw,
    Info,
    Crosshair,
    Wallet,
    Target,
    BarChart3,
    Flame,
    Cpu,
    Layers,
    ArrowUp,
    TrendingDown,
    Loader2,
    ChevronDown,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface StrategyOverOneProps {
    price: number;
    lastDigitTicks: number[];
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    decimalPlaces: number;
    balance: number;
    isAuthorized: boolean;
    currency: string;
    onExecuteTrade: (params: any) => void;
    activeContract: any;
    surveillanceStatus: 'offline' | 'active' | 'standby' | 'authorized' | 'executing';
    executionStatus: 'offline' | 'active' | 'standby' | 'authorized' | 'executing';
}

interface TradeLog {
    id: string;
    time: string;
    type: 'OVER 1';
    result: 'WON' | 'LOST' | 'EXECUTING';
    stake: number;
    profit: number;
    entrySpot: string;
    exitSpot: string;
    digits: string;
    payout: number;
}

export function StrategyOverOne({ 
    price, lastDigitTicks, selectedMarket, onMarketChange, decimalPlaces, balance, 
    isAuthorized, currency, onExecuteTrade, activeContract, surveillanceStatus, executionStatus
}: StrategyOverOneProps) {
    const { toast } = useToast();
    const [config, setConfig] = React.useState({ stake: 2, stopLoss: 8, takeProfit: 5, martingale: 2.5 });
    const [isRunning, setIsRunning] = React.useState(false);
    const [currentStake, setCurrentStake] = React.useState(2);
    const [sessionEnded, setSessionEnded] = React.useState(false);
    const [trades, setTrades] = React.useState<TradeLog[]>([]);
    const [sessionStats, setSessionStats] = React.useState({ wins: 0, losses: 0, profit: 0, totalStake: 0, totalPayout: 0 });
    const [statusMessage, setStatusMessage] = React.useState('ENGINE STANDBY');
    const [isPendingExecution, setIsPendingExecution] = React.useState(false);
    
    const lastProcessedId = React.useRef<string | null>(null);

    // TRIPLE-GATE OVER 1 STRATEGY:
    // Digit A (Previous) <= 2 AND Digit B (Current) < 4 AND (A + B) <= 4
    const entryLogic = React.useMemo(() => {
        if (lastDigitTicks.length < 2) return { digitA: 0, digitB: 0, sum: 0, canTrade: false };
        const digitB = lastDigitTicks[0]; // Current
        const digitA = lastDigitTicks[1]; // Previous
        const sum = digitA + digitB;
        
        const gate1 = digitA <= 2;
        const gate2 = digitB < 4;
        const gate3 = sum <= 4;
        
        const canTrade = gate1 && gate2 && gate3;
        return { digitA, digitB, sum, canTrade };
    }, [lastDigitTicks]);

    const winRate = React.useMemo(() => {
        if (trades.length === 0) return 0;
        return (sessionStats.wins / trades.length) * 100;
    }, [trades.length, sessionStats.wins]);

    const riskCheck = React.useMemo(() => {
        if (sessionStats.profit >= config.takeProfit) return 'TP';
        if (sessionStats.profit <= -config.stopLoss) return 'SL';
        return 'OK';
    }, [sessionStats.profit, config]);

    // Threshold Check Effect
    React.useEffect(() => {
        if (!isRunning || sessionEnded) return;

        if (riskCheck === 'TP') {
            setIsRunning(false);
            setSessionEnded(true);
            setStatusMessage('TAKE PROFIT REACHED');
            toast({ title: "TAKE PROFIT REACHED", description: `Cycle completed at +${sessionStats.profit.toFixed(2)} ${currency}` });
        } else if (riskCheck === 'SL') {
            setIsRunning(false);
            setSessionEnded(true);
            setStatusMessage('STOP LOSS TRIGGERED');
            toast({ variant: "destructive", title: "STOP LOSS TRIGGERED", description: `Cycle halted at ${sessionStats.profit.toFixed(2)} ${currency}` });
        }
    }, [riskCheck, isRunning, sessionEnded, currency, toast, sessionStats.profit]);

    // Contract Processor
    React.useEffect(() => {
        if (!activeContract || !isPendingExecution) return;
        
        const contractId = activeContract.contract_id.toString();
        if ((activeContract.status === 'won' || activeContract.status === 'lost') && contractId !== lastProcessedId.current) {
            lastProcessedId.current = contractId;
            const result = activeContract.status.toUpperCase() as 'WON' | 'LOST';
            const profitValue = parseFloat(activeContract.profit);
            const buyPrice = parseFloat(activeContract.buy_price);
            const payoutValue = profitValue + buyPrice;
            
            const analyzedDigitsString = `${lastDigitTicks[1]},${lastDigitTicks[0]}`;
            
            const newTrade: TradeLog = { 
                id: contractId, 
                time: new Date().toLocaleTimeString(), 
                type: 'OVER 1', 
                result, 
                stake: buyPrice, 
                profit: profitValue,
                entrySpot: activeContract.entry_tick_display_value || '-',
                exitSpot: activeContract.exit_tick_display_value || '-',
                digits: analyzedDigitsString,
                payout: payoutValue > 0 ? payoutValue : 0
            };
            
            setTrades(prev => {
                if (prev.some(t => t.id === contractId)) return prev;
                return [newTrade, ...prev];
            });
            
            setSessionStats(prev => ({
                wins: result === 'WON' ? prev.wins + 1 : prev.wins,
                losses: result === 'LOST' ? prev.losses + 1 : prev.losses,
                profit: prev.profit + profitValue,
                totalStake: prev.totalStake + buyPrice,
                totalPayout: prev.totalPayout + (result === 'WON' ? payoutValue : 0)
            }));

            if (result === 'LOST') {
                setCurrentStake(prev => prev * config.martingale);
            } else {
                setCurrentStake(config.stake);
            }

            setIsPendingExecution(false);
        }
    }, [activeContract, isPendingExecution, config, lastDigitTicks]);

    // Engagement Loop
    React.useEffect(() => {
        if (!isRunning || !entryLogic || sessionEnded || isPendingExecution || !isAuthorized) return;
        if (riskCheck !== 'OK') return;

        if (entryLogic.canTrade) {
            setStatusMessage('ENGAGING OVER 1');
            setIsPendingExecution(true);
            onExecuteTrade({ 
                stake: currentStake, 
                barrier: "1", 
                contract_type: "DIGITOVER" 
            });
        } else {
            setStatusMessage('FILTER: SCANNING GATES');
        }
    }, [lastDigitTicks, isRunning, sessionEnded, isPendingExecution, isAuthorized, entryLogic, currentStake, onExecuteTrade, riskCheck]);

    const stopTrading = () => {
        setIsRunning(false);
        setStatusMessage('ENGINE HALTED');
    };

    const resetSession = () => {
        setTrades([]); 
        setSessionStats({ wins: 0, losses: 0, profit: 0, totalStake: 0, totalPayout: 0 }); 
        setCurrentStake(config.stake);
        setIsRunning(false); 
        setSessionEnded(false); 
        setIsPendingExecution(false); 
        setStatusMessage('ENGINE STANDBY'); 
        lastProcessedId.current = null;
    };

    const updateConfig = (field: keyof typeof config, value: string) => {
        const num = parseFloat(value); 
        if (!isNaN(num)) setConfig(prev => ({ ...prev, [field]: num }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24 max-w-[1600px] mx-auto">
            
            {/* Tactical Configuration Matrix */}
            <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2">STAKE</Label>
                        <Input type="number" value={config.stake} onChange={e => updateConfig('stake', e.target.value)} className="h-12 bg-black/60 border-white/10 text-white font-black text-center text-[16px] rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2">MARTINGALE</Label>
                        <Input type="number" step="0.1" value={config.martingale} onChange={e => updateConfig('martingale', e.target.value)} className="h-12 bg-black/60 border-white/10 text-white font-black text-center text-[16px] rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2">TAKE PROFIT</Label>
                        <Input type="number" value={config.takeProfit} onChange={e => updateConfig('takeProfit', e.target.value)} className="h-12 bg-black/60 border-white/10 text-white font-black text-center text-[16px] rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2">STOP LOSS</Label>
                        <Input type="number" value={config.stopLoss} onChange={e => updateConfig('stopLoss', e.target.value)} className="h-12 bg-black/60 border-white/10 text-white font-black text-center text-[16px] rounded-2xl" />
                    </div>
                </div>
            </Card>

            {/* 5-Card Tactical Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2.5rem] relative group" >
                    <div className="absolute top-4 right-4"><Crosshair className="h-5 w-5 text-emerald-400" /></div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">FLAWLESS VECTOR</p>
                    <Select value={selectedMarket} onValueChange={onMarketChange}>
                        <SelectTrigger className="bg-transparent border-none p-0 h-auto font-black text-white text-lg leading-tight focus:ring-0 focus:ring-offset-0 gap-2">
                            <SelectValue placeholder="Market" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
                            {syntheticIndices.map(m => (
                                <SelectItem key={m.id} value={m.id} className="font-bold">{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[9px] text-emerald-400/60 font-bold mt-3 uppercase tracking-tighter">EQUITY: {isAuthorized ? balance.toFixed(2) : 'LOCKED'}</p>
                </Card>

                <Card className="bg-primary/10 border border-primary/20 p-6 rounded-[2.5rem] relative">
                    <div className="absolute top-4 right-4"><Zap className="h-5 w-5 text-primary" /></div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">ENGAGEMENT</p>
                    <p className="text-2xl font-black text-white leading-tight uppercase">OVER 1</p>
                    <Badge className="bg-primary/20 text-primary border-none mt-3 text-[9px] font-black uppercase">TRIPLE-GATE ACTIVE</Badge>
                </Card>

                <Card className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2.5rem] relative">
                    <div className="absolute top-4 right-4"><Wallet className="h-5 w-5 text-blue-400" /></div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">LIVE MARKET PIVOT</p>
                    <p className="text-2xl font-black text-white leading-tight tabular-nums">
                        {price === 0 ? <span className="text-amber-400 animate-pulse text-lg">SYNCING...</span> : price.toFixed(decimalPlaces)}
                    </p>
                    <Badge className="bg-blue-500/20 text-blue-400 border-none mt-3 text-[9px] font-black uppercase tracking-widest">STAKE: {currentStake.toFixed(2)}</Badge>
                </Card>

                <Card className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-[2.5rem] relative">
                    <div className="absolute top-4 right-4">
                        <div className={cn(
                            "h-5 w-5 rounded-full transition-all duration-300",
                            entryLogic?.canTrade ? "bg-emerald-400 animate-pulse shadow-[0_0_15px_#10b981]" : "bg-cyan-400 opacity-20"
                        )} />
                    </div>
                    <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3">ENTRY SIGNAL</p>
                    <div className="flex items-center gap-4 justify-between">
                        <div>
                            <p className="text-[7px] font-bold text-muted-foreground uppercase mb-1">PREV (A)</p>
                            <p className={cn("text-2xl font-black", entryLogic.digitA <= 2 ? "text-emerald-400" : "text-white")}>{entryLogic.digitA}</p>
                        </div>
                        <div>
                            <p className="text-[7px] font-bold text-muted-foreground uppercase mb-1">CURR (B)</p>
                            <p className={cn("text-2xl font-black", entryLogic.digitB < 4 ? "text-emerald-400" : "text-white")}>{entryLogic.digitB}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-[7px] font-bold text-muted-foreground uppercase mb-1">SUM (A+B)</p>
                            <p className={cn("text-2xl font-black", entryLogic.sum <= 4 ? "text-emerald-400" : "text-rose-500")}>{entryLogic.sum}</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2.5rem] relative">
                    <div className="absolute top-4 right-4"><BarChart3 className="h-5 w-5 text-amber-400" /></div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3">WIN RATE</p>
                    <p className="text-3xl font-black text-white leading-tight tabular-nums">{winRate.toFixed(0)}%</p>
                    <div className="mt-4 h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${winRate}%` }} />
                    </div>
                </Card>
            </div>

            {/* Central Large Cockpit Hub */}
            <Card className={cn(
                "p-10 sm:p-14 rounded-[4rem] sm:rounded-[6rem] border-none shadow-2xl transition-all duration-500 relative overflow-hidden",
                "bg-slate-900/80 backdrop-blur-3xl border border-white/5"
            )}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex items-center gap-10 text-center md:text-left">
                        <div className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500",
                            isPendingExecution ? "bg-primary shadow-[0_0_30px_rgba(var(--primary),1)]" : 
                            isRunning ? "bg-emerald-500 shadow-[0_0_30px_#10b981]" : "bg-white/5"
                        )}>
                            {isPendingExecution ? <Activity className="h-10 w-10 text-white animate-spin" /> : 
                             isRunning ? <Flame className="h-10 w-10 text-white animate-bounce" /> : 
                             <Cpu className="h-10 w-10 text-muted-foreground/40" />}
                        </div>
                        <div>
                            <h3 className={cn(
                                "text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-none",
                                isRunning || isPendingExecution ? "text-white" : "text-muted-foreground/40"
                            )}>
                                {isPendingExecution ? "EXECUTING..." : isRunning ? "NEURAL SURVEILLANCE" : "ENGINE STANDBY"}
                            </h3>
                            <p className="text-xs font-black uppercase tracking-[0.5em] text-primary/60 mt-4">
                                {isPendingExecution ? "ZERO-ERROR GATE ENGAGED" : 
                                 isRunning ? (entryLogic.canTrade ? "READY TO ENGAGE" : "FILTER: SCANNING GATES") : 
                                 "AWAITING COMMAND PARAMETERS"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {!isRunning ? (
                            <Button 
                                onClick={() => setIsRunning(true)} 
                                disabled={sessionEnded || !isAuthorized} 
                                className="h-20 px-14 rounded-full font-black text-lg uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-95 transition-all"
                            >
                                <Play className="h-6 w-6 mr-4 fill-current" /> START BOT
                            </Button>
                        ) : (
                            <Button 
                                onClick={stopTrading} 
                                className="h-20 px-14 rounded-full font-black text-lg uppercase tracking-widest bg-rose-500 hover:bg-rose-600 shadow-[0_0_40px_rgba(244,63,94,0.3)] active:scale-95 transition-all"
                            >
                                <Square className="h-6 w-6 mr-4" /> STOP BOT
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            onClick={resetSession} 
                            className="h-20 w-20 rounded-full border-white/10 bg-white text-slate-950 hover:bg-slate-100 shadow-2xl active:scale-95 transition-all p-0 flex items-center justify-center"
                        >
                            <RefreshCcw className="h-8 w-8" />
                        </Button>
                    </div>
                </div>
                
                {isPendingExecution && (
                    <div className="mt-12 h-2.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                        />
                    </div>
                )}
            </Card>

            {/* Strategic Summary Synopsis */}
            <div className="p-8 sm:p-12 bg-black/50 rounded-[3rem] border border-white/5 space-y-6 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h4 className="text-[12px] sm:text-[14px] font-black uppercase text-primary tracking-widest flex items-center gap-4">
                        <Layers className="h-6 w-6" /> 100+1 ACCURACY ANALYSIS
                    </h4>
                    <div className="flex items-center gap-3">
                        <span className={cn("text-xl sm:text-3xl font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                            {sessionStats.profit.toFixed(2)} USD
                        </span>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">NET PROFIT</p>
                    </div>
                </div>
                <p className="text-sm sm:text-xl font-medium text-white/90 leading-relaxed italic">
                    "Triple-Gate Logic Active: Digit A &le; 2, Digit B &lt; 4, SUM &le; 4. Execution window locked for 100+1 accuracy cycle. Performance threshold: +{config.takeProfit} USD / -{config.stopLoss} USD."
                </p>
            </div>

            {/* High-Density Transaction Matrix */}
            <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border border-white/10">
                <div className="px-8 pt-6 pb-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <h4 className="font-black text-[12px] uppercase tracking-[0.3em] text-white">TRANSACTION MATRIX</h4>
                    <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black uppercase tracking-widest px-4">RUNS: {trades.length}</Badge>
                </div>
                <div className="w-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/80 backdrop-blur-md border-b border-white/5">
                            <tr className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">
                                <th className="px-8 py-4">TYPE</th>
                                <th className="px-8 py-4">ENTRY/EXIT SPOT</th>
                                <th className="px-8 py-4 text-right">BUY PRICE AND P/L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {trades.map((t) => (
                                    <motion.tr 
                                        key={t.id} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="hover:bg-white/5 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <Activity className="h-5 w-5 text-slate-600" />
                                                {t.result === 'WON' ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-rose-500" />}
                                                <span className="text-[12px] font-black text-white">OVER 1</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-2.5 w-2.5 bg-rose-500 rounded-sm" />
                                                    <span className="text-[13px] font-black text-white tabular-nums">{t.entrySpot}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-2.5 w-2.5 border border-slate-600 rounded-sm" />
                                                    <span className="text-[13px] font-black text-slate-400 tabular-nums">{t.exitSpot}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="space-y-2">
                                                <p className="text-[13px] font-black text-slate-300 tabular-nums">{t.stake.toFixed(2)} USD</p>
                                                <p className={cn("text-[13px] font-black tabular-nums", t.result === 'WON' ? "text-emerald-400" : "text-rose-500")}>
                                                    {t.result === 'WON' ? `+${t.profit.toFixed(2)}` : t.profit.toFixed(2)} USD
                                                </p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {trades.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-8 py-32 text-center opacity-20">
                                        <Zap className="h-24 w-24 mx-auto mb-6 text-slate-400" />
                                        <p className="text-lg font-black uppercase tracking-[0.5em] text-white">Awaiting Tactical Engagement</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Tactical Footer Grid */}
                <div className="border-t border-white/10 bg-black/40 p-10 grid grid-cols-3 gap-y-10 shrink-0 shadow-inner">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TOTAL STAKE</p>
                        <p className="text-xl font-black text-white tabular-nums">{sessionStats.totalStake.toFixed(2)} <span className="text-[12px] opacity-40">USD</span></p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TOTAL PAYOUT</p>
                        <p className="text-xl font-black text-white tabular-nums">{sessionStats.totalPayout.toFixed(2)} <span className="text-[12px] opacity-40">USD</span></p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">NO. OF RUNS</p>
                        <p className="text-xl font-black text-white tabular-nums">{trades.length}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">CONTRACTS LOST</p>
                        <p className="text-xl font-black text-rose-500 tabular-nums">{sessionStats.losses}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">CONTRACTS WON</p>
                        <p className="text-xl font-black text-emerald-400 tabular-nums">{sessionStats.wins}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TOTAL PROFIT/LOSS</p>
                        <p className={cn("text-2xl font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                            {sessionStats.profit >= 0 ? '+' : ''}{sessionStats.profit.toFixed(2)} <span className="text-[12px] opacity-40">USD</span>
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}