
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
    Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    digits: string;
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
    const [sessionStats, setSessionStats] = React.useState({ wins: 0, losses: 0, profit: 0 });
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
            
            // Capture digits at point of settlement
            const analyzedDigitsString = `${lastDigitTicks[1]},${lastDigitTicks[0]}`;
            
            const newTrade: TradeLog = { 
                id: contractId, 
                time: new Date().toLocaleTimeString(), 
                type: 'OVER 1', 
                result, 
                stake: parseFloat(activeContract.buy_price), 
                profit: profitValue,
                digits: analyzedDigitsString
            };
            
            setTrades(prev => {
                if (prev.some(t => t.id === contractId)) return prev;
                return [newTrade, ...prev].slice(0, 50);
            });
            
            setSessionStats(prev => {
                const newProfit = prev.profit + profitValue;
                const newWins = result === 'WON' ? prev.wins + 1 : prev.wins;
                const newLosses = result === 'LOST' ? prev.losses + 1 : prev.losses;
                
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

                return { wins: newWins, losses: newLosses, profit: newProfit };
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
        setSessionStats({ wins: 0, losses: 0, profit: 0 }); 
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
                                START BOT
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
                        <Button variant="outline" onClick={resetSession} className="w-full h-6 text-[6px] font-black uppercase tracking-widest border-white/10 text-white hover:bg-white/5">REBOOT ENGINE</Button>
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

            <div className="xl:col-span-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <Card className="border-none shadow-xl bg-slate-900/40 rounded-xl overflow-hidden border border-white/5">
                        <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
                            <h4 className="text-[7px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5"><Network className="h-3 w-3" /> ANALYZER FEED</h4>
                            <Badge className="bg-primary/10 text-primary border-none text-[6px] font-black uppercase">NEURAL SYNC</Badge>
                        </CardHeader>
                        <CardContent className="p-3 pt-1 flex items-center justify-around gap-2">
                            <div className="text-center">
                                <p className="text-[6px] font-black text-muted-foreground uppercase mb-1">DIGIT 2 (PREV)</p>
                                <p className={cn("text-xl font-black", entryLogic && entryLogic.d2 <= 3 ? "text-rose-500" : "text-white")}>{entryLogic ? entryLogic.d2 : '-'}</p>
                            </div>
                            <div className="h-8 w-px bg-white/5" />
                            <div className="text-center">
                                <p className="text-[6px] font-black text-muted-foreground uppercase mb-1">DIGIT 1 (LATEST)</p>
                                <p className={cn("text-xl font-black", entryLogic && entryLogic.d1 <= 3 ? "text-rose-500" : "text-white")}>{entryLogic ? entryLogic.d1 : '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-xl bg-slate-900/40 rounded-xl overflow-hidden border border-white/5 flex flex-col justify-center items-center text-center p-3">
                         <p className="text-[7px] font-black uppercase text-primary tracking-widest mb-1">BOT STATUS</p>
                         <div className="flex items-center gap-2">
                            {entryLogic?.shouldSkip ? (
                                <div className="flex items-center gap-2 text-rose-500 animate-pulse">
                                    <ShieldAlert className="h-4 w-4" />
                                    <span className="text-[8px] font-black uppercase">SKEW: SKIP</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[8px] font-black uppercase">SYNC: READY</span>
                                </div>
                            )}
                         </div>
                    </Card>
                </div>

                <Card className="border-none shadow-2xl bg-slate-950 rounded-xl overflow-hidden border border-white/5 flex-1 min-h-[350px] flex flex-col">
                    <CardHeader className="p-3 flex flex-row items-center justify-between border-b border-white/5">
                        <CardTitle className="text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> TACTICAL BOT LOG</CardTitle>
                        <Badge className={cn("h-5 px-2 rounded-md text-[6px] font-black uppercase tracking-widest border-none", isRunning || isPendingExecution ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : "bg-black/60 text-muted-foreground")}>
                            {statusMessage}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="space-y-1.5">
                            {trades.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-2 bg-black/40 border border-white/5 rounded-lg transition-all hover:bg-black/60">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-5 h-5 rounded flex items-center justify-center", t.result === 'WON' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                                            {t.result === 'WON' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-white">CONTRACT: {t.id}</p>
                                            <p className="text-[5px] text-muted-foreground font-mono uppercase">ANALYZED DIGITS: [{t.digits}] • {t.time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-[9px] font-black tabular-nums", t.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                            {t.profit >= 0 ? '+' : ''}{t.profit.toFixed(2)}
                                        </p>
                                        <Badge className={cn("text-[4px] px-1 h-2.5 border-none font-black uppercase", t.result === 'WON' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                                            {t.result}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {trades.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 opacity-10">
                                    <TrendingUp className="h-12 w-12 mb-2" />
                                    <p className="text-[7px] uppercase font-black tracking-[0.4em]">Awaiting Automated Execution</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

