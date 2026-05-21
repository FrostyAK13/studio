'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Timer, Zap, Activity } from 'lucide-react';

interface TickPacingVisualizerProps {
    tickTimestamps: number[];
    lastDigitTicks: number[];
}

export function TickPacingVisualizer({ tickTimestamps, lastDigitTicks }: TickPacingVisualizerProps) {
    const pacingMetrics = React.useMemo(() => {
        if (tickTimestamps.length < 2) return { current: 0, status: 'STANDBY', color: 'text-muted-foreground' };

        const interval = tickTimestamps[0] - tickTimestamps[1];
        let status = 'MODERATE';
        let color = 'text-amber-600';

        if (interval < 500) {
            status = 'EXTREME';
            color = 'text-rose-500';
        } else if (interval < 1000) {
            status = 'FAST';
            color = 'text-orange-600';
        } else if (interval > 2000) {
            status = 'STAGNANT';
            color = 'text-cyan-600';
        }

        return { current: interval, status, color };
    }, [tickTimestamps]);

    return (
        <Card className="border-none shadow-2xl bg-card overflow-hidden relative rounded-[2rem] border border-primary/10">
            <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Timer className="h-4 w-4" /> VOLATILITY RHYTHM
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="flex items-end justify-between mb-4">
                    <div>
                        <p className={cn("text-3xl font-black tabular-nums tracking-tighter", pacingMetrics.color)}>
                            {pacingMetrics.current} <span className="text-xs opacity-40 ml-1">MS</span>
                        </p>
                        <p className={cn("text-[8px] font-black uppercase tracking-[0.2em]", pacingMetrics.color)}>
                            {pacingMetrics.status} FLOW
                        </p>
                    </div>
                    <div className="p-3 bg-muted rounded-2xl border border-primary/5">
                        <Zap className={cn("h-6 w-6 animate-pulse", pacingMetrics.color)} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-muted-foreground">
                        <span>PACE INDICATOR</span>
                        <span>{Math.max(0, 3000 - pacingMetrics.current)} UNITS</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden border border-primary/5">
                        <div 
                            className={cn("h-full transition-all duration-500", pacingMetrics.color.replace('text-', 'bg-'))} 
                            style={{ width: `${Math.min(100, (3000 - pacingMetrics.current) / 30)}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
