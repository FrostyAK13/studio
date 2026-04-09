
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
    Info
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

    // Entry Logic Filter: If both Digit_1 <= 3 AND Digit_2 <= 3 -> SKIP. Otherwise -> EXECUTE Over 1.
    const entryLogic = React.useMemo(() => {
        if (lastDigitTicks.length < 2) return null;
        const d1 = lastDigitTicks[0]; // Latest
        const d2 = lastDigitTicks[1]; // Previous
        const shouldSkip = d1 <= 3 && d2 <= 3;
        return { d1, d2, shouldSkip, canTrade: !shouldSkip };
    }, [lastDigitTicks]);

    // Trade Result Processing & Money Management
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
                
                // Risk Management Check
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

            // Martingale recovery logic
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

    // Automated Execution Loop
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
                <Card className="border-none shadow-xl bg-slate-950 rounded-xl overflow-hidden border-l-2 border-primary">
                    <CardHeader className="p-2 pb-1">
                        <div className="text-center">
                            <p className="text-[6px] font-black text-primary uppercase tracking-[0.3em]">EQUITY VECTOR</p>
                            <p className="text-base font-black text-white">{isAuthorized ? balance.toFixed(2) : 'LOCKED'}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2 pt-1 space-y-2">
                        {!isRunning ? (
                            <Button 
                                onClick={() => setIsRunning(true)} 
                                disabled={sessionEnded || !isAuthorized} 
                                className="w-full h-8 rounded-lg font-black text-[8px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                            >
                                <Play className="h-3 w-3 mr-2 fill-current" /> START BOT
                            </Button>
                        ) : (
                            <Button 
                                onClick={stopTrading} 
                                className="w-full h-8 rounded-lg font-black text-[8px] uppercase tracking-widest bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                            >
                                <Square className="h-3 w-3 mr-2" /> STOP BOT
                            </Button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-1.5">
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center">
                                <p className="text-[5px] font-black text-emerald-400 uppercase">WINS</p>
                                <p className="text-xs font-black text-emerald-400">{sessionStats.wins}</p>
                            </div>
                            <div className="p-1.5 bg-rose-500/10 rounded-lg border border-rose-500/20 text-center">
                                <p className="text-[5px] font-black text-rose-400 uppercase">LOSSES</p>
                                <p className="text-xs font-black text-rose-400">{sessionStats.losses}</p>
                            </div>
                        </div>
                        <div className="p-2 bg-black/40 rounded-lg border border-white/5 text-center">
                            <p className="text-[6px] font-black text-muted-foreground uppercase mb-0.5">SESSION PROFIT</p>
                            <p className={cn("text-base font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                {sessionStats.profit.toFixed(2)}
                            </p>
                        </div>
                        <Button variant="outline" onClick={resetSession} className="w-full h-6 text-[6px] font-black uppercase tracking-widest border-white/10 text-white hover:bg-white/5">
                            <RotateCcw className="h-2 w-2 mr-1.5" /> REBOOT ENGINE
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-slate-900/40 backdrop-blur-xl rounded-xl p-3 space-y-2">
                    <div className="space-y-1.5">
                        <Label className="text-[7px] font-black text-primary uppercase">MARKET</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-7 bg-black/40 border-white/10 rounded-lg text-[8px] font-black text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-950 border-white/10 text-white">
                                {syntheticIndices.map(m => <SelectItem key={m.id} value={m.id} className="text-[9px] font-bold">{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                            <div className="space-y-0.5">
                                <Label className="text-[6px] uppercase text-white">STAKE</Label>
                                <Input type="number" value={config.stake} onChange={e => updateConfig('stake', e.target.value)} className="h-6 bg-black border-white/10 text-white font-black text-center text-[10px]" />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[6px] uppercase text-white">MARTINGALE</Label>
                                <Input type="number" step="0.1" value={config.martingale} onChange={e => updateConfig('martingale', e.target.value)} className="h-6 bg-black border-white/10 text-white font-black text-center text-[10px]" />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[6px] uppercase text-white">TP ($)</Label>
                                <Input type="number" value={config.takeProfit} onChange={e => updateConfig('takeProfit', e.target.value)} className="h-6 bg-black border-white/10 text-white font-black text-center text-[10px]" />
                            </div>
                            <div className="space-y-0.5">
                                <Label className="text-[6px] uppercase text-white">SL ($)</Label>
                                <Input type="number" value={config.stopLoss} onChange={e => updateConfig('stopLoss', e.target.value)} className="h-6 bg-black border-white/10 text-white font-black text-center text-[10px]" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="xl:col-span-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-200">
                        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
                            <h4 className="text-[7px] font-black uppercase text-slate-950 tracking-widest flex items-center gap-1.5"><Network className="h-3 w-3" /> ANALYZER FEED</h4>
                            <Badge className="bg-primary/10 text-primary border-none text-[6px] font-black uppercase">NEURAL SYNC</Badge>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 flex items-center justify-around gap-2">
                            <div className="text-center">
                                <p className="text-[6px] font-black text-muted-foreground uppercase mb-1">DIGIT 2 (PREV)</p>
                                <p className={cn("text-xl font-black", entryLogic && entryLogic.d2 <= 3 ? "text-rose-500" : "text-slate-950")}>{entryLogic ? entryLogic.d2 : '-'}</p>
                            </div>
                            <div className="h-8 w-px bg-slate-200" />
                            <div className="text-center">
                                <p className="text-[6px] font-black text-muted-foreground uppercase mb-1">DIGIT 1 (LATEST)</p>
                                <p className={cn("text-xl font-black", entryLogic && entryLogic.d1 <= 3 ? "text-rose-500" : "text-slate-950")}>{entryLogic ? entryLogic.d1 : '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-200 flex flex-col justify-center items-center text-center p-3">
                         <p className="text-[7px] font-black uppercase text-slate-950 tracking-widest mb-1">BOT STATUS</p>
                         <div className="flex items-center gap-2">
                            {entryLogic?.shouldSkip ? (
                                <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                                    <ShieldAlert className="h-4 w-4" />
                                    <span className="text-[8px] font-black uppercase">SKEW: SKIP</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[8px] font-black uppercase">SYNC: READY</span>
                                </div>
                            )}
                         </div>
                    </Card>
                </div>

                <Card className="border-none shadow-2xl bg-white rounded-xl overflow-hidden border border-slate-200 flex-1 min-h-[400px] flex flex-col">
                    <Tabs defaultValue="transactions" className="w-full h-full flex flex-col">
                        <div className="px-4 pt-2 border-b border-slate-100 flex items-center justify-between">
                            <TabsList className="bg-transparent h-auto p-0 gap-6">
                                <TabsTrigger value="summary" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-bold text-[9px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-950">Summary</TabsTrigger>
                                <TabsTrigger value="transactions" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-bold text-[9px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-950">Transactions</TabsTrigger>
                                <TabsTrigger value="journal" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-bold text-[9px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-950">Journal</TabsTrigger>
                            </TabsList>
                            <div className="flex gap-2">
                                <Button variant="outline" className="h-6 px-2 text-[7px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-600 hover:bg-emerald-50">Download</Button>
                                <Button variant="outline" className="h-6 px-2 text-[7px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-600 hover:bg-emerald-50">View Detail</Button>
                            </div>
                        </div>

                        <TabsContent value="transactions" className="flex-1 overflow-y-auto m-0 p-0 custom-scrollbar">
                            <div className="w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-100">
                                        <tr className="text-[7px] font-black uppercase text-slate-400 tracking-wider">
                                            <th className="px-4 py-2">Type</th>
                                            <th className="px-4 py-2">Entry/Exit spot</th>
                                            <th className="px-4 py-2 text-right">Buy price and P/L</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {trades.map((t) => (
                                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="h-3 w-3 text-slate-400" />
                                                        {t.result === 'WON' ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingUp className="h-3 w-3 text-rose-500 rotate-180" />}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Circle className="h-1.5 w-1.5 fill-rose-500 text-rose-500" />
                                                            <span className="text-[9px] font-bold text-slate-600 tabular-nums">{t.entrySpot}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Circle className="h-1.5 w-1.5 text-slate-300" />
                                                            <span className="text-[9px] font-bold text-slate-600 tabular-nums">{t.exitSpot}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-slate-600">{t.stake.toFixed(2)} USD</p>
                                                        <p className={cn("text-[9px] font-black", t.result === 'WON' ? "text-emerald-500" : "text-rose-500")}>
                                                            {t.result === 'WON' ? `+${t.profit.toFixed(2)}` : t.profit.toFixed(2)} USD
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {trades.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-20 text-center opacity-20">
                                                    <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                                                    <p className="text-[8px] font-black uppercase tracking-widest">Awaiting Transactions</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="summary" className="flex-1 m-0 p-6 flex items-center justify-center">
                             <div className="text-center space-y-4 max-w-xs">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Cycle Win Rate</p>
                                    <p className="text-3xl font-black text-slate-950">
                                        {trades.length > 0 ? ((sessionStats.wins / trades.length) * 100).toFixed(0) : '0'}%
                                    </p>
                                </div>
                                <p className="text-[9px] font-medium text-slate-500 leading-relaxed italic">
                                    "Neural Sync protocol active. Monitoring Volatility Index for Digit Skew confirmation."
                                </p>
                             </div>
                        </TabsContent>

                        <div className="mt-auto border-t border-slate-100 bg-slate-50/50 p-4 grid grid-cols-3 gap-y-4">
                            <div className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Total stake</p>
                                <p className="text-[10px] font-black text-slate-600">{sessionStats.totalStake.toFixed(2)} USD</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Total payout</p>
                                <p className="text-[10px] font-black text-slate-600">{sessionStats.totalPayout.toFixed(2)} USD</p>
                            </div>
                            <div className="text-center relative">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">No. of runs <Info className="h-2 w-2" /></p>
                                <p className="text-[10px] font-black text-slate-600">{trades.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Contracts lost</p>
                                <p className="text-[10px] font-black text-slate-600">{sessionStats.losses}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Contracts won</p>
                                <p className="text-[10px] font-black text-slate-600">{sessionStats.wins}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Total profit/loss</p>
                                <p className={cn("text-[10px] font-black", sessionStats.profit >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                    {sessionStats.profit >= 0 ? `+${sessionStats.profit.toFixed(2)}` : sessionStats.profit.toFixed(2)} USD
                                </p>
                            </div>
                        </div>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
