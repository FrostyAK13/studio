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

    React.useEffect(() => {
        if (!isRunning) {
            setCurrentStake(config.stake);
        }
    }, [config.stake, isRunning]);

    const entryLogic = React.useMemo(() => {
        if (lastDigitTicks.length < 2) return { digitA: 0, digitB: 0, sum: 0, canTrade: false };
        const digitB = lastDigitTicks[0];
        const digitA = lastDigitTicks[1];
        const sum = digitA + digitB;
        
        const gate1 = digitA <= 2;
        const gate2 = digitB < 4;
        const gate3 = sum <= 4;
        const safetyFilter = sum > 0 && sum <= 4;
        
        const canTrade = gate1 && gate2 && gate3 && safetyFilter;
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
    }, [sessionStats.profit, config.takeProfit, config.stopLoss]);

    React.useEffect(() => {
        if (!isRunning || !entryLogic || sessionEnded || isPendingExecution || !isAuthorized) return;
        if (riskCheck !== 'OK') {
            setIsRunning(false);
            setSessionEnded(true);
            const title = riskCheck === 'TP' ? "TAKE PROFIT REACHED" : "STOP LOSS TRIGGERED";
            setStatusMessage(title);
            toast({ variant: riskCheck === 'SL' ? "destructive" : "default", title, description: `Cycle completed at ${sessionStats.profit.toFixed(2)} ${currency}` });
            return;
        }
        if (entryLogic.canTrade) {
            setStatusMessage('EXECUTING OVER 1');
            setIsPendingExecution(true);
            onExecuteTrade({ stake: currentStake, barrier: "1", contract_type: "DIGITOVER" });
        } else {
            setStatusMessage('MONITORING GATES');
        }
    }, [lastDigitTicks, isRunning, sessionEnded, isPendingExecution, isAuthorized, entryLogic, currentStake, onExecuteTrade, riskCheck, currency, toast, sessionStats.profit]);

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
            const newTrade: TradeLog = { id: contractId, time: new Date().toLocaleTimeString(), type: 'OVER 1', result, stake: buyPrice, profit: profitValue, entrySpot: activeContract.entry_tick_display_value || '-', exitSpot: activeContract.exit_tick_display_value || '-', digits: analyzedDigitsString, payout: payoutValue > 0 ? payoutValue : 0 };
            setTrades(prev => { if (prev.some(t => t.id === contractId)) return prev; return [newTrade, ...prev]; });
            setSessionStats(prev => ({ wins: result === 'WON' ? prev.wins + 1 : prev.wins, losses: result === 'LOST' ? prev.losses + 1 : prev.losses, profit: prev.profit + profitValue, totalStake: prev.totalStake + buyPrice, totalPayout: prev.totalPayout + (result === 'WON' ? payoutValue : 0) }));
            if (result === 'LOST') { setCurrentStake(prev => prev * config.martingale); } else { setCurrentStake(config.stake); }
            setIsPendingExecution(false);
        }
    }, [activeContract, isPendingExecution, config.martingale, config.stake, lastDigitTicks]);

    const stopTrading = () => { setIsRunning(false); setStatusMessage('ENGINE HALTED'); };
    const resetSession = () => { setTrades([]); setSessionStats({ wins: 0, losses: 0, profit: 0, totalStake: 0, totalPayout: 0 }); setCurrentStake(config.stake); setIsRunning(false); setSessionEnded(false); setIsPendingExecution(false); setStatusMessage('ENGINE STANDBY'); lastProcessedId.current = null; };
    const updateConfig = (field: keyof typeof config, value: string) => { const num = parseFloat(value); if (!isNaN(num)) { setConfig(prev => ({ ...prev, [field]: num })); if (field === 'stake' && !isRunning) { setCurrentStake(num); } } };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20 max-w-[1600px] mx-auto">
            <Card className="border-none shadow-xl bg-card rounded-[1.5rem] p-4 border border-primary/10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.2em] ml-1.5">STAKE</Label>
                        <Input type="number" value={config.stake} onChange={e => updateConfig('stake', e.target.value)} className="h-10 bg-muted/50 border-primary/10 text-foreground font-black text-center text-[14px] rounded-xl focus:ring-primary/40" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.2em] ml-1.5">MARTINGALE</Label>
                        <Input type="number" step="0.1" value={config.martingale} onChange={e => updateConfig('martingale', e.target.value)} className="h-10 bg-muted/50 border-primary/10 text-foreground font-black text-center text-[14px] rounded-xl focus:ring-primary/40" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.2em] ml-1.5">TAKE PROFIT</Label>
                        <Input type="number" value={config.takeProfit} onChange={e => updateConfig('takeProfit', e.target.value)} className="h-10 bg-muted/50 border-primary/10 text-foreground font-black text-center text-[14px] rounded-xl focus:ring-primary/40" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.2em] ml-1.5">STOP LOSS</Label>
                        <Input type="number" value={config.stopLoss} onChange={e => updateConfig('stopLoss', e.target.value)} className="h-10 bg-muted/50 border-primary/10 text-foreground font-black text-center text-[14px] rounded-xl focus:ring-primary/40" />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Card className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-[1.5rem] relative group" >
                    <div className="absolute top-3 right-3"><Crosshair className="h-4 w-4 text-emerald-600" /></div>
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2">MARKET</p>
                    <Select value={selectedMarket} onValueChange={onMarketChange}>
                        <SelectTrigger className="bg-transparent border-none p-0 h-auto font-black text-foreground text-base leading-tight focus:ring-0 focus:ring-offset-0 gap-1.5">
                            <SelectValue placeholder="Market" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-primary/10 text-foreground rounded-xl">
                            {syntheticIndices.map(m => (
                                <SelectItem key={m.id} value={m.id} className="font-bold">{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[8px] text-emerald-600/60 font-bold mt-2 uppercase tracking-tighter">EQUITY: {isAuthorized ? balance.toFixed(2) : 'LOCKED'}</p>
                </Card>
                <Card className="bg-primary/10 border border-primary/20 p-4 rounded-[1.5rem] relative">
                    <div className="absolute top-3 right-3"><Zap className="h-4 w-4 text-primary" /></div>
                    <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-2">STRATEGY</p>
                    <p className="text-xl font-black text-foreground leading-tight uppercase">OVER 1</p>
                    <Badge className="bg-primary/20 text-primary border-none mt-2 text-[8px] font-black uppercase">ACTIVE</Badge>
                </Card>
                <Card className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-[1.5rem] relative">
                    <div className="absolute top-3 right-3"><Wallet className="h-4 w-4 text-blue-600" /></div>
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-2">PRICE</p>
                    <p className="text-xl font-black text-foreground leading-tight tabular-nums">{price === 0 ? <span className="text-amber-600 animate-pulse text-sm">SYNCING...</span> : price.toFixed(decimalPlaces)}</p>
                    <Badge className="bg-blue-500/20 text-blue-600 border-none mt-2 text-[8px] font-black uppercase tracking-widest">STAKE: {currentStake.toFixed(2)}</Badge>
                </Card>
                <Card className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-[1.5rem] relative">
                    <div className="absolute top-3 right-3"><div className={cn("h-4 w-4 rounded-full transition-all duration-300", entryLogic?.canTrade ? "bg-emerald-600 animate-pulse shadow-[0_0_10px_#10b981]" : "bg-cyan-600 opacity-20")} /></div>
                    <p className="text-[8px] font-black text-cyan-600 uppercase tracking-widest mb-2">SIGNAL GATES</p>
                    <div className="flex items-center gap-3 justify-between">
                        <div>
                            <p className="text-[6px] font-bold text-muted-foreground uppercase mb-0.5">PREV</p>
                            <p className={cn("text-xl font-black", entryLogic.digitA <= 2 ? "text-emerald-600" : "text-foreground")}>{entryLogic.digitA}</p>
                        </div>
                        <div>
                            <p className="text-[6px] font-bold text-muted-foreground uppercase mb-0.5">CURR</p>
                            <p className={cn("text-xl font-black", entryLogic.digitB < 4 ? "text-emerald-600" : "text-foreground")}>{entryLogic.digitB}</p>
                        </div>
                        <div className="w-px h-6 bg-primary/10" />
                        <div>
                            <p className="text-[6px] font-bold text-muted-foreground uppercase mb-0.5">SUM</p>
                            <p className={cn("text-xl font-black", (entryLogic.sum <= 4 && entryLogic.sum > 0) ? "text-emerald-600" : "text-rose-500")}>{entryLogic.sum}</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-[1.5rem] relative">
                    <div className="absolute top-3 right-3"><BarChart3 className="h-4 w-4 text-amber-600" /></div>
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-2">WIN RATE</p>
                    <p className="text-2xl font-black text-foreground leading-tight tabular-nums">{winRate.toFixed(0)}%</p>
                    <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${winRate}%` }} /></div>
                </Card>
            </div>

            <Card className="p-6 sm:p-8 rounded-[2.5rem] border-none shadow-2xl transition-all duration-500 relative overflow-hidden bg-card border border-primary/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500", isPendingExecution ? "bg-primary shadow-[0_0_20px_rgba(var(--primary),1)]" : isRunning ? (entryLogic.canTrade ? "bg-emerald-600 shadow-[0_0_20px_#10b981]" : "bg-emerald-600/20") : "bg-muted")}>
                            {isPendingExecution ? <Activity className="h-8 w-8 text-white animate-spin" /> : isRunning ? <Flame className={cn("h-8 w-8 text-white", entryLogic.canTrade && "animate-bounce")} /> : <Cpu className="h-8 w-8 text-muted-foreground/40" />}
                        </div>
                        <div>
                            <h3 className={cn("text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-none", isRunning || isPendingExecution ? "text-foreground" : "text-muted-foreground/40")}>{isPendingExecution ? "EXECUTING..." : isRunning ? "SURVEILLANCE" : "STANDBY"}</h3>
                            <div className="flex items-center gap-2 mt-3">
                                <div className={cn("h-1.5 w-1.5 rounded-full", entryLogic.canTrade ? "bg-emerald-600 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-muted")} />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">{isPendingExecution ? "EXECUTION ENGAGED" : isRunning ? (entryLogic.canTrade ? "SIGNAL DETECTED" : "MONITORING") : "AWAITING START"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {!isRunning ? (
                            <Button onClick={() => setIsRunning(true)} disabled={sessionEnded || !isAuthorized} className="h-16 px-10 rounded-full font-black text-base uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-xl active:scale-95 transition-all">
                                <Play className="h-5 w-5 mr-3 fill-current" /> START BOT
                            </Button>
                        ) : (
                            <Button onClick={stopTrading} className="h-16 px-10 rounded-full font-black text-base uppercase tracking-widest bg-rose-500 hover:bg-rose-600 shadow-xl active:scale-95 transition-all">
                                <Square className="h-5 w-5 mr-3" /> STOP BOT
                            </Button>
                        )}
                        <Button variant="outline" onClick={resetSession} className="h-16 w-16 rounded-full border-primary/10 bg-card text-foreground hover:bg-muted shadow-xl active:scale-95 transition-all p-0 flex items-center justify-center">
                            <RefreshCcw className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="p-6 sm:p-8 bg-muted/30 rounded-[2rem] border border-primary/5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-primary/5 pb-4">
                    <h4 className="text-[10px] sm:text-[12px] font-black uppercase text-primary tracking-widest flex items-center gap-3"><Layers className="h-5 w-5" /> HUD</h4>
                    <div className="flex items-center gap-2">
                        <span className={cn("text-lg sm:text-2xl font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-600" : "text-rose-500")}>{sessionStats.profit.toFixed(2)} USD</span>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-black">NET PROFIT</p>
                    </div>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-card rounded-[1.5rem] overflow-hidden border border-primary/10">
                <div className="px-6 py-4 border-b border-primary/5 flex items-center justify-between bg-muted/20">
                    <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-foreground">LOG</h4>
                    <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest px-3">RUNS: {trades.length}</Badge>
                </div>
                <div className="w-full">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/30 border-b border-primary/5">
                            <tr className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                                <th className="px-6 py-3">TYPE</th>
                                <th className="px-6 py-3">PRICE</th>
                                <th className="px-6 py-3 text-right">P/L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            <AnimatePresence>
                                {trades.map((t) => (
                                    <motion.tr key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><Activity className="h-4 w-4 text-muted-foreground" /><span className="text-[11px] font-black text-foreground">OVER 1</span></div></td>
                                        <td className="px-6 py-4"><div className="space-y-1"><div className="flex items-center gap-3"><span className="text-[11px] font-black text-foreground tabular-nums">{t.entrySpot}</span></div><div className="flex items-center gap-3"><span className="text-[11px] font-black text-muted-foreground tabular-nums">{t.exitSpot}</span></div></div></td>
                                        <td className="px-6 py-4 text-right"><div className="space-y-1"><p className="text-[11px] font-black text-muted-foreground tabular-nums">{t.stake.toFixed(2)} USD</p><p className={cn("text-[11px] font-black tabular-nums", t.result === 'WON' ? "text-emerald-600" : "text-rose-500")}>{t.result === 'WON' ? `+${t.profit.toFixed(2)}` : t.profit.toFixed(2)} USD</p></div></td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
