'use client';

import * as React from 'react';
import { Play, RotateCcw, TrendingUp, TrendingDown, Target, Zap, Activity, Info, ListChecks, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function BotRunner() {
    const [isRunning, setIsRunning] = React.useState(false);

    return (
        <Card className="flex flex-col h-full border-none shadow-2xl bg-slate-950/90 backdrop-blur-2xl overflow-hidden relative border-l border-white/5 animate-in slide-in-from-right-4 duration-500">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-cyan-400 to-primary opacity-50" />
            
            <CardHeader className="pb-4 pt-6 px-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <Button 
                        onClick={() => setIsRunning(!isRunning)}
                        className={cn(
                            "h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-xl active:scale-95",
                            isRunning 
                                ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" 
                                : "bg-primary hover:bg-primary/90 shadow-primary/20"
                        )}
                    >
                        {isRunning ? (
                            <Activity className="mr-2 h-4 w-4 animate-pulse" />
                        ) : (
                            <Play className="mr-2 h-4 w-4 fill-current" />
                        )}
                        {isRunning ? 'STOP' : 'RUN'}
                    </Button>
                    <div className="flex-1 text-right">
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            isRunning ? "text-emerald-400" : "text-muted-foreground/60"
                        )}>
                            {isRunning ? 'Bot is running...' : 'Bot is not running'}
                        </p>
                        <Progress 
                            value={isRunning ? 100 : 0} 
                            className={cn(
                                "h-1 mt-1.5 bg-white/5",
                                isRunning ? "[&>div]:bg-emerald-400 [&>div]:animate-pulse" : "[&>div]:bg-white/10"
                            )} 
                        />
                    </div>
                </div>
            </CardHeader>

            <Tabs defaultValue="summary" className="flex-1 flex flex-col">
                <div className="px-4 border-b border-white/5">
                    <TabsList className="w-full bg-transparent justify-start gap-6 h-10 p-0">
                        {['summary', 'transactions', 'journal'].map((tab) => (
                            <TabsTrigger 
                                key={tab} 
                                value={tab}
                                className="px-0 h-full bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none font-black text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-all"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <TabsContent value="summary" className="mt-0 h-full flex items-center justify-center text-center p-8">
                        <div className="space-y-4 max-w-[240px]">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                                <Activity className="h-8 w-8 text-muted-foreground/20" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
                                When you're ready to trade, hit <span className="text-primary font-black uppercase">Run</span>. 
                                You'll be able to track your bot's performance here.
                            </p>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="transactions" className="mt-0 h-full flex items-center justify-center">
                         <div className="text-center space-y-2">
                             <ListChecks className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                             <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">No active transactions</p>
                         </div>
                    </TabsContent>

                    <TabsContent value="journal" className="mt-0 h-full flex items-center justify-center">
                         <div className="text-center space-y-2">
                             <History className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                             <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Journal log is empty</p>
                         </div>
                    </TabsContent>
                </div>
            </Tabs>

            <div className="p-4 bg-black/40 border-t border-white/5 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Total Stake</p>
                        <p className="text-sm font-black text-white">0.00 <span className="text-[8px] opacity-40">USD</span></p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Total Payout</p>
                        <p className="text-sm font-black text-white">0.00 <span className="text-[8px] opacity-40">USD</span></p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">No. of Runs</p>
                        <p className="text-sm font-black text-white">0</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Contracts Lost</p>
                        <p className="text-sm font-black text-rose-500">0</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Contracts Won</p>
                        <p className="text-sm font-black text-emerald-400">0</p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Total Profit/Loss</p>
                        <p className="text-sm font-black text-emerald-400">0.00 <span className="text-[8px] opacity-40">USD</span></p>
                    </div>
                </div>

                <Button 
                    variant="outline" 
                    onClick={() => {}}
                    className="w-full h-10 border-white/10 hover:bg-white/5 font-black text-[10px] uppercase tracking-widest rounded-xl"
                >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Reset Metrics
                </Button>
            </div>
        </Card>
    );
}
