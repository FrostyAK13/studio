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
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

    const entryLogic = React.useMemo(() => {
        if (lastDigitTicks.length < 2) return null;
        const d1 = lastDigitTicks[0]; 
        const d2 = lastDigitTicks[1]; 
        const shouldSkip = d1 <= 3 && d2 <= 3;
        return { d1, d2, shouldSkip, canTrade: !shouldSkip };
    }, [lastDigitTicks]);

    const winRate = React.useMemo(() => {
        if (trades.length === 0) return 0;
        return (sessionStats.wins / trades.length) * 100;
    }, [trades.length, sessionStats.wins]);

    // Risk Management Watcher
    React.useEffect(() => {
        if (!isRunning || sessionEnded) return;

        if (sessionStats.profit >= config.takeProfit) {
            setIsRunning(false);
            setSessionEnded(true);
            setStatusMessage('TAKE PROFIT REACHED');
            toast({ title: "TAKE PROFIT REACHED", description: `Cycle completed at +${sessionStats.profit.toFixed(2)} ${currency}` });
        } else if (sessionStats.profit <= -config.stopLoss) {
            setIsRunning(false);
            setSessionEnded(true);
            setStatusMessage('STOP LOSS TRIGGERED');
            toast({ variant: "destructive", title: "STOP LOSS TRIGGERED", description: `Cycle halted at ${sessionStats.profit.toFixed(2)} ${currency}` });
        }
    }, [sessionStats.profit, config.takeProfit, config.stopLoss, isRunning, sessionEnded, currency, toast]);

    // Contract Result Handler
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

    // Automation Loop
    React.useEffect(() => {
        if (!isRunning || !entryLogic || sessionEnded || isPendingExecution || !isAuthorized) return;
        
        // Double-Guard Threshold Check
        if (sessionStats.profit >= config.takeProfit || sessionStats.profit <= -config.stopLoss) return;

        if (entryLogic.canTrade) {
            setStatusMessage('ENGAGING OVER 1');
            setIsPendingExecution(true);
            onExecuteTrade({ 
                stake: currentStake, 
                barrier: "1", 
                contract_type: "DIGITOVER" 
            });
        } else {
            setStatusMessage('FILTER: SKIPPING CYCLE');
        }
    }, [lastDigitTicks, isRunning, sessionEnded, isPendingExecution, isAuthorized, entryLogic, currentStake, onExecuteTrade, sessionStats.profit, config]);

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

    const marketName = syntheticIndices.find(m => m.id === selectedMarket)?.name || selectedMarket;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24 max-w-[1600px] mx-auto scale-[0.9] origin-top">
            
            {/* Tactical Configuration Bar */}
            <Card className="border-none shadow-xl bg-slate-900/40 backdrop-blur-3xl rounded-[1.5rem] p-4 border border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.3em] ml-1">STAKE (USD)</Label>
                        <Input type="number" value={config.stake} onChange={e => updateConfig('stake', e.target.value)} className="h-10 bg-black/60 border-white/10 text-white font-black text-center text-[12px] rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.3em] ml-1">MARTINGALE (X)</Label>
                        <Input type="number" step="0.1" value={config.martingale} onChange={e => updateConfig('martingale', e.target.value)} className="h-10 bg-black/60 border-white/10 text-white font-black text-center text-[12px] rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.3em] ml-1">TAKE PROFIT</Label>
                        <Input type="number" value={config.takeProfit} onChange={e => updateConfig('takeProfit', e.target.value)} className="h-10 bg-black/60 border-white/10 text-white font-black text-center text-[12px] rounded-xl" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.3em] ml-1">STOP LOSS</Label>
                        <Input type="number" value={config.stopLoss} onChange={e => updateConfig('stopLoss', e.target.value)} className="h-10 bg-black/60 border-white/10 text-white font-black text-center text-[12px] rounded-xl" />
                    </div>
                </div>
            </Card>

            {/* Global Scan 5-Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6">
                <Card className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-[2rem] relative group" >
                    <div className="absolute top-2 right-4"><Crosshair className="h-4 w-4 text-emerald-400" /></div>
                    <p className="text-[8px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">FLAWLESS VECTOR</p>
                    <p className="text-base sm:text-lg font-black text-white leading-tight">{marketName}</p>
                    <p className="text-[8px] text-emerald-400/60 font-bold mt-2 uppercase tracking-tighter">EQUITY: {isAuthorized ? balance.toFixed(2) : 'LOCKED'}</p>
                </Card>

                <Card className="bg-primary/10 border border-primary/30 p-5 rounded-[2rem] relative">
                    <div className="absolute top-2 right-4"><Zap className="h-4 w-4 text-primary" /></div>
                    <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-widest mb-2">ENGAGEMENT</p>
                    <p className="text-xl sm:text-2xl font-black text-white leading-tight uppercase">OVER 1</p>
                    <Badge className="bg-primary/20 text-primary border-none mt-2 text-[8px] font-black uppercase">ZERO-ERROR ACTIVE</Badge>
                </Card>

                <Card className="bg-blue-600/20 border border-blue-500/30 p-5 rounded-[2rem] relative">
                    <div className="absolute top-2 right-4"><Wallet className="h-4 w-4 text-blue-400" /></div>
                    <p className="text-[8px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">LIVE MARKET PIVOT</p>
                    <p className="text-xl sm:text-2xl font-black text-white leading-tight tabular-nums">
                        {price === 0 ? <span className="text-amber-400 animate-pulse">SYNCING...</span> : price.toFixed(decimalPlaces)}
                    </p>
                    <Badge className="bg-blue-500/20 text-blue-400 border-none mt-2 text-[8px] font-black uppercase tracking-widest">STAKE: {currentStake.toFixed(2)}</Badge>
                </Card>

                <Card className="bg-cyan-500/10 border border-cyan-500/30 p-5 rounded-[2rem] relative">
                    <div className="absolute top-2 right-4">
                        <div className={cn(
                            "h-4 w-4 rounded-full transition-all duration-300",
                            entryLogic?.canTrade && isRunning ? "bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" : "bg-cyan-400 opacity-20"
                        )} />
                    </div>
                    <p className="text-[8px] sm:text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">ENTRY SIGNAL</p>
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-[8px] text-muted-foreground uppercase mb-1">DIGIT 2</p>
                            <p className={cn("text-2xl font-black", entryLogic && entryLogic.d2 <= 3 ? "text-rose-500" : "text-white")}>{entryLogic ? entryLogic.d2 : '-'}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-[8px] text-muted-foreground uppercase mb-1">DIGIT 1</p>
                            <p className={cn("text-2xl font-black", entryLogic && entryLogic.d1 <= 3 ? "text-rose-500" : "text-white")}>{entryLogic ? entryLogic.d1 : '-'}</p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-[2rem] relative">
                    <div className="absolute top-2 right-4"><BarChart3 className="h-4 w-4 text-amber-400" /></div>
                    <p className="text-[8px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">WIN RATE</p>
                    <p className="text-xl sm:text-3xl font-black text-white leading-tight tabular-nums">{winRate.toFixed(0)}%</p>
                    <div className="mt-2 h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${winRate}%` }} />
                    </div>
                </Card>
            </div>

            {/* Central Execution Hub (Big Card Style) */}
            <Card className={cn(
                "p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[4rem] border-2 transition-all duration-500 relative overflow-hidden",
                isRunning && !isPendingExecution ? "bg-emerald-500/5 border-emerald-500/40" : 
                isPendingExecution ? "bg-primary/5 border-primary shadow-[0_0_60px_rgba(var(--primary),0.3)]" : 
                "bg-black/60 border-white/5"
            )}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                            isPendingExecution ? "bg-primary shadow-[0_0_20px_rgba(var(--primary),1)]" : 
                            isRunning ? "bg-emerald-500 shadow-[0_0_20px_#10b981]" : "bg-white/5"
                        )}>
                            {isPendingExecution ? <Activity className="h-8 w-8 text-white animate-spin" /> : 
                             isRunning ? <Flame className="h-8 w-8 text-white animate-bounce" /> : 
                             <Cpu className="h-8 w-8 text-muted-foreground/40" />}
                        </div>
                        <div>
                            <h3 className={cn(
                                "text-xl sm:text-3xl font-black uppercase tracking-tighter leading-none",
                                isRunning || isPendingExecution ? "text-white" : "text-muted-foreground/40"
                            )}>
                                {isPendingExecution ? "EXECUTING OVER 1" : isRunning ? "NEURAL SURVEILLANCE ACTIVE" : "ENGINE STANDBY"}
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 mt-2">
                                {isPendingExecution ? "ZERO-ERROR GATE ENGAGED" : 
                                 isRunning ? (entryLogic?.shouldSkip ? "FILTER: SKIPPING CYCLE" : "SYNC: READY TO ENGAGE") : 
                                 "AWAITING COMMAND PARAMETERS"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isRunning ? (
                            <Button 
                                onClick={() => setIsRunning(true)} 
                                disabled={sessionEnded || !isAuthorized} 
                                className="h-16 px-10 rounded-full font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-2xl active:scale-95 transition-all"
                            >
                                <Play className="h-5 w-5 mr-3 fill-current" /> START BOT
                            </Button>
                        ) : (
                            <Button 
                                onClick={stopTrading} 
                                className="h-16 px-10 rounded-full font-black text-xs uppercase tracking-widest bg-rose-500 hover:bg-rose-600 shadow-2xl active:scale-95 transition-all"
                            >
                                <Square className="h-5 w-5 mr-3" /> STOP BOT
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            onClick={resetSession} 
                            className="h-16 w-16 rounded-full border-white/10 text-white hover:bg-white/5 shadow-2xl active:scale-95 transition-all p-0 flex items-center justify-center"
                        >
                            <RefreshCcw className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
                
                {isPendingExecution && (
                    <div className="mt-8 h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                        />
                    </div>
                )}
            </Card>

            {/* Strategic Summary Box */}
            <div className="p-6 sm:p-10 bg-black/50 rounded-[2.5rem] border border-white/5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h4 className="text-[10px] sm:text-[12px] font-black uppercase text-primary tracking-widest flex items-center gap-3">
                        <Layers className="h-5 w-5" /> 100+1 ACCURACY ANALYSIS
                    </h4>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-base sm:text-2xl font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                            {sessionStats.profit.toFixed(2)} USD
                        </span>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-black">NET PROFIT</p>
                    </div>
                </div>
                <p className="text-xs sm:text-lg font-medium text-white/90 leading-relaxed italic">
                    "Engine identified a Flawless Zero-Error window. Profit cycle targets set at +{config.takeProfit} USD with a -{config.stopLoss} USD safety threshold. Strategy logic: Digit Over 1 with filtered Skip Logic."
                </p>
            </div>

            {/* Transactions Matrix */}
            <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden border border-white/10 flex flex-col">
                <Tabs defaultValue="transactions" className="w-full flex flex-col">
                    <div className="px-6 pt-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <TabsList className="bg-transparent h-auto p-0 gap-8">
                            <TabsTrigger value="transactions" className="px-0 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 data-[state=active]:text-white transition-all">TRANSACTIONS</TabsTrigger>
                            <TabsTrigger value="summary" className="px-0 py-3 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 data-[state=active]:text-white transition-all">SUMMARY</TabsTrigger>
                        </TabsList>
                        <div className="flex items-center gap-4">
                            <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest px-3">RUNS: {trades.length}</Badge>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <TabsContent value="transactions" className="m-0 p-0 bg-transparent">
                            <div className="w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900/80 backdrop-blur-md border-b border-white/5">
                                        <tr className="text-[8px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                            <th className="px-6 py-3">TYPE</th>
                                            <th className="px-6 py-3">ENTRY/EXIT SPOT</th>
                                            <th className="px-6 py-3 text-right">BUY PRICE AND P/L</th>
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
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Activity className="h-4 w-4 text-slate-600" />
                                                            {t.result === 'WON' ? <TrendingUp className="h-4 w-4 text-emerald-400" /> : <TrendingDown className="h-4 w-4 text-rose-500" />}
                                                            <span className="text-[10px] font-black text-white">OVER 1</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2 w-2 bg-rose-500 rounded-sm" />
                                                                <span className="text-[11px] font-black text-white tabular-nums">{t.entrySpot}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-2 w-2 border border-slate-600 rounded-sm" />
                                                                <span className="text-[11px] font-black text-slate-400 tabular-nums">{t.exitSpot}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="space-y-1">
                                                            <p className="text-[11px] font-black text-slate-300 tabular-nums">{t.stake.toFixed(2)} USD</p>
                                                            <p className={cn("text-[11px] font-black tabular-nums", t.result === 'WON' ? "text-emerald-400" : "text-rose-500")}>
                                                                {t.result === 'WON' ? `+${t.profit.toFixed(2)}` : t.profit.toFixed(2)} USD
                                                            </p>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                        {trades.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-20 text-center opacity-20">
                                                    <Zap className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                                                    <p className="text-xs font-black uppercase tracking-[0.4em] text-white">Awaiting Tactical Engagement</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="summary" className="m-0 p-16 flex items-center justify-center bg-transparent">
                             <div className="text-center space-y-6 max-w-sm">
                                <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">CYCLE WIN RATE</p>
                                    <p className="text-7xl font-black text-white tracking-tighter tabular-nums">
                                        {winRate.toFixed(0)}%
                                    </p>
                                </div>
                                <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic px-8">
                                    "100+1 Accuracy Protocol active. Monitoring high-volatility streams for Zero-Error digit skew confirmation."
                                </p>
                             </div>
                        </TabsContent>
                    </div>

                    {/* Integrated Summary Footer */}
                    <div className="mt-auto border-t border-white/10 bg-black/40 p-6 grid grid-cols-3 gap-y-6 shrink-0 shadow-inner">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL STAKE</p>
                            <p className="text-sm font-black text-white tabular-nums">{sessionStats.totalStake.toFixed(2)} <span className="text-[10px] opacity-40">USD</span></p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL PAYOUT</p>
                            <p className="text-sm font-black text-white tabular-nums">{sessionStats.totalPayout.toFixed(2)} <span className="text-[10px] opacity-40">USD</span></p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">NO. OF RUNS</p>
                            <p className="text-sm font-black text-white tabular-nums">{trades.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">CONTRACTS LOST</p>
                            <p className="text-sm font-black text-rose-500 tabular-nums">{sessionStats.losses}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">CONTRACTS WON</p>
                            <p className="text-sm font-black text-emerald-400 tabular-nums">{sessionStats.wins}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL PROFIT/LOSS</p>
                            <p className={cn("text-lg font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                {sessionStats.profit >= 0 ? '+' : ''}{sessionStats.profit.toFixed(2)} <span className="text-[10px] opacity-40">USD</span>
                            </p>
                        </div>
                    </div>
                </Tabs>
            </Card>
        </div>
    );
}
