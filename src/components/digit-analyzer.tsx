'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Loader, AlertTriangle } from 'lucide-react';
import { getAnalysis } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateLastDigitTicks } from '@/lib/mock-data';
import type { DigitPatternAssistantInsightOutput } from '@/ai/flows/digit-pattern-assistant-insight';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

export function DigitAnalyzer() {
  const [ticks, setTicks] = React.useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisResult, setAnalysisResult] =
    React.useState<DigitPatternAssistantInsightOutput | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const initialTicks = generateLastDigitTicks(20);
    setTicks(initialTicks);

    const interval = setInterval(() => {
      setTicks((prev) => {
        const newTicks = [...prev, Math.floor(Math.random() * 10)];
        if (newTicks.length > 20) {
          return newTicks.slice(newTicks.length - 20);
        }
        return newTicks;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    const analysisTicks = generateLastDigitTicks(100);

    try {
      const result = await getAnalysis(analysisTicks);
      setAnalysisResult(result);
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: e.message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digit Pattern Assistant</CardTitle>
        <CardDescription>AI-powered last digit analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Live Last Digits
          </h4>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {ticks.map((tick, index) => (
                <motion.div
                  key={`${tick}-${index}-${Math.random()}`} // Poor man's unique key for transition
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Badge
                    variant={tick % 2 === 0 ? 'secondary' : 'default'}
                    className="flex h-8 w-8 items-center justify-center text-lg font-bold"
                    style={{
                      backgroundColor: tick < 5 ? `hsl(var(--primary) / ${tick * 0.1 + 0.3})` : `hsl(var(--accent) / ${ (tick-5) * 0.1 + 0.3})`
                    }}
                  >
                    {tick}
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        {isAnalyzing && (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>
        )}
        {analysisResult && (
          <div className="space-y-4 pt-4">
            <div>
              <h4 className="font-semibold">Insights</h4>
              <p className="text-sm text-muted-foreground">{analysisResult.insights}</p>
            </div>
            {analysisResult.patternsIdentified?.length > 0 && (
              <div>
                <h4 className="font-semibold">Patterns Identified</h4>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {analysisResult.patternsIdentified.map((pattern, i) => (
                    <li key={i}>{pattern}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysisResult.anomaliesDetected?.length > 0 && (
              <div>
                <h4 className="font-semibold">Anomalies Detected</h4>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {analysisResult.anomaliesDetected.map((anomaly, i) => (
                    <li key={i}>{anomaly}</li>
                  ))}
                </ul>
              </div>
            )}
             {analysisResult.recommendations && (
              <div>
                <h4 className="font-semibold">Recommendations</h4>
                <p className="text-sm text-muted-foreground">{analysisResult.recommendations}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAnalysis} disabled={isAnalyzing} className="w-full">
          {isAnalyzing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <BrainCircuit className="mr-2 h-4 w-4" />
              Analyze Last 100 Digits
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
