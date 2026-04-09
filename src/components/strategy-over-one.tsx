
'use client';

import * as React from 'react';
import { 
    Zap, 
    Activity, 
    Cpu, 
    ArrowUpRight, 
    ArrowDownRight, 
    Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

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
    isRecovery: boolean;
}

export function StrategyOverOne({ 
    price, lastDigitTicks, selectedMarket, onMarketChange, decimalPlaces, balance, 
    isAuthorized, currency, onExecuteTrade, activeContract, surveillanceStatus, executionStatus
}: StrategyOverOneProps) {
    const [config, setConfig] = React.useState({ stake: 2, stopLoss: 10, takeProfit: 5, martingale: 2.5 });
    const [isRunning, setIsRunning] = React.useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = React.useState(false);
    const [sessionEnded, setSessionEnded] = React.useState(false);
    const [trades, setTrades] = React.useState<TradeLog[]>([]);
    const [sessionStats, setSessionStats] = React.useState({ wins: 0, losses: 0, profit: 0 });
    const [statusMessage, setStatusMessage] = React.useState('ENGINE STANDBY');
    const [isPendingExecution, setIsPendingExecution] = React.useState(false);
    
    const lastProcessedId = React.useRef<string | null>(null);

    const strategyAnalysis = React.useMemo(() => {
        if (lastDigitTicks.length < 20) return null;
        const cond0 = [lastDigitTicks[2], lastDigitTicks[3], lastDigitTicks[4]].includes(0);
        const cond1 = ![lastDigitTicks[4], lastDigitTicks[5], lastDigitTicks[6]].includes(1);
        const cond67 = [lastDigitTicks[0], lastDigitTicks[1], lastDigitTicks[2]].some(t => t === 6 || t === 7);
        return { cond0, cond1, cond67, allSystemsGo: cond0 && cond1 && cond67 };
    }, [lastDigitTicks]);

    React.useEffect(() => {
        if (!activeContract || !isPendingExecution) return;
        const contractId = activeContract.contract_id.toString();
        if ((activeContract.status === 'won' || activeContract.status === 'lost') && contractId !== lastProcessedId.current) {
            lastProcessedId.current = contractId;
            const result = activeContract.status.toUpperCase() as 'WON' | 'LOST';
            const profitValue = parseFloat(activeContract.profit);
            const newTrade: TradeLog = { id: contractId, time: new Date().toLocaleTimeString(), type: 'OVER 1', result, stake: parseFloat(activeContract.buy_price), profit: profitValue, isRecovery: isRecoveryMode };
            
            setTrades(prev => prev.some(t => t.id === contractId) ? prev : [newTrade, ...prev].slice(0, 50));
            setSessionStats(prev => ({ wins: result === 'WON' ? prev.wins + 1 : prev.wins, losses: result === 'LOST' ? prev.losses + 1 : prev.losses, profit: prev.profit + profitValue }));
            setIsRecoveryMode(result !== 'WON');
            setIsPendingExecution(false);
            setStatusMessage('CYCLE SETTLED');
            
            setTimeout(() => { if (!sessionEnded) { setIsRunning(true); setStatusMessage('MONITORING TICKS...'); } }, 2000);
        }
    }, [activeContract, isPendingExecution, isRecoveryMode, sessionEnded]);

    React.useEffect(() => {
        if (!isRunning || !strategyAnalysis || sessionEnded || isPendingExecution || !isAuthorized) return;
        if (sessionStats.profit >= config.takeProfit || sessionStats.profit <= -config.stopLoss) {
            setIsRunning(false); setSessionEnded(true); setStatusMessage(sessionStats.profit >= config.takeProfit ? 'TP REACHED' : 'SL REACHED'); return;
        }
        if (strategyAnalysis.allSystemsGo) {
            setIsRunning(false); setIsPendingExecution(true); setStatusMessage('EXECUTING OVER 1');
            const currentStake = isRecoveryMode ? (config.stake * config.martingale) : config.stake;
            onExecuteTrade({ stake: currentStake, barrier: "1", contract_type: "DIGITOVER" });
        } else {
            setStatusMessage('WAITING FOR ENTRY...');
        }
    }, [lastDigitTicks, isRunning, sessionEnded, sessionStats.profit, config.takeProfit, config.stopLoss, strategyAnalysis, isPendingExecution, isAuthorized]);

    const resetSession = () => {
        setTrades([]); setSessionStats({ wins: 0, losses: 0, profit: 0 }); setIsRecoveryMode(false);
        setIsRunning(false); setSessionEnded(false); setIsPendingExecution(false); setStatusMessage('ENGINE STANDBY'); lastProcessedId.current = null;
    };

    const updateConfig = (field: keyof typeof config, value: string) => {
        const num = parseFloat(value); if (!isNaN(num)) setConfig(prev => ({ ...prev, [field]: num }));
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 pb-10">
            <div className="xl:col-span-1 space-y-3">
                <Card className="border-none shadow-xl bg-slate-950 rounded-2xl overflow-hidden border-l-2 border-primary">
                    <CardHeader className="p-4 pb-2">
                        <div className="text-center"><p className="text-[7px] font-black text-primary uppercase tracking-[0.3em]">EQUITY</p><p className="text-lg font-black text-white">{isAuthorized ? balance.toFixed(2) : 'LOCKED'}</p></div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3">
                        <Button onClick={() => setIsRunning(!isRunning)} disabled={sessionEnded || isPendingExecution || !isAuthorized} className={cn("w-full h-12 rounded-xl font-black text-[9px] uppercase tracking-widest", isRunning ? "bg-rose-500" : "bg-emerald-500")}>
                            {isPendingExecution ? <Activity className="animate-spin h-4 w-4" /> : isRunning ? "STOP ENGINE" : "ENGAGE 100+1"}
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-center"><p className="text-[6px] font-black text-emerald-400 uppercase">WINS</p><p className="text-xs font-black text-emerald-400">{sessionStats.wins}</p></div>
                            <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-center"><p className="text-[6px] font-black text-rose-400 uppercase">LOSSES</p><p className="text-xs font-black text-rose-400">{sessionStats.losses}</p></div>
                        </div>
                        <div className="p-2 bg-black/40 rounded-xl border border-white/5 text-center"><p className="text-[7px] font-black text-muted-foreground uppercase mb-0.5">ROI</p><p className={cn("text-lg font-black", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>{sessionStats.profit.toFixed(2)}</p></div>
                        <Button variant="outline" onClick={resetSession} className="w-full h-7 text-[7px] font-black uppercase tracking-widest border-white/10 text-white">REBOOT CORE</Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 space-y-3">
                    <div className="space-y-2">
                        <Label className="text-[8px] font-black text-primary uppercase">MARKET VECTOR</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-8 bg-black/40 border-white/10 rounded-lg text-[9px] font-black text-white"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-slate-950 border-white/10 text-white">
                                {syntheticIndices.map(m => <SelectItem key={m.id} value={m.id} className="text-[10px] font-bold">{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="space-y-1"><Label className="text-[7px] uppercase text-white">STAKE</Label><Input type="number" value={config.stake} onChange={e => updateConfig('stake', e.target.value)} className="h-7 bg-black border-white/10 text-white font-black text-center text-[10px]" /></div>
                            <div className="space-y-1"><Label className="text-[7px] uppercase text-white">RECOVERY</Label><Input type="number" step="0.1" value={config.martingale} onChange={e => updateConfig('martingale', e.target.value)} className="h-7 bg-black border-white/10 text-white font-black text-center text-[10px]" /></div>
                            <div className="space-y-1"><Label className="text-[7px] uppercase text-white">TP</Label><Input type="number" value={config.takeProfit} onChange={e => updateConfig('takeProfit', e.target.value)} className="h-7 bg-black border-white/10 text-white font-black text-center text-[10px]" /></div>
                            <div className="space-y-1"><Label className="text-[7px] uppercase text-white">SL</Label><Input type="number" value={config.stopLoss} onChange={e => updateConfig('stopLoss', e.target.value)} className="h-7 bg-black border-white/10 text-white font-black text-center text-[10px]" /></div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="xl:col-span-3 space-y-3">
                <Card className="border-none shadow-xl bg-slate-900/40 rounded-2xl overflow-hidden border border-white/5">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between"><h4 className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Network className="h-3 w-3" /> NEURAL SYNC</h4><Badge className="bg-primary/10 text-primary border-none text-[7px] font-black uppercase">100+1 ACCURACY</Badge></CardHeader>
                    <CardContent className="p-4 pt-2 grid grid-cols-3 gap-2">
                        {[{ l: 'ALPHA', d: 'Digit 0 Flux', a: strategyAnalysis?.cond0 }, { l: 'BETA', d: 'No Digit 1', a: strategyAnalysis?.cond1 }, { l: 'GAMMA', d: '6/7 Momentum', a: strategyAnalysis?.cond67 }].map((c, i) => (
                            <div key={i} className={cn("p-3 rounded-xl border transition-all flex flex-col items-center justify-center text-center gap-0.5", c.a ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "bg-black/20 border-white/5 text-muted-foreground/20")}>
                                <p className="text-[6px] font-black tracking-widest">{c.l}</p>
                                <p className="text-[8px] font-black uppercase">{c.d}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-2xl bg-slate-950 rounded-2xl overflow-hidden border border-white/5">
                    <CardHeader className="p-4 flex flex-row items-center justify-between border-b border-white/5">
                        <CardTitle className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2"><Zap className="h-3 w-3 text-primary" /> CORE 1</CardTitle>
                        <Badge className={cn("h-6 px-3 rounded-lg text-[7px] font-black uppercase tracking-widest border-none", isRunning || isPendingExecution ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : "bg-black/60 text-muted-foreground")}>{isAuthorized ? statusMessage : "AUTH REQ"}</Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {lastDigitTicks.slice(0, 10).map((d, i) => (
                                <div key={i} className={cn("w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs sm:text-sm border transition-all", i === 0 ? "bg-primary border-primary text-white scale-110 shadow-lg" : "bg-black/40 border-white/5 text-white/20")}>{d}</div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1"><h4 className="text-[8px] font-black uppercase text-emerald-400 flex items-center gap-1.5"><Cpu className="h-3 w-3" /> EXECUTION LOG</h4></div>
                            <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                                {trades.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-2 bg-black/40 border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", t.result === 'WON' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>{t.result === 'WON' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}</div>
                                            <div><p className="text-[9px] font-black text-white">{t.type}</p><p className="text-[6px] text-muted-foreground font-mono">{t.time}</p></div>
                                        </div>
                                        <div className="text-right"><p className={cn("text-[10px] font-black", t.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>{t.profit >= 0 ? '+' : ''}{t.profit.toFixed(2)}</p><Badge className={cn("text-[5px] px-1.5 h-3 border-none", t.result === 'WON' ? "bg-emerald-500" : "bg-rose-500")}>{t.result}</Badge></div>
                                    </div>
                                ))}
                                {trades.length === 0 && <div className="text-center py-4 text-[7px] uppercase font-black text-white/10 tracking-[0.3em]">Awaiting Engagement</div>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

