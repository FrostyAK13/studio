'use client';

import * as React from 'react';
import { Bitcoin, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { syntheticIndices } from '@/lib/mock-data';
import { DigitAnalyzer } from './digit-analyzer';
import { MatchesDiffersAnalysis } from './matches-differs-analysis';
import { OverUnderAnalysis } from './over-under-analysis';
import { EvenOddAnalysis } from './even-odd-analysis';

export function Dashboard() {
    const [price, setPrice] = React.useState(839.80);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000);

    React.useEffect(() => {
        // Initialize or adjust ticks when maxTicks changes
        setLastDigitTicks(currentTicks => {
            const currentLength = currentTicks.length;
            if (currentLength < maxTicks) {
                const additionalTicks = Array.from({ length: maxTicks - currentLength }, () => Math.floor(Math.random() * 10));
                return [...additionalTicks, ...currentTicks];
            } else {
                return currentTicks.slice(0, maxTicks);
            }
        });
    }, [maxTicks]);


    React.useEffect(() => {
        const interval = setInterval(() => {
            setPrice(prevPrice => {
                const newPrice = prevPrice + (Math.random() - 0.5) * 2;
                const newDigit = parseInt(newPrice.toFixed(2).toString().slice(-1));
                
                setLastDigitTicks(prevTicks => {
                    const updatedTicks = [newDigit, ...prevTicks].slice(0, maxTicks);
                    return updatedTicks;
                });

                return parseFloat(newPrice.toFixed(2));
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [maxTicks]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <Bitcoin className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">DerivInsight Pro</h1>
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <div className="w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-card flex items-center justify-center">
                    <Select defaultValue={syntheticIndices[0].id}>
                      <SelectTrigger className="w-full bg-transparent font-semibold text-lg h-full border-0 focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select Index" />
                      </SelectTrigger>
                      <SelectContent>
                        {syntheticIndices.map((index) => (
                          <SelectItem key={index.id} value={index.id}>
                            {index.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                 <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card gap-3">
                    <div className="flex justify-between items-center w-full">
                      <Label htmlFor="max-ticks" className="text-sm text-muted-foreground tracking-widest">TICKS</Label>
                      <span className="text-2xl font-bold">{maxTicks}</span>
                    </div>
                    <Slider
                        id="max-ticks"
                        min={10}
                        max={5000}
                        step={10}
                        value={[maxTicks]}
                        onValueChange={(value) => setMaxTicks(value[0])}
                    />
                </div>
                <div className="rounded-lg p-4 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-primary-foreground">
                    <span className="text-sm tracking-widest">PRICE</span>
                    <span className="text-4xl font-bold">{price.toFixed(2)}</span>
                </div>
            </div>
            <EvenOddAnalysis lastDigitTicks={lastDigitTicks} />
            <div className="my-6" />
            <MatchesDiffersAnalysis lastDigitTicks={lastDigitTicks} />
            <div className="my-6" />
            <OverUnderAnalysis lastDigitTicks={lastDigitTicks} />
            <div className="my-6" />
            <DigitAnalyzer lastDigitTicks={lastDigitTicks} />
        </div>
      </main>
    </div>
  );
}
