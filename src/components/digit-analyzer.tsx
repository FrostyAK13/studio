'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const initialStats = [
    { digit: 0, percentage: 8.20, color: 'red', position: 'bottom' as const },
    { digit: 1, percentage: 9.50 },
    { digit: 2, percentage: 8.80, color: 'orange' },
    { digit: 3, percentage: 10.70 },
    { digit: 4, percentage: 10.40 },
    { digit: 5, percentage: 11.10, color: 'green' },
    { digit: 6, percentage: 10.00 },
    { digit: 7, percentage: 10.60 },
    { digit: 8, percentage: 9.80 },
    { digit: 9, percentage: 10.90, color: 'blue' },
];

const DigitStat = ({ digit, percentage, color, position }: { digit: number; percentage: number; color?: string; position?: 'bottom' }) => {
    const colorClasses: { [key: string]: string } = {
        red: 'border-red-500',
        orange: 'border-orange-500',
        green: 'border-green-500',
        blue: 'border-blue-500',
    };

    const textColorClasses: { [key: string]: string } = {
        red: 'text-red-500',
        orange: 'text-orange-500',
        green: 'text-green-500',
        blue: 'text-blue-500',
    };

    return (
        <div className="relative flex flex-col items-center">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 bg-card ${color ? colorClasses[color] : 'border-muted'}`}>
                <div className="text-center">
                    <div className="text-4xl font-bold">{digit}</div>
                    <div className={`text-sm font-semibold ${color ? textColorClasses[color] : 'text-muted-foreground'}`}>{percentage.toFixed(2)}%</div>
                </div>
            </div>
            {position === 'bottom' && <div className="absolute -bottom-3 h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-red-500" />}
        </div>
    );
};

export function DigitAnalyzer() {
    const [stats, setStats] = React.useState(initialStats);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setStats(prevStats => {
                const newStats = [...prevStats];
                // Simulate some random fluctuation
                for (let i = 0; i < newStats.length; i++) {
                    const change = (Math.random() - 0.5) * 0.2;
                    newStats[i].percentage += change;
                    if (newStats[i].percentage < 0) newStats[i].percentage = 0;
                }
                
                // Normalize to sum to 100
                const total = newStats.reduce((acc, s) => acc + s.percentage, 0);
                if (total === 0) return newStats; // Avoid division by zero
                const scale = 100 / total;
                return newStats.map(s => ({ ...s, percentage: s.percentage * scale }));
            });
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="bg-card/50">
            <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-8 gap-x-4 justify-items-center">
                    {stats.map(stat => (
                        <DigitStat key={stat.digit} {...stat} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
