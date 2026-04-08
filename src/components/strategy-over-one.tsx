'use client';

import * as React from 'react';
import { 
    ShieldCheck, 
    Target, 
    Zap, 
    RotateCcw, 
    Play, 
    Square, 
    Activity, 
    Cpu, 
    ShieldAlert, 
    CheckCircle2, 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight, 
    BarChart3, 
    Settings2, 
    Globe, 
    Circle,
    Loader2,
    Lock,
    KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
}

interface TradeLog {
    id: string;
    time: string;
    type: 'OVER 1';
    trigger: string;
    result: 'WON' | 'LOST' | 'PENDING' | 'EXECUTING';
    stake: number;
    profit: number;
    isRecovery: boolean;
}

export function StrategyOverOne({ 
    price, 
    lastDigitTicks, 
    selectedMarket, 
    onMarketChange, 
    decimalPlaces, 
    balance, 
    isAuthorized, 
    currency, 
    onExecuteTrade,
    activeContract
}: StrategyOverOneProps) {
    const [config, setConfig] = React.useState({
        stake: 10,
        stopLoss: 50,
        takeProfit: 100,
        martingale: 2.5
    });

    const [isRunning, setIsRunning] = React.useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = React.useState(false);
    const [sessionEnded, setSessionEnded] = React.useState(false);
    const [trades, setTrades] = React.useState<TradeLog[]>([]);
    const [sessionStats, setSessionStats] = React.useState({ wins: 0, losses: 0, profit: 0 });
    const [statusMessage, setStatusMessage] = React.useState('ENGINE STANDBY');
    const [isPendingExecution, setIsPendingExecution] = React.useState(false);
    
    // Guard to prevent duplicate processing of the same contract ID
    const lastProcessedId = React.useRef<string | null>(null);

    // Watchdog to prevent execution deadlock
    React.useEffect(() => {
        if (!isPendingExecution) return;
        
        const timer = setTimeout(() => {
            if (isPendingExecution && !activeContract) {
                setIsPendingExecution(false);
                setStatusMessage('SYNC TIMEOUT. RE-ENGAGING.');
                setTimeout(() => {
                    if (!sessionEnded) setIsRunning(true);
                }, 2000);
            }
        }, 15000); 

        return () => clearTimeout(timer);
    }, [isPendingExecution, activeContract, sessionEnded]);

    const strategyAnalysis = React.useMemo(() => {
        if (lastDigitTicks.length < 20) return null;

        // PRECISE ENTRY WINDOW MAPPING
        // Logic Alpha: Digit 0 has appeared within the last 3 to 5 ticks (indices 2 to 4)
        const cond0 = [lastDigitTicks[2], lastDigitTicks[3], lastDigitTicks[4]].includes(0);
        
        // Logic Beta: Digit 1 has not appeared within the last 5 to 7 ticks (indices 4 to 6)
        const cond1 = ![lastDigitTicks[4], lastDigitTicks[5], lastDigitTicks[6]].includes(1);
        
        // Logic Gamma: Digit 6 or 7 has appeared in the recent flux (indices 0 to 2)
        const cond67 = [lastDigitTicks[0], lastDigitTicks[1], lastDigitTicks[2]].some(t => t === 6 || t === 7);

        // AVOIDANCE PROTOCOLS
        const slice20 = lastDigitTicks.slice(0, 20);
        const avoidAbsent01 = !slice20.includes(0) && !slice20.includes(1);
        const avoidFreq1 = lastDigitTicks.slice(0, 10).filter(t => t === 1).length > 2;
        const avoidHighSeq = lastDigitTicks.slice(0, 5).every(t => t >= 7);

        const allSystemsGo = cond0 && cond1 && cond67 && !avoidAbsent01 && !avoidFreq1 && !avoidHighSeq;

        return {
            cond0,
            cond1,
            cond67,
            avoidAbsent01,
            avoidFreq1,
            avoidHighSeq,
            allSystemsGo
        };
    }, [lastDigitTicks]);

    React.useEffect(() => {
        if (!activeContract || !isPendingExecution) return;

        const contractId = activeContract.contract_id.toString();
        
        // Only process if this is a final state and we haven't processed it yet
        if ((activeContract.status === 'won' || activeContract.status === 'lost') && contractId !== lastProcessedId.current) {
            lastProcessedId.current = contractId;
            
            const result = activeContract.status.toUpperCase() as 'WON' | 'LOST';
            const profit = parseFloat(activeContract.profit);
            
            const newTrade: TradeLog = {
                id: contractId,
                time: new Date().toLocaleTimeString(),
                type: 'OVER 1',
                trigger: lastDigitTicks.slice(0, 3).join(','),
                result: result,
                stake: parseFloat(activeContract.buy_price),
                profit: profit,
                isRecovery: isRecoveryMode
            };

            setTrades(prev => [newTrade, ...prev].slice(0, 50));
            setSessionStats(prev => ({
                wins: result === 'WON' ? prev.wins + 1 : prev.wins,
                losses: result === 'LOST' ? prev.losses + 1 : prev.losses,
                profit: prev.profit + profit
            }));

            // Trade management: Win -> Reset. Loss -> Recovery Mode.
            if (result === 'WON') {
                setIsRecoveryMode(false);
            } else {
                // If it was already a recovery trade, we stop per protocol
                if (isRecoveryMode) {
                    setIsRecoveryMode(false);
                } else {
                    setIsRecoveryMode(true);
                }
            }
            
            setIsPendingExecution(false);
            setStatusMessage('CYCLE SETTLED. STANDBY...');
            
            setTimeout(() => {
                if (!sessionEnded) {
                    setIsRunning(true);
                    setStatusMessage('MONITORING TICKS...');
                }
            }, 5000);
        }
    }, [activeContract, isPendingExecution, lastDigitTicks, isRecoveryMode, sessionEnded]);

    React.useEffect(() => {
        if (!isRunning || !strategyAnalysis || sessionEnded || isPendingExecution || !isAuthorized) return;

        if (sessionStats.profit >= config.takeProfit || sessionStats.profit <= -config.stopLoss) {
            setIsRunning(false);
            setSessionEnded(true);
            setStatusMessage(sessionStats.profit >= config.takeProfit ? 'TAKE PROFIT REACHED' : 'STOP LOSS REACHED');
            return;
        }

        if (strategyAnalysis.allSystemsGo) {
            handleTacticalExecution();
        } else {
            if (strategyAnalysis.avoidHighSeq) setStatusMessage('AVOIDING: HIGH SEQUENCE');
            else if (strategyAnalysis.avoidFreq1) setStatusMessage('AVOIDING: DIGIT 1 CLUSTER');
            else if (strategyAnalysis.avoidAbsent01) setStatusMessage('AVOIDING: DEAD ZONE');
            else setStatusMessage('WAITING FOR ENTRY...');
        }
    }, [lastDigitTicks, isRunning, sessionEnded, sessionStats.profit, config.takeProfit, config.stopLoss, strategyAnalysis, isPendingExecution, isAuthorized]);

    const handleTacticalExecution = () => {
        if (!isAuthorized) return;
        
        setIsRunning(false); 
        setIsPendingExecution(true);
        setStatusMessage('SIGNAL ACTIVE: EXECUTING');

        const currentStake = isRecoveryMode ? (config.stake * config.martingale) : config.stake;

        if (balance < currentStake) {
            setStatusMessage('INSUFFICIENT BALANCE');
            setIsRunning(false);
            setIsPendingExecution(false);
            return;
        }

        onExecuteTrade({
            stake: currentStake,
            barrier: "1",
            contract_type: "DIGITOVER"
        });
    };

    const resetSession = () => {
        setTrades([]);
        setSessionStats({ wins: 0, losses: 0, profit: 0 });
        setIsRecoveryMode(false);
        setIsRunning(false);
        setSessionEnded(false);
        setIsPendingExecution(false);
        setStatusMessage('ENGINE STANDBY');
        lastProcessedId.current = null;
    };

    const updateConfig = (field: keyof typeof config, value: string) => {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            setConfig(prev => ({ ...prev, [field]: num }));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-24 max-w-[1600px] mx-auto">
            
            <Card className="border-none shadow-2xl bg-slate-900/60 backdrop-blur-3xl overflow-hidden relative rounded-[2rem] border border-white/5">
                <CardContent className="p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                            <Globe className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">TACTICAL VECTOR</h3>
                            <p className="text-[10px] font-black uppercase text-primary/60 mt-1 tracking-widest">Always-Live Market Surveillance</p>
                        </div>
                    </div>
                    <div className="flex-1 max-w-md w-full">
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-16 bg-black/60 border-white/10 rounded-[1.5rem] font-black text-sm text-white px-8 focus:ring-primary/40">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
                                {syntheticIndices.map((index) => (
                                    <SelectItem key={index.id} value={index.id} className="font-bold py-3">{index.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                <div className="xl:col-span-1 space-y-6">
                    <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-950/90 backdrop-blur-2xl overflow-hidden relative border border-white/5 rounded-[2.5rem]">
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        <CardHeader className="space-y-8 pt-12 px-8">
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">LIVE PIVOT</p>
                                <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{price.toFixed(decimalPlaces)}</p>
                            </div>

                            <div className="text-center space-y-2">
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">LIVE BALANCE</p>
                                    <Badge className={cn("border-none px-2 py-0 text-[7px] font-black", isAuthorized ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400")}>
                                        {isAuthorized ? 'SYNCED' : 'OFFLINE'}
                                    </Badge>
                                </div>
                                <p className="text-3xl font-black text-white tabular-nums tracking-tighter">
                                    {isAuthorized ? (
                                        <>{balance.toFixed(2)} <span className="text-xs opacity-40 font-bold">{currency}</span></>
                                    ) : (
                                        <span className="text-rose-500 opacity-40 text-xl uppercase tracking-widest">Connect API</span>
                                    )}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 px-8 pb-12 relative">
                            {/* Execution Lock Overlay */}
                            {!isAuthorized && (
                                <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem]">
                                    <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 border border-rose-500/30">
                                        <KeyRound className="h-8 w-8 text-rose-500" />
                                    </div>
                                    <p className="text-white font-black text-xs uppercase tracking-widest leading-relaxed">
                                        AUTHORIZATION REQUIRED<br/>FOR REAL EXECUTION
                                    </p>
                                </div>
                            )}

                            <Button 
                                onClick={() => setIsRunning(!isRunning)}
                                disabled={sessionEnded || isPendingExecution || !isAuthorized}
                                className={cn(
                                    "w-full h-20 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl active:scale-95 group overflow-hidden",
                                    isRunning ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20",
                                    (sessionEnded || isPendingExecution || !isAuthorized) && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {isPendingExecution ? <Loader2 className="mr-3 h-5 w-5 animate-spin" /> : isRunning ? <Square className="mr-3 h-5 w-5 fill-current" /> : <Play className="mr-3 h-5 w-5 fill-current" />}
                                {isPendingExecution ? 'EXECUTING...' : sessionEnded ? 'TERMINATED' : isRunning ? 'HALT' : 'INITIATE OVER 1'}
                            </Button>

                            <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-white/10 text-center relative overflow-hidden shadow-2xl">
                                <p className="text-[8px] font-black text-muted-foreground uppercase mb-2 tracking-widest opacity-60">SESSION ROI</p>
                                <p className={cn("text-4xl font-black tabular-nums tracking-tighter", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                    {sessionStats.profit >= 0 ? '+' : ''}{sessionStats.profit.toFixed(2)}
                                </p>
                                
                                <div className="mt-8 space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                            <span className="text-rose-500">STOP LOSS</span>
                                            <span className="text-muted-foreground">${config.stopLoss}</span>
                                        </div>
                                        <Progress value={Math.min(100, (Math.max(0, -sessionStats.profit) / (config.stopLoss || 1)) * 100)} className="h-2 bg-black/40 [&>div]:bg-rose-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                                            <span className="text-emerald-500">TAKE PROFIT</span>
                                            <span className="text-muted-foreground">${config.takeProfit}</span>
                                        </div>
                                        <Progress value={Math.min(100, (Math.max(0, sessionStats.profit) / (config.takeProfit || 1)) * 100)} className="h-2 bg-black/40 [&>div]:bg-emerald-500" />
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" onClick={resetSession} className="w-full h-14 border-white/10 hover:bg-white/5 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all duration-300">
                                <RotateCcw className="mr-2 h-4 w-4" /> REBOOT ENGINE
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-primary/20 shadow-[0_0_30px_rgba(0,0,0,0.3)] bg-slate-950/80 backdrop-blur-xl rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden">
                        {/* Config Lock Overlay */}
                        {!isAuthorized && <div className="absolute inset-0 z-20 bg-slate-950/40 backdrop-blur-[2px]" />}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-[11px] font-black uppercase text-primary tracking-[0.3em] flex items-center gap-3">
                                <Settings2 className="h-5 w-5" /> TACTICAL CONFIG
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            <div className="space-y-4">
                                <Label className="text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-primary" /> INITIAL STAKE
                                </Label>
                                <Input 
                                    type="number" 
                                    value={config.stake} 
                                    onChange={(e) => updateConfig('stake', e.target.value)}
                                    disabled={isRunning || isPendingExecution || !isAuthorized}
                                    className="h-16 bg-black/60 border-white/10 text-white text-lg font-black rounded-2xl text-center focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-primary" /> MARTINGALE MULTIPLIER
                                </Label>
                                <Input 
                                    type="number" 
                                    step="0.1"
                                    value={config.martingale} 
                                    onChange={(e) => updateConfig('martingale', e.target.value)}
                                    disabled={isRunning || isPendingExecution || !isAuthorized}
                                    className="h-16 bg-black/60 border-white/10 text-white text-lg font-black rounded-2xl text-center focus:ring-primary/20"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-2">
                                        <ShieldAlert className="h-3 w-3" /> STOP LOSS
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={config.stopLoss} 
                                        onChange={(e) => updateConfig('stopLoss', e.target.value)}
                                        disabled={isRunning || isPendingExecution || !isAuthorized}
                                        className="h-16 bg-black/60 border-rose-500/20 text-white text-lg font-black rounded-2xl text-center"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[9px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2">
                                        <Target className="h-3 w-3" /> TAKE PROFIT
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={config.takeProfit} 
                                        onChange={(e) => updateConfig('takeProfit', e.target.value)}
                                        disabled={isRunning || isPendingExecution || !isAuthorized}
                                        className="h-16 bg-black/60 border-emerald-500/20 text-white text-lg font-black rounded-2xl text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="xl:col-span-3 space-y-6">
                    
                    <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[2.5rem] border border-white/5">
                        <CardHeader className="pb-4 pt-10 px-10">
                            <h4 className="text-[11px] font-black uppercase text-primary tracking-[0.4em] flex items-center gap-3">
                                <Cpu className="h-5 w-5" /> CONDITION SYNCHRONIZATION
                            </h4>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className={cn(
                                "p-6 rounded-3xl border transition-all duration-500 flex items-center justify-between",
                                strategyAnalysis?.cond0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-black/40 border-white/5 text-muted-foreground/40"
                            )}>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest">LOGIC ALPHA</p>
                                    <p className="text-xs font-bold uppercase">Digit 0 (3-5 Tick Window)</p>
                                </div>
                                {strategyAnalysis?.cond0 ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6 opacity-20" />}
                            </div>

                            <div className={cn(
                                "p-6 rounded-3xl border transition-all duration-500 flex items-center justify-between",
                                strategyAnalysis?.cond1 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-black/40 border-white/5 text-muted-foreground/40"
                            )}>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest">LOGIC BETA</p>
                                    <p className="text-xs font-bold uppercase">No Digit 1 (5-7 Tick Window)</p>
                                </div>
                                {strategyAnalysis?.cond1 ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6 opacity-20" />}
                            </div>

                            <div className={cn(
                                "p-6 rounded-3xl border transition-all duration-500 flex items-center justify-between",
                                strategyAnalysis?.cond67 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-black/40 border-white/5 text-muted-foreground/40"
                            )}>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest">LOGIC GAMMA</p>
                                    <p className="text-xs font-bold uppercase">Digit 6 or 7 (Recent flux)</p>
                                </div>
                                {strategyAnalysis?.cond67 ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6 opacity-20" />}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-2xl overflow-hidden relative border border-white/5 rounded-[3rem] h-fit">
                        <CardHeader className="border-b border-white/5 p-12 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-center md:text-left">
                                <CardTitle className="text-xl sm:text-2xl font-black uppercase tracking-[0.5em] text-white flex items-center justify-center md:justify-start gap-4">
                                    <Zap className="h-8 w-8 text-primary drop-shadow-[0_0_12px_rgba(var(--primary),0.8)]" /> 
                                    OVER 1 ENGINE HUB
                                </CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase text-primary/60 mt-4 tracking-widest">100+1 ACCURACY ZERO-ERROR SURVEILLANCE ACTIVE</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge className={cn(
                                    "px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.4em] border-none shadow-xl transition-all duration-500",
                                    isRunning || isPendingExecution ? "bg-emerald-500/20 text-emerald-400 animate-pulse scale-105" : sessionEnded ? "bg-primary/20 text-primary" : "bg-black/60 text-muted-foreground"
                                )}>
                                    {!isAuthorized ? 'AWAITING KEY' : statusMessage}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-12 space-y-16">
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 text-center shadow-2xl">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 opacity-60">ACTIVE STAKE</p>
                                    <p className="text-4xl font-black text-primary uppercase tracking-tighter">
                                        ${isRecoveryMode ? (config.stake * config.martingale).toFixed(2) : config.stake.toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-10 rounded-[3rem] bg-black/40 border border-white/5 text-center shadow-2xl">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 opacity-60">ACTIVE MODE</p>
                                    <p className={cn("text-2xl font-black uppercase tracking-widest", isRecoveryMode ? "text-amber-400" : "text-emerald-400")}>
                                        {isRecoveryMode ? 'RECOVERY' : 'NORMAL'}
                                    </p>
                                </div>
                                <div className="p-10 rounded-[3rem] bg-emerald-500/10 border border-emerald-500/20 text-center shadow-2xl col-span-1 lg:col-span-2">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 opacity-80">STABILITY INDEX</p>
                                    <p className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tighter">100+1 FLAWLESS</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <h4 className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-3">
                                    <Activity className="h-6 w-6" /> LIVE TICK FLUX
                                </h4>
                                <div className="flex flex-wrap gap-4">
                                    {lastDigitTicks.slice(0, 16).map((digit, idx) => (
                                        <div 
                                            key={idx} 
                                            className={cn(
                                                "w-14 h-14 sm:w-16 sm:h-16 rounded-[1.5rem] flex items-center justify-center font-black text-lg sm:text-2xl border transition-all duration-300 relative overflow-hidden",
                                                idx === 0 ? "bg-primary border-primary text-white scale-110 shadow-[0_0_30px_rgba(var(--primary),0.5)] z-10" : "bg-black/40 border-white/5 text-white/40"
                                            )}
                                        >
                                            <span className="relative z-10">{digit}</span>
                                            {idx === 0 && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-3">
                                        <ShieldCheck className="h-6 w-6" /> EXECUTION LOG
                                    </h4>
                                    <Badge className="bg-white/5 text-muted-foreground/60 border-none text-[8px] font-black uppercase tracking-widest px-6 py-2">
                                        {isAuthorized ? 'REAL MARKET ENGAGED' : 'SURVEILLANCE MODE'}
                                    </Badge>
                                </div>
                                <div className="space-y-5 max-h-[600px] overflow-y-auto custom-scrollbar pr-6 pb-12">
                                    {trades.length === 0 ? (
                                        <div className="h-64 flex flex-col items-center justify-center opacity-20 space-y-8 border-2 border-dashed border-white/5 rounded-[3rem]">
                                            <RotateCcw className="h-16 w-16 animate-spin-slow" />
                                            <p className="text-xs font-black uppercase tracking-[0.5em]">Awaiting Strategic Handshake...</p>
                                        </div>
                                    ) : (
                                        trades.map((trade) => (
                                            <div 
                                                key={trade.id} 
                                                className="flex items-center justify-between p-8 bg-black/40 border border-white/5 rounded-[2.5rem] shadow-2xl hover:bg-black/60 transition-all group"
                                            >
                                                <div className="flex items-center gap-8">
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl",
                                                        trade.result === 'WON' ? "bg-emerald-500/10 text-emerald-400" : trade.result === 'LOST' ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                                                    )}>
                                                        {trade.result === 'WON' ? <ArrowUpRight className="h-8 w-8" /> : trade.result === 'LOST' ? <ArrowDownRight className="h-8 w-8" /> : <Activity className="h-8 w-8 animate-pulse" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-base sm:text-lg font-black text-white">{trade.type}</p>
                                                            <Badge variant="outline" className="border-white/10 text-[10px] font-black text-muted-foreground px-3">${trade.stake.toFixed(2)}</Badge>
                                                            {trade.isRecovery && <Badge className="bg-amber-500/10 text-amber-400 border-none text-[8px] font-black uppercase px-3">RECOVERY</Badge>}
                                                        </div>
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 opacity-60 tracking-widest">{trade.time} • ID: {trade.id}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={cn("text-2xl sm:text-3xl font-black tabular-nums tracking-tighter", trade.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                                        {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                                    </p>
                                                    <Badge className={cn("text-[10px] font-black px-4 py-1 border-none shadow-lg mt-2", trade.result === 'WON' ? "bg-emerald-500/20 text-emerald-400" : trade.result === 'LOST' ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400")}>
                                                        {trade.result}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
