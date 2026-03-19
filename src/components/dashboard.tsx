
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { AnalyzerView } from './analyzer-view';
import { syntheticIndices } from '@/lib/mock-data';
import { DigitFrequencyView } from './digit-frequency-view';
import { InsightView } from './insight-view';
import { CorrelationView } from './correlation-view';
import { ConnectionStatus } from './connection-status';

type ConnectionStatusType = 'connecting' | 'streaming' | 'disconnected';

export function Dashboard() {
    const [price, setPrice] = React.useState(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [priceHistory, setPriceHistory] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000); // Strict baseline for 100% accuracy
    const [selectedMarket, setSelectedMarket] = React.useState(syntheticIndices[0].id);
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatusType>('connecting');
    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);

    React.useEffect(() => {
        setPrice(0);
        setLastDigitTicks([]);
        setPriceHistory([]);
        setTickTimestamps([]);
        setConnectionStatus('connecting');

        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=84799');

        let pipSize: number | null = null;
        let historyBuffer: {time: number, price: number}[] | null = null;

        const prependTickToState = (tick: { quote: number, time?: number }, fromHistory = false) => {
            const newPrice = tick.quote;
            
            // Ensure pipSize is applied for correct digit extraction
            const currentPipSize = pipSize !== null ? pipSize : 2;
            const priceString = newPrice.toFixed(currentPipSize);
            const newDigit = parseInt(priceString.slice(-1));

            if (fromHistory && tick.time) {
                setTickTimestamps(prev => [tick.time!, ...prev].slice(0, 1000));
            } else if (!fromHistory) {
                setTickTimestamps(prev => [Date.now(), ...prev].slice(0, 1000));
            }

            setPrice(newPrice);
            setLastDigitTicks(prevTicks => [newDigit, ...prevTicks].slice(0, 1000));
            setPriceHistory(prevPrices => [newPrice, ...prevPrices].slice(0, 1000));
        };

        ws.onopen = () => {
            // Strictly request 1000 ticks history with subscription
            ws.send(JSON.stringify({ 
                "ticks_history": selectedMarket, 
                "count": 1000, 
                "end": "latest", 
                "style": "ticks", 
                "subscribe": 1 
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error('WebSocket error:', data.error.message);
                setConnectionStatus('disconnected');
                return;
            }

            if (data.msg_type === 'history') {
                if (data.history && data.history.times && data.history.prices) {
                    historyBuffer = data.history.prices.map((price: number, index: number) => ({
                        price: price,
                        time: data.history.times[index] * 1000 
                    })).reverse();
                }
            }

            if (data.msg_type === 'tick') {
                setConnectionStatus('streaming');
                if (data.tick && typeof data.tick.quote === 'number') {
                    if (pipSize === null) {
                        pipSize = data.tick.pip_size ?? 2;
                        setDecimalPlaces(pipSize);
                        
                        if (historyBuffer) {
                            // Process history as a block to populate the 1000-tick window
                            const digits = historyBuffer.map(h => parseInt(h.price.toFixed(pipSize!).slice(-1)));
                            const prices = historyBuffer.map(h => h.price);
                            const times = historyBuffer.map(h => h.time);
                            
                            setLastDigitTicks(digits.slice(0, 1000));
                            setPriceHistory(prices.slice(0, 1000));
                            setTickTimestamps(times.slice(0, 1000));
                            setPrice(prices[0]);
                            
                            historyBuffer = null;
                        }
                    }
                    prependTickToState(data.tick, false);
                }
            }
        };

        ws.onclose = () => setConnectionStatus('disconnected');
        ws.onerror = () => setConnectionStatus('disconnected');

        return () => {
           if(ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
             ws.close();
           }
        };
    }, [selectedMarket]); // Only re-run when market changes

    const handleMaxTicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setMaxTicks(0);
            return;
        }
        let numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            if (numValue > 5000) numValue = 5000;
            setMaxTicks(numValue);
        }
    };

    const handleMaxTicksBlur = () => {
        if (maxTicks < 10) setMaxTicks(10);
    };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-4">
          <a
            href="https://frostytraders.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-bold text-foreground transition-colors hover:text-primary"
          >
            frostytraders.com
          </a>
          <ConnectionStatus status={connectionStatus} />
        </div>
        <div>
          <span className="font-semibold text-muted-foreground uppercase">Emporer Migosi</span>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Tabs defaultValue="scanner" className="w-full max-w-7xl mx-auto">
            <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="scanner">SCANNER</TabsTrigger>
                <TabsTrigger value="analyzer">ANALYZER</TabsTrigger>
                <TabsTrigger value="frequency">FREQUENCY</TabsTrigger>
                <TabsTrigger value="insight">INSIGHT</TabsTrigger>
                <TabsTrigger value="circles">CIRCLES</TabsTrigger>
            </TabsList>

            <TabsContent value="scanner">
                <ScannerView 
                    price={price} 
                    lastDigitTicks={lastDigitTicks}
                    priceHistory={priceHistory}
                    maxTicks={maxTicks}
                    handleMaxTicksChange={handleMaxTicksChange}
                    handleMaxTicksBlur={handleMaxTicksBlur}
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                    decimalPlaces={decimalPlaces}
                />
            </TabsContent>

            <TabsContent value="analyzer">
                <AnalyzerView
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
                    priceHistory={priceHistory}
                    maxTicks={maxTicks}
                    handleMaxTicksChange={handleMaxTicksChange}
                    handleMaxTicksBlur={handleMaxTicksBlur}
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                    decimalPlaces={decimalPlaces}
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
            
            <TabsContent value="circles">
                <CorrelationView
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                    lastDigitTicks={lastDigitTicks}
                />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
