'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Timer } from 'lucide-react';

interface TickPacingVisualizerProps {
    tickTimestamps: number[];
    lastDigitTicks: number[];
}

export function TickPacingVisualizer({ tickTimestamps, lastDigitTicks }: TickPacingVisualizerProps) {

    const rhythmData = React.useMemo(() => {
        if (tickTimestamps.length < 2) return [];

        const data = [];
        // newest ticks are at the beginning of the array
        for (let i = 0; i < Math.min(tickTimestamps.length - 1, 50); i++) {
            const interval = tickTimestamps[i] - tickTimestamps[i+1];
            const digit = lastDigitTicks[i];

            let pace: 'Fast' | 'Moderate' | 'Slow';
            if (interval < 500) {
                pace = 'Fast';
            } else if (interval < 1500) {
                pace = 'Moderate';
            } else {
                pace = 'Slow';
            }
            
            data.push({
                name: i,
                interval,
                digit,
                pace,
            });
        }
        // The chart expects data in chronological order, so we reverse it
        return data.reverse();

    }, [tickTimestamps, lastDigitTicks]);

    const chartConfig = {
        interval: {
            label: "Interval (ms)",
        },
        Fast: {
            label: "Fast",
            color: "hsl(var(--chart-2))",
        },
        Moderate: {
            label: "Moderate",
            color: "hsl(var(--chart-5))",
        },
        Slow: {
            label: "Slow",
            color: "hsl(var(--chart-1))",
        },
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Timer className="h-5 w-5 text-muted-foreground" />
                    Tick Pacing & Rhythm
                </CardTitle>
                <CardDescription>Visualizing the time between each tick (last 50 ticks).</CardDescription>
            </CardHeader>
            <CardContent>
                {rhythmData.length < 10 ? (
                     <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                        <p>Collecting data for rhythm analysis...</p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <BarChart
                            data={rhythmData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                            <YAxis
                                type="category"
                                dataKey="name"
                                hide={true}
                            />
                            <XAxis type="number" hide={true} />
                            <Tooltip
                                cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="min-w-[8rem] rounded-lg border bg-background p-2 text-sm shadow-sm">
                                        <p className="font-bold">{`Interval: ${payload[0].value}ms`}</p>
                                        <p className="text-muted-foreground">{`Resulting Digit: ${payload[0].payload.digit}`}</p>
                                        <p className="text-muted-foreground">{`Pace: ${payload[0].payload.pace}`}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                            />
                            <Bar dataKey="interval" radius={4}>
                                 <LabelList
                                    dataKey="digit"
                                    position="right"
                                    offset={8}
                                    className="fill-foreground font-bold"
                                    fontSize={12}
                                />
                                {rhythmData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.pace].color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
