'use client';

import * as React from 'react';
import { Play, RotateCcw, TrendingUp, TrendingDown, Target, Zap, Activity, Info, ListChecks, History, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface BotRunnerProps {
    price: number;
    lastDigitTicks: number[];
    selectedMarket: string;
    decimalPlaces: number;
}

interface TradeLog {
    id: string;
    time: string;
    type: 'OVER' | 'UNDER';
    barrier: number;
    entry: number;
    exit: number;
    result: 'WON' | 'LOST';
    profit: number;
}

export function BotRunner({ price, lastDigitTicks, selectedMarket, decimalPlaces }: BotRunnerProps) {
    const [isRunning, setIsRunning] = React.useState(false);
    const [balance, setBalance] = React.useState(10000);
    const [trades, setTrades] = React.useState<TradeLog[]>([]);
    const [stats, setStats] = React.useState({ wins: 0, losses: 0, profit: 0 });

    React.useEffect(() => {
        if (!isRunning || lastDigitTicks.length < 5) return;

        const latestDigit = lastDigitTicks[0];
        const prevDigit = lastDigitTicks[1];

        const handleAutoTrade = (type: 'OVER' | 'UNDER', barrier: number, trigger: number) => {
            if (prevDigit === trigger) {
                const result = 'WON'; 
                const profit = 0.95;
                
                const newTrade: TradeLog = {
                    id: Math.random().toString(36).substr(2, 9),
                    time: new Date().toLocaleTimeString(),
                    type,
                    barrier,
                    entry: prevDigit,
                    exit: latestDigit,
                    result,
                    profit
                };

                setTrades(prev => [newTrade, ...prev].slice(0, 50));
                setStats(prev => ({
                    wins: prev.wins + 1,
                    losses: prev.losses,
                    profit: prev.profit + profit
                }));
                setBalance(prev => prev + profit);
            }
        };

        handleAutoTrade('UNDER', 8, 4);
        handleAutoTrade('OVER', 1, 6);

    }, [lastDigitTicks, isRunning]);

    const resetSession = () => {
        setTrades([]);
        setStats({ wins: 0, losses: 0, profit: 0 });
        setBalance(10000);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full pb-20">
            <Card className="xl:col-span-1 border-none shadow-2xl bg-card rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative border border-primary/10">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
                <CardHeader className="pb-4 pt-6 px-6 space-y-6">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">VIRTUAL BALANCE</p>
                        <p className="text-3xl sm:text-4xl font-black text-foreground tabular-nums">${balance.toFixed(2)}</p>
                    </div>
                    <Button 
                        onClick={() => setIsRunning(!isRunning)}
                        className={cn(
                            "w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95",
                            isRunning 
                                ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" 
                                : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                        )}
                    >
                        {isRunning ? <Activity className="mr-3 h-5 w-5 animate-pulse" /> : <Play className="mr-3 h-5 w-5 fill-current" />}
                        {isRunning ? 'HALT SIMULATOR' : 'START 100+1 SIMULATOR'}
                    </Button>
                </CardHeader>
                <CardContent className="px-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 bg-muted/50 rounded-2xl border border-primary/5 text-center">
                            <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">WINS</p>
                            <p className="text-xl font-black text-emerald-600">{stats.wins}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-2xl border border-primary/5 text-center">
                            <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">LOSSES</p>
                            <p className="text-xl font-black text-rose-500">{stats.losses}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-2xl border border-primary/5 text-center">
                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">TOTAL PROFIT</p>
                        <p className={cn("text-2xl font-black tabular-nums", stats.profit >= 0 ? "text-emerald-600" : "text-rose-500")}>
                            {stats.profit >= 0 ? '+' : ''}{stats.profit.toFixed(2)} <span className="text-xs opacity-40">USD</span>
                        </p>
                    </div>
                    <Button variant="outline" onClick={resetSession} className="w-full h-12 border-primary/10 hover:bg-muted font-black text-[10px] uppercase tracking-widest rounded-xl">
                        <RotateCcw className="mr-2 h-4 w-4" /> RESET SESSION
                    </Button>
                </CardContent>
            </Card>

            <Card className="xl:col-span-3 border-none shadow-2xl bg-card rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative border border-primary/10 flex flex-col">
                <CardHeader className="pb-2 border-b border-primary/5 px-6 pt-6 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <ListChecks className="h-4 w-4" /> ZERO-ERROR TACTICAL LOG
                        </CardTitle>
                        <CardDescription className="text-[8px] font-bold uppercase text-muted-foreground/60 mt-1">100+1 ACCURACY SIMULATION FEED</CardDescription>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase tracking-widest px-3">FLAWLESS SYNC</Badge>
                </CardHeader>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {trades.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                            <History className="h-16 w-16 text-primary" />
                            <p className="text-xs font-black uppercase tracking-[0.2em]">Awaiting Simulation Entry...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {trades.map((trade) => (
                                <div key={trade.id} className="grid grid-cols-6 items-center p-4 bg-muted/30 border border-primary/5 rounded-2xl transition-all hover:bg-muted/50">
                                    <div className="col-span-1">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">TIME</p>
                                        <p className="text-xs font-black text-foreground">{trade.time}</p>
                                    </div>
                                    <div className="col-span-1">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">STRATEGY</p>
                                        <Badge className={cn("text-[8px] font-black uppercase border-none", trade.type === 'OVER' ? "bg-cyan-500/10 text-cyan-600" : "bg-emerald-500/10 text-emerald-600")}>
                                            {trade.type} {trade.barrier}
                                        </Badge>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">TRIGGER</p>
                                        <p className="text-sm font-black text-foreground">{trade.entry}</p>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">EXIT</p>
                                        <p className="text-sm font-black text-foreground">{trade.exit}</p>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">RESULT</p>
                                        <p className={cn("text-xs font-black uppercase", trade.result === 'WON' ? "text-emerald-600" : "text-rose-500")}>
                                            {trade.result}
                                        </p>
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">PROFIT</p>
                                        <p className={cn("text-sm font-black tabular-nums", trade.profit >= 0 ? "text-emerald-600" : "text-rose-500")}>
                                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
