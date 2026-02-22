'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Loader, AlertTriangle } from 'lucide-react';
import { getAnalysis } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DigitPatternAssistantInsightOutput } from '@/ai/flows/digit-pattern-assistant-insight';

const initialStats = Array.from({ length: 10 }, (_, i) => ({
    digit: i,
    percentage: 10.00,
    color: undefined as string | undefined,
    position: undefined as 'bottom' | undefined,
}));

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

const AnalysisCard = ({ title, prediction, confidence, analysis }: { title: string; prediction: string | number; confidence: number; analysis: string; }) => (
    <Card className="bg-card/70 w-full">
        <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-4xl font-bold text-primary">{prediction.toString()}</p>
            <p className="text-sm text-muted-foreground mt-1">Confidence: {(confidence * 100).toFixed(0)}%</p>
            <p className="text-sm mt-4">{analysis}</p>
        </CardContent>
    </Card>
);

export function DigitAnalyzer({ lastDigitTicks }: { lastDigitTicks: number[] }) {
    const [stats, setStats] = React.useState(initialStats);
    const [analysis, setAnalysis] = React.useState<DigitPatternAssistantInsightOutput | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (lastDigitTicks.length === 0) {
            setStats(initialStats);
            return;
        }

        const digitCounts = new Array(10).fill(0);
        lastDigitTicks.forEach(tick => {
            if (tick >= 0 && tick <= 9) {
                digitCounts[tick]++;
            }
        });
        
        const newStats = digitCounts.map((count, index) => ({
            digit: index,
            percentage: (count / lastDigitTicks.length) * 100,
            color: undefined as string | undefined,
            position: undefined as 'bottom' | undefined,
        }));

        if (lastDigitTicks.length > 0) {
            let hotIndex = 0;
            let coldIndex = 0;
            for (let i = 1; i < newStats.length; i++) {
                if (newStats[i].percentage > newStats[hotIndex].percentage) hotIndex = i;
                if (newStats[i].percentage < newStats[coldIndex].percentage) coldIndex = i;
            }
            
            newStats[hotIndex].color = 'blue';
            newStats[coldIndex].color = 'red';
            newStats[coldIndex].position = 'bottom';
        }
        
        setStats(newStats);
    }, [lastDigitTicks]);

    const handleGetAnalysis = async () => {
        setLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await getAnalysis(lastDigitTicks);
            setAnalysis(result);
        } catch (e) {
            setError('Failed to get analysis. Please try again.');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card className="bg-card/50">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-8 gap-x-4 justify-items-center">
                        {stats.map(stat => (
                            <DigitStat key={stat.digit} {...stat} />
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="my-6 text-center">
                <Button onClick={handleGetAnalysis} disabled={loading || lastDigitTicks.length === 0} size="lg">
                    {loading ? <Loader className="mr-2 h-5 w-5 animate-spin" /> : <BrainCircuit className="mr-2 h-5 w-5" />}
                    Get AI Predictions
                </Button>
            </div>
            
            <AnimatePresence>
            {loading && (
                 <div className="flex justify-center items-center h-64">
                    <Loader className="h-12 w-12 animate-spin text-primary" />
                 </div>
            )}
            </AnimatePresence>

            {error && (
                <div className="bg-destructive/20 text-destructive-foreground p-4 rounded-md flex items-center gap-4">
                    <AlertTriangle/>
                    {error}
                </div>
            )}
            
            <AnimatePresence>
            {analysis && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <AnalysisCard 
                        title="Even / Odd"
                        prediction={analysis.evenOdd.prediction}
                        confidence={analysis.evenOdd.confidence}
                        analysis={analysis.evenOdd.analysis}
                    />
                    <AnalysisCard 
                        title="Over / Under"
                        prediction={analysis.overUnder.prediction}
                        confidence={analysis.overUnder.confidence}
                        analysis={analysis.overUnder.analysis}
                    />
                     <AnalysisCard 
                        title="Matches"
                        prediction={analysis.matches.prediction}
                        confidence={analysis.matches.confidence}
                        analysis={analysis.matches.analysis}
                    />
                </motion.div>
            )}
            </AnimatePresence>
        </>
    );
}
