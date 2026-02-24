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
    const [maxTicks, setMaxTicks] = React.useState(1000);
    const [selectedMarket, setSelectedMarket] = React.useState(syntheticIndices[0].id);
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatusType>('connecting');

    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);
    const [currentTps, setCurrentTps] = React.useState(0);
    const [historicalTps, setHistoricalTps] = React.useState<{ time: string; tps: number }[]>([]);
    const [highVolatilityDigits, setHighVolatilityDigits] = React.useState<number[]>([]);
    const [lowVolatilityDigits, setLowVolatilityDigits] = React.useState<number[]>([]);
    const HIGH_VOLATILITY_THRESHOLD = 5;
    const LOW_VOLATILITY_THRESHOLD = 2;

    React.useEffect(() => {
        // Truncate the arrays if maxTicks is reduced
        setLastDigitTicks(prev => prev.slice(0, maxTicks));
        setPriceHistory(prev => prev.slice(0, maxTicks));
        setTickTimestamps(prev => prev.slice(0, maxTicks));
    }, [maxTicks]);


    React.useEffect(() => {
        const tpsInterval = setInterval(() => {
            const now = Date.now();
            const oneSecondAgo = now - 1000;
            const recentTicksCount = tickTimestamps.filter(t => t > oneSecondAgo).length;
            setCurrentTps(recentTicksCount);

            setHistoricalTps(prev => {
                const newEntry = { 
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
                    tps: recentTicksCount 
                };
                return [...prev, newEntry].slice(-60); // Keep last 60 seconds
            });
        }, 1000);

        return () => clearInterval(tpsInterval);
    }, [tickTimestamps]);


    React.useEffect(() => {
        setPrice(0);
        setLastDigitTicks([]);
        setPriceHistory([]);
        setTickTimestamps([]);
        setHighVolatilityDigits([]);
        setLowVolatilityDigits([]);
        setHistoricalTps([]);
        setConnectionStatus('connecting');

        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=84799');

        let pipSize: number | null = null;
        let historyBuffer: {time: number, price: number}[] | null = null;

        const prependTickToState = (tick: { quote: number }, fromHistory = false) => {
            const newPrice = tick.quote;
            const priceString = newPrice.toFixed(pipSize as number);
            const newDigit = parseInt(priceString.slice(-1));

            if (!fromHistory) {
                 if (currentTps > HIGH_VOLATILITY_THRESHOLD) {
                    setHighVolatilityDigits(prev => [newDigit, ...prev].slice(0, 1000));
                } else if (currentTps > 0 && currentTps < LOW_VOLATILITY_THRESHOLD) {
                    setLowVolatilityDigits(prev => [newDigit, ...prev].slice(0, 1000));
                }
                setTickTimestamps(prev => [Date.now(), ...prev].slice(0, maxTicks));
            }

            setPrice(newPrice);
            setLastDigitTicks(prevTicks => [newDigit, ...prevTicks].slice(0, maxTicks));
            setPriceHistory(prevPrices => [newPrice, ...prevPrices].slice(0, maxTicks));
        };

        ws.onopen = () => {
            ws.send(JSON.stringify({ "ticks_history": selectedMarket, "count": 100, "end": "latest", "style": "ticks", "subscribe": 1 }));
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
                        time: data.history.times[index]
                    })).reverse(); // Newest is first
                }
            }

            if (data.msg_type === 'tick') {
                setConnectionStatus('streaming');
                if (data.tick && typeof data.tick.quote === 'number' && typeof data.tick.pip_size === 'number') {
                    if (pipSize === null) {
                        pipSize = data.tick.pip_size;
                        setDecimalPlaces(pipSize);
                        
                        if (historyBuffer) {
                            // Process history first
                            for (const historicalTick of historyBuffer) {
                                prependTickToState({ quote: historicalTick.price }, true);
                            }
                            historyBuffer = null;
                        }
                    }
                    prependTickToState(data.tick, false);
                }
            }
        };

        ws.onclose = () => {
            setConnectionStatus('disconnected');
        };
        ws.onerror = (error) => {
            setConnectionStatus('disconnected');
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
          <span className="font-semibold text-muted-foreground">EMPORER MIGOSI</span>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Tabs defaultValue="scanner" className="w-full max-w-7xl mx-auto">
            <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="scanner">Scanner</TabsTrigger>
                <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
                <TabsTrigger value="frequency">Frequency</TabsTrigger>
                <TabsTrigger value="insight">Insight</TabsTrigger>
                <TabsTrigger value="correlation">Correlation</TabsTrigger>
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
            
            <TabsContent value="correlation">
                <CorrelationView
                    currentTps={currentTps}
                    historicalTps={historicalTps}
                    highVolatilityDigits={highVolatilityDigits}
                    lowVolatilityDigits={lowVolatilityDigits}
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                    tickTimestamps={tickTimestamps}
                    lastDigitTicks={lastDigitTicks}
                />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
