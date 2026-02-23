'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { ClassicView } from './classic-view';
import { syntheticIndices } from '@/lib/mock-data';
import { DigitFrequencyView } from './digit-frequency-view';
import { InsightView } from './insight-view';

export function Dashboard() {
    const [price, setPrice] = React.useState(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000);
    const [selectedMarket, setSelectedMarket] = React.useState(syntheticIndices[0].id);
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [priceHistory, setPriceHistory] = React.useState<{ time: number; price: number }[]>([]);
    const maxHistoryPoints = 60; // Approx 1 minute of 1s ticks

    React.useEffect(() => {
        // Truncate the ticks array if maxTicks is reduced
        setLastDigitTicks(prev => prev.slice(0, maxTicks));
    }, [maxTicks]);


    React.useEffect(() => {
        setPrice(0);
        setLastDigitTicks([]);
        setPriceHistory([]);

        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=84799');

        let pipSize: number | null = null;
        let historyBuffer: number[] | null = null;

        const prependTickToState = (tick: { quote: number }, size: number) => {
            const newPrice = tick.quote;
            const priceString = newPrice.toFixed(size);
            const newDigit = parseInt(priceString.slice(-1));

            setPrice(newPrice);
            setLastDigitTicks(prevTicks => [newDigit, ...prevTicks].slice(0, maxTicks));
        };

        ws.onopen = () => {
            ws.send(JSON.stringify({ "ticks_history": selectedMarket, "count": maxHistoryPoints, "end": "latest", "subscribe": 1 }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error('WebSocket error:', data.error.message);
                return;
            }

            if (data.msg_type === 'history') {
                if (data.history && data.history.prices && data.history.times) {
                    historyBuffer = data.history.prices;
                     const historicalPrices = data.history.times.map((t: number, i: number) => ({
                        time: t * 1000,
                        price: data.history.prices[i]
                    }));
                    setPriceHistory(historicalPrices);
                }
            }

            if (data.msg_type === 'tick') {
                if (data.tick && typeof data.tick.quote === 'number' && typeof data.tick.pip_size === 'number') {
                    const currentTick = data.tick;

                    const newPrice = currentTick.quote;
                    const newTime = currentTick.epoch * 1000;
                    setPriceHistory(prev => [...prev, { time: newTime, price: newPrice }].slice(-maxHistoryPoints));

                    if (pipSize === null) {
                        // This is the first tick, so pipSize is now known.
                        pipSize = currentTick.pip_size;
                        setDecimalPlaces(pipSize);
                        
                        const currentPrice = currentTick.quote;
                        const priceString = currentPrice.toFixed(pipSize);
                        const currentDigit = parseInt(priceString.slice(-1));
                        setPrice(currentPrice);

                        if (historyBuffer) {
                            // History arrived before this tick. Process history and this tick together.
                            const historicalDigits = historyBuffer.map(p => {
                                const priceString = p.toFixed(pipSize as number);
                                return parseInt(priceString.slice(-1));
                            }).reverse();
                            
                            setLastDigitTicks([currentDigit, ...historicalDigits].slice(0, maxTicks));
                            historyBuffer = null; // Clear buffer
                        } else {
                            // Unlikely, but if history hasn't arrived, start with this tick.
                            setLastDigitTicks([currentDigit]);
                        }
                    } else {
                        // Not the first tick, just prepend it.
                        prependTickToState(currentTick, pipSize);
                    }
                }
            }
        };

        ws.onclose = () => {};
        ws.onerror = (error) => {
            console.error('WebSocket error:', 'An error occurred with the WebSocket connection.');
        };

        return () => {
           if(ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
             ws.close();
           }
        };
    }, [selectedMarket, maxTicks]);

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
        <Tabs defaultValue="scanner" className="w-full max-w-7xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="scanner">Scanner</TabsTrigger>
                <TabsTrigger value="classic">Classic</TabsTrigger>
                <TabsTrigger value="frequency">Frequency</TabsTrigger>
                <TabsTrigger value="insight">Insight</TabsTrigger>
            </TabsList>

            <TabsContent value="scanner">
                <ScannerView 
                    price={price} 
                    lastDigitTicks={lastDigitTicks}
                    maxTicks={maxTicks}
                    handleMaxTicksChange={handleMaxTicksChange}
                    handleMaxTicksBlur={handleMaxTicksBlur}
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                    decimalPlaces={decimalPlaces}
                    priceHistory={priceHistory}
                />
            </TabsContent>

            <TabsContent value="classic">
                <ClassicView
                    price={price}
                    lastDigitTicks={lastDigitTicks}
                    maxTicks={maxTicks}
                    handleMaxTicksChange={handleMaxTicksChange}
                    handleMaxTicksBlur={handleMaxTicksBlur}
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                    decimalPlaces={decimalPlaces}
                />
            </TabsContent>

            <TabsContent value="frequency">
                <DigitFrequencyView
                    price={price}
                    lastDigitTicks={lastDigitTicks}
                    maxTicks={maxTicks}
                    handleMaxTicksChange={handleMaxTicksChange}
                    handleMaxTicksBlur={handleMaxTicksBlur}
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                    decimalPlaces={decimalPlaces}
                    priceHistory={priceHistory}
                />
            </TabsContent>

             <TabsContent value="insight">
                <InsightView
                    price={price}
                    decimalPlaces={decimalPlaces}
                    lastDigitTicks={lastDigitTicks}
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
