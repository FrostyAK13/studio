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
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

    // Risk Management Watcher
    React.useEffect(() => {
        if (!isRunning || sessionEnded) return;

        if (sessionStats.profit >= config.takeProfit) {
            setIsRunning(false);
            setSessionEnded(true);
            setStatusMessage('TAKE PROFIT REACHED');
            setTimeout(() => {
                toast({ title: "TAKE PROFIT REACHED", description: `Cycle completed at +${sessionStats.profit.toFixed(2)} ${currency}` });
            }, 100);
        } else if (sessionStats.profit <= -config.stopLoss) {
            setIsRunning(false);
            setSessionEnded(true);
            setStatusMessage('STOP LOSS TRIGGERED');
            setTimeout(() => {
                toast({ variant: "destructive", title: "STOP LOSS TRIGGERED", description: `Cycle halted at ${sessionStats.profit.toFixed(2)} ${currency}` });
            }, 100);
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
                return [newTrade, ...prev].slice(0, 100);
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
        
        // Strict Double-Guard Threshold Check
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

    return (
        <div className="flex flex-col gap-2 pb-8 h-full max-w-[1600px] mx-auto scale-[0.85] origin-top">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
                <Card className="lg:col-span-1 border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[1rem] overflow-hidden border border-white/5">
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
                                className="w-full h-9 rounded-xl font-black text-[9px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                            >
                                <Play className="h-3 w-3 mr-2 fill-current" /> START OVER 1 BOT
                            </Button>
                        ) : (
                            <Button 
                                onClick={stopTrading} 
                                className="w-full h-9 rounded-xl font-black text-[9px] uppercase tracking-widest bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                            >
                                <Square className="h-3 w-3 mr-2" /> STOP EXECUTION
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
                        <div className="p-2 bg-black/40 rounded-xl border border-white/5 text-center">
                            <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">SESSION PROFIT</p>
                            <p className={cn("text-lg font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                {sessionStats.profit.toFixed(2)}
                            </p>
                        </div>
                        <Button variant="outline" onClick={resetSession} className="w-full h-7 text-[7px] font-black uppercase tracking-widest border-white/10 text-white hover:bg-white/5 rounded-lg">
                            <RotateCcw className="h-2.5 w-2.5 mr-2" /> REBOOT ENGINE
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl rounded-[1rem] p-3 border border-white/5 flex flex-col justify-center">
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <Label className="text-[8px] font-black text-primary uppercase tracking-[0.3em] ml-1">MARKET VECTOR</Label>
                            <Select value={selectedMarket} onValueChange={onMarketChange}>
                                <SelectTrigger className="h-9 bg-black/40 border-white/10 rounded-xl text-[9px] font-black text-white px-4"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-950 border-white/10 text-white">
                                    {syntheticIndices.map(m => <SelectItem key={m.id} value={m.id} className="text-[10px] font-bold">{m.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[7px] uppercase text-slate-400 tracking-widest ml-1">STAKE</Label>
                                <Input type="number" value={config.stake} onChange={e => updateConfig('stake', e.target.value)} className="h-8 bg-black/60 border-white/10 text-white font-black text-center text-[10px] rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[7px] uppercase text-slate-400 tracking-widest ml-1">MARTINGALE</Label>
                                <Input type="number" step="0.1" value={config.martingale} onChange={e => updateConfig('martingale', e.target.value)} className="h-8 bg-black/60 border-white/10 text-white font-black text-center text-[10px] rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[7px] uppercase text-slate-400 tracking-widest ml-1">TAKE PROFIT</Label>
                                <Input type="number" value={config.takeProfit} onChange={e => updateConfig('takeProfit', e.target.value)} className="h-8 bg-black/60 border-white/10 text-white font-black text-center text-[10px] rounded-lg" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[7px] uppercase text-slate-400 tracking-widest ml-1">STOP LOSS</Label>
                                <Input type="number" value={config.stopLoss} onChange={e => updateConfig('stopLoss', e.target.value)} className="h-8 bg-black/60 border-white/10 text-white font-black text-center text-[10px] rounded-lg" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[1rem] overflow-hidden border border-white/5">
                    <div className="p-2 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <h4 className="text-[7px] font-black uppercase text-white tracking-[0.3em] flex items-center gap-1.5"><Network className="h-3 w-3 text-primary" /> ANALYZER FEED</h4>
                        <Badge className={cn(
                            "border-none text-[6px] font-black uppercase tracking-widest transition-all duration-300",
                            entryLogic?.canTrade && isRunning 
                                ? "bg-emerald-500/20 text-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.4)]" 
                                : "bg-primary/20 text-primary"
                        )}>
                            NEURAL SYNC
                        </Badge>
                    </div>
                    <CardContent className="p-3 flex items-center justify-around gap-2">
                        <div className="text-center">
                            <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">DIGIT 2 (PREV)</p>
                            <p className={cn("text-2xl font-black tabular-nums leading-none", entryLogic && entryLogic.d2 <= 3 ? "text-rose-500" : "text-white")}>{entryLogic ? entryLogic.d2 : '-'}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="text-center">
                            <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">DIGIT 1 (LATEST)</p>
                            <p className={cn("text-2xl font-black tabular-nums leading-none", entryLogic && entryLogic.d1 <= 3 ? "text-rose-500" : "text-white")}>{entryLogic ? entryLogic.d1 : '-'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[1rem] overflow-hidden border border-white/5 flex flex-col justify-center items-center text-center p-3">
                     <p className="text-[7px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">LIVE MARKET PRICE</p>
                     <div className="bg-primary/10 px-4 py-1.5 rounded-xl border border-primary/20">
                        <p className="text-2xl font-black text-white tabular-nums tracking-tighter">
                            {price === 0 ? '---' : price.toFixed(decimalPlaces)}
                        </p>
                     </div>
                </Card>

                <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl rounded-[1rem] overflow-hidden border border-white/5 flex flex-col justify-center items-center text-center p-3">
                     <p className="text-[7px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">BOT STATUS</p>
                     <div className="flex items-center gap-2">
                        {entryLogic?.shouldSkip && isRunning ? (
                            <div className="flex items-center gap-1.5 text-rose-500 animate-pulse">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                <span className="text-[8px] font-black uppercase tracking-widest">FILTER: SKIPPING CYCLE</span>
                            </div>
                        ) : isRunning ? (
                            <div className="flex items-center gap-1.5 text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5 animate-bounce" />
                                <span className="text-[8px] font-black uppercase tracking-widest">SYNC: READY TO ENGAGE</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <Square className="h-3 w-3" />
                                <span className="text-[8px] font-black uppercase tracking-widest">ENGINE: {statusMessage}</span>
                            </div>
                        )}
                     </div>
                </Card>
            </div>

            <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-3xl rounded-[1rem] overflow-hidden border border-white/10 flex flex-col">
                <Tabs defaultValue="transactions" className="w-full flex flex-col">
                    <div className="px-4 pt-2 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <TabsList className="bg-transparent h-auto p-0 gap-6">
                            <TabsTrigger value="summary" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-black text-[8px] uppercase tracking-[0.2em] text-slate-500 data-[state=active]:text-white transition-all">SUMMARY</TabsTrigger>
                            <TabsTrigger value="transactions" className="px-0 py-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none font-black text-[8px] uppercase tracking-[0.2em] text-slate-500 data-[state=active]:text-white transition-all">TRANSACTIONS</TabsTrigger>
                        </TabsList>
                        <Button 
                            variant="outline" 
                            onClick={resetSession}
                            className="h-6 px-3 text-[7px] font-black uppercase tracking-widest border-rose-500/50 text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 rounded-lg"
                        >
                            <RefreshCcw className="h-2.5 w-2.5" /> RESET SESSION
                        </Button>
                    </div>

                    <div className="flex flex-col">
                        <TabsContent value="transactions" className="m-0 p-0 bg-transparent">
                            <div className="w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-900/80 backdrop-blur-md border-b border-white/5">
                                        <tr className="text-[6px] font-black uppercase text-slate-500 tracking-[0.2em]">
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
                                                        <Activity className="h-3 w-3 text-slate-600" />
                                                        {t.result === 'WON' ? <TrendingUp className="h-3 w-3 text-emerald-400" /> : <TrendingUp className="h-3 w-3 text-rose-500 rotate-180" />}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 bg-rose-500 rounded-full" />
                                                            <span className="text-[9px] font-black text-white tabular-nums">{t.entrySpot}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 border border-slate-600 rounded-full" />
                                                            <span className="text-[9px] font-black text-slate-400 tabular-nums">{t.exitSpot}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-slate-300 tabular-nums">{t.stake.toFixed(2)} USD</p>
                                                        <p className={cn("text-[9px] font-black tabular-nums", t.result === 'WON' ? "text-emerald-400" : "text-rose-500")}>
                                                            {t.result === 'WON' ? `+${t.profit.toFixed(2)}` : t.profit.toFixed(2)} USD
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {trades.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-12 text-center opacity-20">
                                                    <Zap className="h-10 w-10 mx-auto mb-2 text-slate-400" />
                                                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Awaiting Tactical Engagement</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="summary" className="m-0 p-10 flex items-center justify-center bg-transparent">
                             <div className="text-center space-y-4 max-w-sm">
                                <div className="p-6 bg-white/5 rounded-[1.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-2">CYCLE WIN RATE</p>
                                    <p className="text-5xl font-black text-white tracking-tighter tabular-nums">
                                        {trades.length > 0 ? ((sessionStats.wins / trades.length) * 100).toFixed(0) : '0'}%
                                    </p>
                                </div>
                                <p className="text-[9px] font-medium text-slate-400 leading-relaxed italic px-4">
                                    "100+1 Accuracy Protocol active. Monitoring high-volatility streams for Zero-Error digit skew confirmation."
                                </p>
                             </div>
                        </TabsContent>
                    </div>

                    <div className="mt-auto border-t border-white/10 bg-black/40 p-3 grid grid-cols-3 gap-y-3 shrink-0 shadow-inner">
                        <div className="text-center">
                            <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">TOTAL STAKE</p>
                            <p className="text-[9px] font-black text-white tabular-nums">{sessionStats.totalStake.toFixed(2)} <span className="text-[7px] opacity-40">USD</span></p>
                        </div>
                        <div className="text-center">
                            <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">TOTAL PAYOUT</p>
                            <p className="text-[9px] font-black text-white tabular-nums">{sessionStats.totalPayout.toFixed(2)} <span className="text-[7px] opacity-40">USD</span></p>
                        </div>
                        <div className="text-center">
                            <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">NO. OF RUNS</p>
                            <p className="text-[9px] font-black text-white tabular-nums">{trades.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">CONTRACTS LOST</p>
                            <p className="text-[9px] font-black text-rose-500 tabular-nums">{sessionStats.losses}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">CONTRACTS WON</p>
                            <p className="text-[9px] font-black text-emerald-400 tabular-nums">{sessionStats.wins}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest mb-0.5">TOTAL PROFIT/LOSS</p>
                            <p className={cn("text-[9px] font-black tabular-nums", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                {sessionStats.profit >= 0 ? '+' : ''}{sessionStats.profit.toFixed(2)} <span className="text-[7px] opacity-40">USD</span>
                            </p>
                        </div>
                    </div>
                </Tabs>
            </Card>
        </div>
    );
}
