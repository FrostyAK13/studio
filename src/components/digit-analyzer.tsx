'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Loader,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
import { Progress } from './ui/progress';

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

  const renderPredictionCard = (
    title: string,
    prediction: string | number,
    confidence: number,
    analysis: string,
    icon: React.ReactNode
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{prediction}</div>
        <p className="text-xs text-muted-foreground">{analysis}</p>
        <div className="mt-2 flex items-center gap-2">
            <Progress value={confidence * 100} className="h-2" />
            <span className="text-xs font-semibold text-muted-foreground">{(confidence * 100).toFixed(0)}%</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Digit Pattern Assistant</CardTitle>
        <CardDescription>AI-powered predictions for digit markets.</CardDescription>
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
                  key={`${tick}-${index}-${Math.random()}`}
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
          <div className="grid gap-4 pt-4 md:grid-cols-1">
            <Skeleton className="h-[125px] w-full" />
            <Skeleton className="h-[125px] w-full" />
            <Skeleton className="h-[125px] w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {analysisResult && (
          <div className="grid gap-4 pt-4 md:grid-cols-1">
            {renderPredictionCard(
              'Even / Odd',
              analysisResult.evenOdd.prediction,
              analysisResult.evenOdd.confidence,
              analysisResult.evenOdd.analysis,
              <Zap className="h-4 w-4 text-muted-foreground" />
            )}
            {renderPredictionCard(
              'Over / Under',
              analysisResult.overUnder.prediction,
              analysisResult.overUnder.confidence,
              analysisResult.overUnder.analysis,
              analysisResult.overUnder.prediction === 'Over 3' ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            {renderPredictionCard(
              'Digit Match',
              `Digit ${analysisResult.matches.prediction}`,
              analysisResult.matches.confidence,
              analysisResult.matches.analysis,
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            )}
             <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">General Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{analysisResult.generalInsights}</p>
                </CardContent>
            </Card>
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
              Get Predictions
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
