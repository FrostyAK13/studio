'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { ClassicView } from './classic-view';

export function Dashboard() {
    const [price, setPrice] = React.useState(839.80);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000);

    React.useEffect(() => {
        // Initialize or adjust ticks when maxTicks changes
        if (maxTicks < 10) return;
        setLastDigitTicks(currentTicks => {
            const currentLength = currentTicks.length;
            if (currentLength < maxTicks) {
                const additionalTicks = Array.from({ length: maxTicks - currentLength }, () => Math.floor(Math.random() * 10));
                return [...additionalTicks, ...currentTicks];
            } else {
                return currentTicks.slice(currentTicks.length - maxTicks);
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

    const handleMaxTicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setMaxTicks(0); // Temporarily set to 0 to allow empty input
            return;
        }

        let numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            if (numValue > 5000) {
                numValue = 5000;
            }
            setMaxTicks(numValue);
        }
    };

    const handleMaxTicksBlur = () => {
        if (maxTicks < 10) {
            setMaxTicks(10);
        }
    };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <a
            href="https://frostytraders.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-bold text-foreground transition-colors hover:text-primary"
          >
            frostytraders.com
          </a>
        </div>
        <div>
          <span className="font-semibold text-muted-foreground">EMPORER MIGOSI</span>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Tabs defaultValue="scanner" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="scanner">Scanner</TabsTrigger>
                <TabsTrigger value="classic">Classic</TabsTrigger>
            </TabsList>

            <TabsContent value="scanner">
                <ScannerView 
                    price={price} 
                    lastDigitTicks={lastDigitTicks}
                    maxTicks={maxTicks}
                    handleMaxTicksChange={handleMaxTicksChange}
                    handleMaxTicksBlur={handleMaxTicksBlur}
                />
            </TabsContent>

            <TabsContent value="classic">
                <ClassicView
                    price={price}
                    lastDigitTicks={lastDigitTicks}
                    maxTicks={maxTicks}
                    handleMaxTicksChange={handleMaxTicksChange}
                    handleMaxTicksBlur={handleMaxTicksBlur}
                />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
