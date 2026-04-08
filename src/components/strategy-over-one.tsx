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
    KeyRound,
    Radio,
    Flame,
    Trash2,
    Crosshair,
    Network,
    Orbit,
    TrendingUp,
    Trophy,
    Skull
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
    activeContract,
    surveillanceStatus,
    executionStatus
}: StrategyOverOneProps) {
    const [config, setConfig] = React.useState({
        stake: 2,
        stopLoss: 10,
        takeProfit: 5,
        martingale: 2.5
    });

    const [isRunning, setIsRunning] = React.useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = React.useState(false);
    const [sessionEnded, setSessionEnded] = React.useState(false);
    const [trades, setTrades] = React.useState<TradeLog[]>([]);
    const [sessionStats, setSessionStats] = React.useState({ wins: 0, losses: 0, profit: 0 });
    const [statusMessage, setStatusMessage] = React.useState('ENGINE STANDBY');
    const [isPendingExecution, setIsPendingExecution] = React.useState(false);
    
    const lastProcessedId = React.useRef<string | null>(null);

    // Watchdog Timer (Reset if trade hangs)
    React.useEffect(() => {
        if (!isPendingExecution) return;
        
        const timer = setTimeout(() => {
            if (isPendingExecution && !activeContract) {
                setIsPendingExecution(false);
                setStatusMessage('SYNC TIMEOUT. RE-ENGAGING.');
                setTimeout(() => {
                    if (!sessionEnded) {
                        setIsRunning(true);
                        setStatusMessage('MONITORING TICKS...');
                    }
                }, 2000);
            }
        }, 10000); 

        return () => clearTimeout(timer);
    }, [isPendingExecution, activeContract, sessionEnded]);

    const strategyAnalysis = React.useMemo(() => {
        if (lastDigitTicks.length < 20) return null;

        // LOGIC ALPHA: Digit 0 at index 2, 3, or 4 (3rd-5th tick)
        const cond0 = [lastDigitTicks[2], lastDigitTicks[3], lastDigitTicks[4]].includes(0);
        
        // LOGIC BETA: No Digit 1 at index 4, 5, or 6 (5th-7th tick)
        const cond1 = ![lastDigitTicks[4], lastDigitTicks[5], lastDigitTicks[6]].includes(1);
        
        // LOGIC GAMMA: Digit 6 or 7 at index 0, 1, or 2 (Immediate flux)
        const cond67 = [lastDigitTicks[0], lastDigitTicks[1], lastDigitTicks[2]].some(t => t === 6 || t === 7);

        // AVOIDANCE PROTOCOLS
        const slice20 = lastDigitTicks.slice(0, 20);
        const avoidAbsent01 = !slice20.includes(0) && !slice20.includes(1);
        const avoidFreq1 = lastDigitTicks.slice(0, 10).filter(t => t === 1).length > 2;
        const avoidHighSeq = lastDigitTicks.slice(0, 5).every(t => t >= 7);

        const allSystemsGo = cond0 && cond1 && cond67 && !avoidAbsent01 && !avoidFreq1 && !avoidHighSeq;

        return { cond0, cond1, cond67, avoidAbsent01, avoidFreq1, avoidHighSeq, allSystemsGo };
    }, [lastDigitTicks]);

    React.useEffect(() => {
        if (!activeContract || !isPendingExecution) return;

        const contractId = activeContract.contract_id.toString();
        
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

            if (result === 'WON') {
                setIsRecoveryMode(false);
            } else {
                setIsRecoveryMode(true);
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
        setStatusMessage('SIGNAL ACTIVE: EXECUTING OVER 1');
        const currentStake = isRecoveryMode ? (config.stake * config.martingale) : config.stake;
        if (balance < currentStake) {
            setStatusMessage('INSUFFICIENT BALANCE');
            setIsRunning(false);
            setIsPendingExecution(false);
            return;
        }
        onExecuteTrade({ stake: currentStake, barrier: "1", contract_type: "DIGITOVER" });
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
        if (!isNaN(num)) setConfig(prev => ({ ...prev, [field]: num }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 pb-32 max-w-[1600px] mx-auto">
            
            {/* DUAL ENGINE POWER CORE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <Card className="border-none shadow-[0_0_40px_rgba(16,185,129,0.15)] bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[2.5rem] border-l-4 border-emerald-500 p-8 flex items-center justify-between group h-32">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]">
                                    <Radio className={cn("h-8 w-8 text-emerald-400", surveillanceStatus === 'active' && 'animate-pulse')} />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-emerald-400/60 tracking-[0.3em] leading-none mb-2">SURVEILLANCE ALPHA</p>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">LIVE VECTOR FEED</h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge className="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse border-none">
                                ACTIVE
                            </Badge>
                        </div>
                    </Card>
                </motion.div>

                <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <Card className={cn(
                        "border-none shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-3xl overflow-hidden relative rounded-[2.5rem] border-l-4 p-8 flex items-center justify-between group h-32 transition-all duration-700",
                        isAuthorized ? "bg-slate-900/40 border-cyan-500" : "bg-black/20 border-white/10 opacity-60"
                    )}>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {isAuthorized && <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />}
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500",
                                    isAuthorized ? "bg-cyan-500/10 border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]" : "bg-white/5 border-white/10"
                                )}>
                                    <Cpu className={cn("h-8 w-8", isAuthorized ? "text-cyan-400" : "text-white/20")} />
                                </div>
                            </div>
                            <div>
                                <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-2", isAuthorized ? "text-cyan-400/60" : "text-white/20")}>EXECUTION BETA</p>
                                <h3 className={cn("text-xl font-black uppercase tracking-widest", isAuthorized ? "text-white" : "text-white/20")}>AUTHORIZED CORE</h3>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge className={cn(
                                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border-none shadow-xl transition-all duration-500",
                                isAuthorized ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "bg-white/5 text-white/20"
                            )}>
                                {isAuthorized ? 'SYNCED' : 'LOCKED'}
                            </Badge>
                        </div>
                    </Card>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                
                {/* CONTROL CENTER SIDEBAR */}
                <div className="xl:col-span-1 space-y-8">
                    <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-2xl overflow-hidden relative border border-white/5 rounded-[3rem]">
                        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-cyan-400 to-primary shadow-[0_0_20px_rgba(var(--primary),0.6)]" />
                        <CardHeader className="pt-10 px-10">
                            <div className="text-center space-y-3">
                                <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">ACCOUNT LIQUIDITY</p>
                                <p className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                    {isAuthorized ? (
                                        <>{balance.toFixed(2)}<span className="text-sm opacity-40 ml-2 font-black">{currency}</span></>
                                    ) : (
                                        <span className="text-rose-500/40 text-2xl uppercase tracking-widest animate-pulse">CONNECT KEY</span>
                                    )}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 px-10 pb-12 relative">
                            {!isAuthorized && (
                                <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center rounded-[3rem]">
                                    <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center mb-6 border border-rose-500/30 animate-bounce">
                                        <Lock className="h-10 w-10 text-rose-500" />
                                    </div>
                                    <p className="text-white font-black text-sm uppercase tracking-[0.3em] leading-relaxed">
                                        RESTRICTED ACCESS<br/>
                                        <span className="text-rose-500 opacity-60 text-[10px]">VERIFY API TOKEN</span>
                                    </p>
                                </div>
                            )}

                            <Button 
                                onClick={() => setIsRunning(!isRunning)}
                                disabled={sessionEnded || isPendingExecution || !isAuthorized}
                                className={cn(
                                    "w-full h-24 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-95 group overflow-hidden border-2",
                                    isRunning ? "bg-rose-500 border-rose-400/50 hover:bg-rose-600" : "bg-emerald-500 border-emerald-400/50 hover:bg-emerald-600",
                                    (sessionEnded || isPendingExecution || !isAuthorized) && "opacity-50 grayscale cursor-not-allowed"
                                )}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                {isPendingExecution ? <Loader2 className="mr-4 h-6 w-6 animate-spin" /> : isRunning ? <Square className="mr-4 h-6 w-6 fill-current" /> : <Play className="mr-4 h-6 w-6 fill-current" />}
                                {isPendingExecution ? 'EXECUTING' : sessionEnded ? 'TERMINATED' : isRunning ? 'STOP ENGINE' : 'ENGAGE OVER 1'}
                            </Button>

                            {/* TACTICAL SCOREBOARD (WINS / LOSSES) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 text-center relative overflow-hidden group">
                                    <Trophy className="absolute -top-2 -right-2 h-12 w-12 text-emerald-500/10 group-hover:scale-110 transition-transform" />
                                    <p className="text-[10px] font-black text-emerald-400/60 uppercase mb-2 tracking-widest">WINS</p>
                                    <p className="text-4xl font-black text-emerald-400 tabular-nums">{sessionStats.wins}</p>
                                </div>
                                <div className="p-6 bg-rose-500/10 rounded-[2rem] border border-rose-500/20 text-center relative overflow-hidden group">
                                    <Skull className="absolute -top-2 -right-2 h-12 w-12 text-rose-500/10 group-hover:scale-110 transition-transform" />
                                    <p className="text-[10px] font-black text-rose-400/60 uppercase mb-2 tracking-widest">LOSSES</p>
                                    <p className="text-4xl font-black text-rose-400 tabular-nums">{sessionStats.losses}</p>
                                </div>
                            </div>

                            <div className="p-8 bg-black/60 rounded-[2.5rem] border border-white/5 text-center relative overflow-hidden shadow-inner">
                                <p className="text-[10px] font-black text-muted-foreground uppercase mb-3 tracking-[0.3em] opacity-60">SESSION ROI</p>
                                <motion.p 
                                    key={sessionStats.profit}
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={cn("text-5xl font-black tabular-nums tracking-tighter", sessionStats.profit >= 0 ? "text-emerald-400" : "text-rose-500")}
                                >
                                    {sessionStats.profit >= 0 ? '+' : ''}{sessionStats.profit.toFixed(2)}
                                </motion.p>
                                
                                <div className="mt-10 space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                            <span className="text-rose-500">STOP LOSS</span>
                                            <span className="text-muted-foreground">${config.stopLoss}</span>
                                        </div>
                                        <Progress value={Math.min(100, (Math.max(0, -sessionStats.profit) / (config.stopLoss || 1)) * 100)} className="h-3 bg-white/5 [&>div]:bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                            <span className="text-emerald-500">TAKE PROFIT</span>
                                            <span className="text-muted-foreground">${config.takeProfit}</span>
                                        </div>
                                        <Progress value={Math.min(100, (Math.max(0, sessionStats.profit) / (config.takeProfit || 1)) * 100)} className="h-3 bg-white/5 [&>div]:bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" onClick={resetSession} className="w-full h-16 border-white/10 hover:bg-white/5 font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl transition-all duration-300">
                                <RotateCcw className="mr-3 h-5 w-5" /> REBOOT CORE
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-primary/20 shadow-2xl bg-slate-950/80 backdrop-blur-xl rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Settings2 size={120} className="text-primary" /></div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-6">
                            <h3 className="text-[12px] font-black uppercase text-primary tracking-[0.4em] flex items-center gap-4">
                                <Zap className="h-6 w-6 text-primary animate-pulse" /> ENGINE CONFIG
                            </h3>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-3">
                                    <Globe className="h-5 w-5 text-primary" /> VECTOR TARGET
                                </Label>
                                <Select value={selectedMarket} onValueChange={onMarketChange}>
                                    <SelectTrigger className="h-16 bg-black/60 border-white/10 rounded-2xl font-black text-lg text-white px-8 focus:ring-2 focus:ring-primary/40 shadow-inner">
                                        <SelectValue placeholder="Select Index" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950 border-white/10 text-white rounded-2xl">
                                        {syntheticIndices.map((index) => (
                                            <SelectItem key={index.id} value={index.id} className="font-black py-3 text-sm">{index.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-6 bg-primary/10 border-2 border-primary/20 rounded-[2rem] text-center shadow-[inset_0_0_20px_rgba(var(--primary),0.1)] relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 opacity-80">LIVE PRICE FLUX</p>
                                <p className="text-4xl font-black text-white tabular-nums tracking-tighter drop-shadow-md">{price.toFixed(decimalPlaces)}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-3">
                                        <DollarSign className="h-5 w-5 text-primary" /> INITIAL STAKE
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={config.stake} 
                                        onChange={(e) => updateConfig('stake', e.target.value)}
                                        disabled={isRunning || isPendingExecution}
                                        className="h-16 bg-black/60 border-white/10 text-white text-2xl font-black rounded-2xl text-center focus:ring-2 focus:ring-primary/40 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-3">
                                        <BarChart3 className="h-5 w-5 text-primary" /> MARTINGALE X
                                    </Label>
                                    <Input 
                                        type="number" 
                                        step="0.1"
                                        value={config.martingale} 
                                        onChange={(e) => updateConfig('martingale', e.target.value)}
                                        disabled={isRunning || isPendingExecution}
                                        className="h-16 bg-black/60 border-white/10 text-white text-2xl font-black rounded-2xl text-center focus:ring-2 focus:ring-primary/40 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-3">
                                        <Target className="h-5 w-5 text-emerald-400" /> TAKE PROFIT
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={config.takeProfit} 
                                        onChange={(e) => updateConfig('takeProfit', e.target.value)}
                                        disabled={isRunning || isPendingExecution}
                                        className="h-16 bg-black/60 border-white/10 text-white text-2xl font-black rounded-2xl text-center focus:ring-2 focus:ring-primary/40 shadow-inner"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-3">
                                        <ShieldAlert className="h-5 w-5 text-rose-500" /> STOP LOSS
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={config.stopLoss} 
                                        onChange={(e) => updateConfig('stopLoss', e.target.value)}
                                        disabled={isRunning || isPendingExecution}
                                        className="h-16 bg-black/60 border-white/10 text-white text-2xl font-black rounded-2xl text-center focus:ring-2 focus:ring-primary/40 shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* STRATEGY HUD & DATA STREAM */}
                <div className="xl:col-span-3 space-y-8">
                    
                    {/* NEURAL SYNC PANEL */}
                    <Card className="border-none shadow-2xl bg-slate-900/40 backdrop-blur-3xl overflow-hidden relative rounded-[3rem] border border-white/5">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                        <CardHeader className="pb-6 pt-12 px-12">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[13px] font-black uppercase text-primary tracking-[0.5em] flex items-center gap-4">
                                    <Network className="h-6 w-6 text-primary" /> NEURAL CONDITION SYNCHRONIZATION
                                </h4>
                                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5">100+1 ACCURACY GATES</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-12 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { label: 'LOGIC ALPHA', desc: 'Digit 0 (3-5 Tick Window)', active: strategyAnalysis?.cond0 },
                                { label: 'LOGIC BETA', desc: 'No Digit 1 (5-7 Tick Window)', active: strategyAnalysis?.cond1 },
                                { label: 'LOGIC GAMMA', desc: 'Digit 6/7 (Immediate Flux)', active: strategyAnalysis?.cond67 }
                            ].map((cond, idx) => (
                                <motion.div 
                                    key={idx}
                                    animate={cond.active ? { scale: [1, 1.02, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className={cn(
                                        "p-8 rounded-[2rem] border-2 transition-all duration-700 flex flex-col gap-4 relative overflow-hidden",
                                        cond.active 
                                            ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-emerald-400" 
                                            : "bg-black/40 border-white/5 text-muted-foreground/30 grayscale"
                                    )}
                                >
                                    {cond.active && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />}
                                    <div className="flex items-center justify-between relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">{cond.label}</p>
                                        {cond.active ? <CheckCircle2 className="h-8 w-8 text-emerald-400" /> : <Circle className="h-8 w-8 opacity-20" />}
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest relative z-10 leading-tight">{cond.desc}</p>
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl bg-slate-950/90 backdrop-blur-2xl overflow-hidden relative border border-white/5 rounded-[3.5rem] h-fit">
                        <CardHeader className="border-b border-white/5 p-14 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-b from-white/5 to-transparent">
                            <div className="text-center md:text-left space-y-4">
                                <CardTitle className="text-2xl sm:text-4xl font-black uppercase tracking-[0.6em] text-white flex items-center justify-center md:justify-start gap-6">
                                    <Zap className="h-10 w-10 text-primary drop-shadow-[0_0_20px_rgba(var(--primary),1)]" /> 
                                    OVER 1 CORE
                                </CardTitle>
                                <div className="flex items-center gap-3 justify-center md:justify-start">
                                    <div className="h-2 w-2 rounded-full bg-primary animate-ping" />
                                    <CardDescription className="text-[11px] font-black uppercase text-primary/60 tracking-[0.4em]">ZERO-ERROR SURVEILLANCE ACTIVE</CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-4">
                                <Badge className={cn(
                                    "px-12 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.5em] border-none shadow-[0_15px_40px_rgba(0,0,0,0.4)] transition-all duration-700 min-w-[280px] text-center justify-center",
                                    isRunning || isPendingExecution ? "bg-emerald-500/20 text-emerald-400 animate-pulse border-2 border-emerald-500/30" : sessionEnded ? "bg-primary/20 text-primary" : "bg-black/60 text-muted-foreground"
                                )}>
                                    {!isAuthorized ? 'HANDSHAKE REQUIRED' : statusMessage}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-14 space-y-20">
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                                {[
                                    { label: 'ACTIVE STAKE', value: `$${isRecoveryMode ? (config.stake * config.martingale).toFixed(2) : config.stake.toFixed(2)}`, color: 'text-primary' },
                                    { label: 'ENGINE MODE', value: isRecoveryMode ? 'RECOVERY' : 'TACTICAL', color: isRecoveryMode ? 'text-amber-400' : 'text-emerald-400' },
                                    { label: 'DURATION', value: '1 TICK', color: 'text-cyan-400' },
                                    { label: 'ACCURACY LOCK', value: '100+1 FLAWLESS', color: 'text-emerald-400' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-12 rounded-[3rem] bg-black/40 border border-white/5 text-center shadow-[inset_0_0_30px_rgba(0,0,0,0.4)] relative group overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-6 opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</p>
                                        <p className={cn("text-3xl sm:text-4xl font-black uppercase tracking-tighter", stat.color)}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-10">
                                <div className="flex items-center justify-between px-4">
                                    <h4 className="text-[12px] font-black uppercase text-muted-foreground tracking-[0.4em] flex items-center gap-4">
                                        <Activity className="h-7 w-7 text-primary" /> LIVE TICK FLUX PIPELINE
                                    </h4>
                                    <div className="flex items-center gap-4 text-[9px] font-black text-muted-foreground/40 tracking-widest uppercase">
                                        <span>WIN POS: [3,4,5]</span>
                                        <div className="w-1 h-1 rounded-full bg-white/10" />
                                        <span>AVOID POS: [5,6,7]</span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-5 justify-center sm:justify-start">
                                    <AnimatePresence>
                                        {lastDigitTicks.slice(0, 16).map((digit, idx) => {
                                            const isLead = idx === 0;
                                            const isWindowAlpha = [2, 3, 4].includes(idx);
                                            const isWindowBeta = [4, 5, 6].includes(idx);
                                            
                                            return (
                                                <motion.div 
                                                    key={`${idx}-${digit}`}
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className={cn(
                                                        "w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] flex items-center justify-center font-black text-xl sm:text-3xl border-2 transition-all duration-500 relative overflow-hidden",
                                                        isLead ? "bg-primary border-primary text-white scale-110 shadow-[0_0_40px_rgba(var(--primary),0.6)] z-20" : 
                                                        isWindowAlpha && digit === 0 ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]" :
                                                        "bg-black/40 border-white/5 text-white/20"
                                                    )}
                                                >
                                                    <span className="relative z-10">{digit}</span>
                                                    {isLead && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                                                    {isWindowAlpha && !isLead && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400/40" />}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
                                    <div className="flex items-center gap-8">
                                        <h4 className="text-[12px] font-black uppercase text-muted-foreground tracking-[0.4em] flex items-center gap-4">
                                            <ShieldCheck className="h-7 w-7 text-emerald-400" /> TACTICAL EXECUTION LOG
                                        </h4>
                                        {trades.length > 0 && (
                                            <Button 
                                                variant="ghost" 
                                                onClick={resetSession}
                                                className="h-10 px-6 rounded-full border border-rose-500/30 bg-rose-500/5 text-rose-400 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-500/10 transition-all gap-3"
                                            >
                                                <Trash2 className="h-4 w-4" /> PURGE FEED
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className="bg-white/5 text-muted-foreground/60 border-none text-[10px] font-black uppercase tracking-[0.4em] px-8 py-3 rounded-full">
                                            {isAuthorized ? 'REAL-MARKET SYNC' : 'SIMULATION MODE'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-6 max-h-[700px] overflow-y-auto custom-scrollbar pr-8 pb-12">
                                    {trades.length === 0 ? (
                                        <div className="h-80 flex flex-col items-center justify-center opacity-20 space-y-10 border-4 border-dashed border-white/5 rounded-[4rem]">
                                            <div className="relative">
                                                <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                                                <RotateCcw className="h-24 w-24 animate-spin-slow text-primary" />
                                            </div>
                                            <p className="text-sm font-black uppercase tracking-[0.6em] text-primary">INITIALIZING TACTICAL HANDSHAKE...</p>
                                        </div>
                                    ) : (
                                        trades.map((trade) => (
                                            <motion.div 
                                                key={trade.id} 
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                className="flex flex-col sm:flex-row items-center justify-between p-10 bg-black/40 border border-white/5 rounded-[3rem] shadow-2xl hover:bg-black/60 transition-all group relative overflow-hidden"
                                            >
                                                <div className={cn(
                                                    "absolute left-0 top-0 w-2 h-full transition-colors",
                                                    trade.result === 'WON' ? "bg-emerald-500" : trade.result === 'LOST' ? "bg-rose-500" : "bg-amber-500"
                                                )} />
                                                <div className="flex items-center gap-12">
                                                    <div className={cn(
                                                        "w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all duration-500 shadow-2xl border-2",
                                                        trade.result === 'WON' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : trade.result === 'LOST' ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                                    )}>
                                                        {trade.result === 'WON' ? <ArrowUpRight className="h-12 w-12" /> : trade.result === 'LOST' ? <ArrowDownRight className="h-12 w-12" /> : <Activity className="h-12 w-12 animate-pulse" />}
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-6">
                                                            <p className="text-2xl font-black text-white tracking-tighter">{trade.type}</p>
                                                            {trade.isRecovery && <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase px-4 py-1 rounded-lg">RECOVERY ACTIVE</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="bg-primary/90 px-6 py-2 rounded-xl shadow-[0_10px_20px_rgba(var(--primary),0.3)]">
                                                                <p className="text-[11px] font-black text-white uppercase tracking-[0.2em]">${trade.stake.toFixed(2)} POSITION</p>
                                                            </div>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60 tracking-[0.2em] font-mono">{trade.time} // CONTRACT: {trade.id}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right space-y-4 mt-6 sm:mt-0">
                                                    <p className={cn("text-5xl font-black tabular-nums tracking-tighter drop-shadow-lg", trade.profit >= 0 ? "text-emerald-400" : "text-rose-500")}>
                                                        {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                                    </p>
                                                    <Badge className={cn("text-[11px] font-black px-8 py-2 rounded-full border-none shadow-2xl uppercase tracking-[0.3em]", trade.result === 'WON' ? "bg-emerald-500 text-white" : trade.result === 'LOST' ? "bg-rose-500 text-white" : "bg-amber-500 text-white")}>
                                                        {trade.result}
                                                    </Badge>
                                                </div>
                                            </motion.div>
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
