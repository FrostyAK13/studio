'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { ClassicView } from './classic-view';
import { syntheticIndices } from '@/lib/mock-data';

export function Dashboard() {
    const [price, setPrice] = React.useState(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000);
    const [selectedMarket, setSelectedMarket] = React.useState(syntheticIndices[0].id);

    React.useEffect(() => {
        // Truncate the ticks array if maxTicks is reduced
        setLastDigitTicks(prev => prev.slice(0, maxTicks));
    }, [maxTicks]);


    React.useEffect(() => {
        setPrice(0);
        setLastDigitTicks([]);

        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=84799');

        ws.onopen = () => {
            ws.send(JSON.stringify({ "ticks": selectedMarket, "subscribe": 1 }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error('WebSocket error:', data.error.message);
                return;
            }

            if (data.msg_type === 'tick') {
                const newPrice = data.tick.quote;
                const newDigit = parseInt(newPrice.toString().slice(-1));
                
                setPrice(parseFloat(newPrice));
                
                setLastDigitTicks(prevTicks => [newDigit, ...prevTicks].slice(0, maxTicks));
            }
        };

        ws.onclose = () => {};
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
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
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
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
                />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
