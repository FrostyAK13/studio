'use client';

import * as React from 'react';
import { 
    Zap, 
    Activity, 
    Cpu, 
    ArrowUpRight, 
    ArrowDownRight, 
    Network,
    ShieldCheck,
    ShieldAlert,
    TrendingUp,
    Square,
    Play,
    RotateCcw,
    Circle,
    Info,
    RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
                return [newTrade, ...prev].slice(0, 50);
            });
            
            setSessionStats(prev => {
                const newProfit = prev.profit + profitValue;
                const newWins = result === 'WON' ? prev.wins + 1 : prev.wins;
                const newLosses = result === 'LOST' ? prev.losses + 1 : prev.losses;
                const newTotalStake = prev.totalStake + buyPrice;
                const newTotalPayout = prev.totalPayout + (result === 'WON' ? payoutValue : 0);
                
                if (newProfit >= config.takeProfit) {
                    setIsRunning(false);
                    setSessionEnded(true);
                    setStatusMessage('TAKE PROFIT REACHED');
                    toast({ title: "TP REACHED", description: `Profit: ${newProfit.toFixed(2)} ${currency}` });
                } else if (newProfit <= -config.stopLoss) {
                    setIsRunning(false);
                    setSessionEnded(true);
                    setStatusMessage('STOP LOSS TRIGGERED');
                    toast({ variant: "destructive", title: "STOP LOSS", description: `Loss: ${newProfit.toFixed(2)} ${currency}` });
                }

                return { wins: newWins, losses: newLosses, profit: newProfit, totalStake: newTotalStake, totalPayout: newTotalPayout };
            });

            if (result === 'LOST') {
                setCurrentStake(prev => prev * config.martingale);
            } else {
                setCurrentStake(config.stake);
            }

            setIsPendingExecution(false);
            if (!sessionEnded) {
                setStatusMessage('CYCLE SETTLED');
                setTimeout(() => { if (isRunning && !sessionEnded) setStatusMessage('MONITORING TICKS...'); }, 800);
            }
        }
    }, [activeContract, isPendingExecution, sessionEnded, config, currency, isRunning, lastDigitTicks, toast]);

    React.useEffect(() => {
        if (!isRunning || !entryLogic || sessionEnded || isPendingExecution || !isAuthorized) return;

        if (entryLogic.canTrade) {
            setStatusMessage('ENGAGING OVER 1');
            setIsPendingExecution(true);
            onExecuteTrade({ 
                stake: currentStake, 
                barrier: "1", 
                contract_type: "DIGITOVER" 
            });
        } else {
            setStatusMessage('FILTER ACTIVE: SKIP');
        }
    }, [lastDigitTicks, isRunning, sessionEnded, isPendingExecution, isAuthorized, entryLogic, currentStake, onExecuteTrade]);

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
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 pb-4">
            <div className="xl:col-span-1 space-y-2">
                <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden border-l-4 border-primary">
                    <CardHeader className="p-3 pb-1">
                        <div className="text-center">
                            <p className="text-[7px] font-black text-primary uppercase tracking-[0.3em]">EQUITY VECTOR</p>
                            <p className="text-xl font-black text-white tabular-nums">{isAuthorized ? balance.toFixed(2) : 'LOCKED'}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-1 space-y-2">
                        {!isRunning ? (
                            <Button 
                                onClick={() => setIsRunning(true)} 
                                disabled={sessionEnded || !isAuthorized} 
                                className="w-full h-10 rounded-xl font-black text-[9px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                            >
                                <Play className="h-3.5 w-3.5 mr-2 fill-current" /> START OVER 1 BOT
                            </Button>
                        ) : (
                            <Button 
                                onClick={stopTrading} 
                                className="w-full h-10 rounded-xl font-black text-[9px] uppercase tracking-widest bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                            >
                                <Square className="h-3.5 w-3.5 mr-2" /> STOP EXECUTION
                            </Button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                                <p className="text-[6px] font-black text-emerald-400 uppercase tracking-widest">WINS</p>
                                <p className="text-sm font-black text-emerald-400">{sessionStats.wins}</p>
                            </div>
                            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center">
                                <p className="text-[6px] font-black text-rose-400 uppercase tracking-widest">LOSSES</p>
                                <p className="text-sm font-black text-rose-400">{sessionStats.losses}</p>
                            </div>
                        </div>
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-center">
                            <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-1">SESSION PROFIT</p>
                            <p className={cn("text-lg font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                {sessionStats.profit.toFixed(2)}
                            </p>
                        </div>
                        <Button variant="outline" onClick={resetSession} className="w-full h-8 text-[7px] font-black uppercase tracking-widest border-white/10 text-white hover:bg-white/5 rounded-lg">
                            <RotateCcw className="h-3 w-3 mr-2" /> REBOOT ENGINE
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl rounded-[1.5rem] p-3 space-y-2 border border-white/5">
                    <div className="space-y-2">
                        <Label className="text-[8px] font-black text-primary uppercase tracking-[0.3em] ml-1">MARKET VECTOR</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-10 bg-black/40 border-white/10 rounded-xl text-[9px] font-black text-white px-4"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-950 border-white/10 text-white">
                                {syntheticIndices.map(m => <SelectItem key={m.id} value={m.id} className="text-[10px] font-bold">{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="space-y-1">
                                <Label className="text-[7px] uppercase text-slate-400 tracking-widest ml-1">STAKE</Label>
                                <Input type="number" value={config.stake} onChange={e => updateConfig('stake', e.target.value)} className="h-8 bg-black/60 border-white/10 text-white font-black text-center text-[10px] rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[7px] uppercase text-slate-400 tracking-widest ml-1">MARTINGALE</Label>
                                <Input type="number" step="0.1" value={config.martingale} onChange={e => updateConfig('martingale', e.target.value)} className="h-8 bg-black/60 border-white/10 text-white font-black text-center text-[10px] rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[7px] uppercase text-slate-400 tracking-widest ml-1">TP ($)</Label>
                                <Input type="number" value={config.takeProfit} onChange={e => updateConfig('takeProfit', e.target.value)} className="h-8 bg-black/60 border-white/10 text-white font-black text-center text-[10px] rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[7px] uppercase text-slate-400 tracking-widest ml-1">SL ($)</Label>
                                <Input type="number" value={config.stopLoss} onChange={e => updateConfig('stopLoss', e.target.value)} className="h-8 bg-black/60 border-white/10 text-white font-black text-center text-[10px] rounded-lg" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="xl:col-span-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden border border-white/5">
                        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
                            <h4 className="text-[8px] font-black uppercase text-white tracking-[0.3em] flex items-center gap-2"><Network className="h-3.5 w-3.5 text-primary" /> ANALYZER FEED</h4>
                            <Badge className="bg-primary/20 text-primary border-none text-[7px] font-black uppercase tracking-widest">NEURAL SYNC</Badge>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 flex items-center justify-around gap-2">
                            <div className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">DIGIT 2 (PREV)</p>
                                <p className={cn("text-2xl font-black tabular-nums", entryLogic && entryLogic.d2 <= 3 ? "text-rose-500" : "text-white")}>{entryLogic ? entryLogic.d2 : '-'}</p>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">DIGIT 1 (LATEST)</p>
                                <p className={cn("text-2xl font-black tabular-nums", entryLogic && entryLogic.d1 <= 3 ? "text-rose-500" : "text-white")}>{entryLogic ? entryLogic.d1 : '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden border border-white/5 flex flex-col justify-center items-center text-center p-3">
                         <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">BOT STATUS</p>
                         <div className="flex items-center gap-2">
                            {entryLogic?.shouldSkip ? (
                                <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                                    <ShieldAlert className="h-4 w-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">FILTER: SKIPPING CYCLE</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">SYNC: READY TO ENGAGE</span>
                                </div>
                            )}
                         </div>
                    </Card>
                </div>

                <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden border border-white/10 flex-1 flex flex-col h-full max-h-[500px]">
                    <Tabs defaultValue="transactions" className="w-full h-full flex flex-col overflow-hidden">
                        <div className="px-4 pt-2 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
                            <TabsList className="bg-transparent h-auto p-0 gap-6">
                                <TabsTrigger value="summary" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 data-[state=active]:text-white transition-all">SUMMARY</TabsTrigger>
                                <TabsTrigger value="transactions" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-black text-[9px] uppercase tracking-[0.2em] text-slate-500 data-[state=active]:text-white transition-all">TRANSACTIONS</TabsTrigger>
                            </TabsList>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    onClick={resetSession}
                                    className="h-6 px-3 text-[8px] font-black uppercase tracking-widest border-rose-500/50 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 rounded-lg"
                                >
                                    <RefreshCcw className="h-3 w-3" /> RESET SESSION
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <TabsContent value="transactions" className="flex-1 overflow-y-auto m-0 p-0 custom-scrollbar bg-transparent">
                                <div className="w-full">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-md z-10 border-b border-white/5">
                                            <tr className="text-[7px] font-black uppercase text-slate-500 tracking-[0.2em]">
                                                <th className="px-4 py-2">TYPE</th>
                                                <th className="px-4 py-2">ENTRY/EXIT SPOT</th>
                                                <th className="px-4 py-2 text-right">BUY PRICE AND P/L</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {trades.map((t) => (
                                                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Activity className="h-3.5 w-3.5 text-slate-600" />
                                                            {t.result === 'WON' ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> : <TrendingUp className="h-3.5 w-3.5 text-rose-500 rotate-180" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-2 bg-rose-500 rounded-sm" />
                                                                <span className="text-[10px] font-black text-white tabular-nums">{t.entrySpot}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 w-2 border border-slate-600 rounded-sm" />
                                                                <span className="text-[10px] font-black text-slate-400 tabular-nums">{t.exitSpot}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-300 tabular-nums">{t.stake.toFixed(2)} USD</p>
                                                            <p className={cn("text-[10px] font-black tabular-nums", t.result === 'WON' ? "text-emerald-400" : "text-rose-500")}>
                                                                {t.result === 'WON' ? `+${t.profit.toFixed(2)}` : t.profit.toFixed(2)} USD
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {trades.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-16 text-center opacity-20">
                                                        <TrendingUp className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                                                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Awaiting Neural Engagement</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </TabsContent>

                            <TabsContent value="summary" className="flex-1 m-0 p-6 flex items-center justify-center bg-transparent">
                                 <div className="text-center space-y-4 max-w-sm">
                                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-2">CYCLE WIN RATE</p>
                                        <p className="text-5xl font-black text-white tracking-tighter tabular-nums">
                                            {trades.length > 0 ? ((sessionStats.wins / trades.length) * 100).toFixed(0) : '0'}%
                                        </p>
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic px-4">
                                        "100+1 Accuracy Protocol active. Monitoring high-volatility streams for Zero-Error digit skew confirmation."
                                    </p>
                                 </div>
                            </TabsContent>
                        </div>

                        <div className="mt-auto border-t border-white/10 bg-black/40 p-3 sm:p-4 grid grid-cols-3 gap-y-3 sm:gap-y-4 shrink-0 shadow-inner">
                            <div className="text-center">
                                <p className="text-[6px] sm:text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL STAKE</p>
                                <p className="text-[10px] sm:text-xs font-black text-white tabular-nums">{sessionStats.totalStake.toFixed(2)} <span className="text-[8px] opacity-40">USD</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-[6px] sm:text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL PAYOUT</p>
                                <p className="text-[10px] sm:text-xs font-black text-white tabular-nums">{sessionStats.totalPayout.toFixed(2)} <span className="text-[8px] opacity-40">USD</span></p>
                            </div>
                            <div className="text-center relative">
                                <p className="text-[6px] sm:text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">NO. OF RUNS <Info className="h-2 w-2 opacity-40" /></p>
                                <p className="text-[10px] sm:text-xs font-black text-white tabular-nums">{trades.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[6px] sm:text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">CONTRACTS LOST</p>
                                <p className="text-[10px] sm:text-xs font-black text-rose-500 tabular-nums">{sessionStats.losses}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[6px] sm:text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">CONTRACTS WON</p>
                                <p className="text-[10px] sm:text-xs font-black text-emerald-400 tabular-nums">{sessionStats.wins}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[6px] sm:text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">TOTAL PROFIT/LOSS</p>
                                <p className={cn("text-[10px] sm:text-xs font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                    {sessionStats.profit >= 0 ? '+' : ''}{sessionStats.profit.toFixed(2)} <span className="text-[8px] opacity-40">USD</span>
                                </p>
                            </div>
                        </div>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}