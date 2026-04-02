'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { AnalyzerView } from './analyzer-view';
import { syntheticIndices } from '@/lib/mock-data';
import { DigitFrequencyView } from './digit-frequency-view';
import { InsightView } from './insight-view';
import { CorrelationView } from './correlation-view';
import { GlobalMarketScanner } from './global-market-scanner';
import { cn } from '@/lib/utils';

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

    React.useEffect(() => {
        setPrice(0);
        setLastDigitTicks([]);
        setPriceHistory([]);
        setTickTimestamps([]);
        setConnectionStatus('connecting');

        // Using app_id 1089 for stable production access
        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=1089');

        let pipSize: number | null = null;
        let historyBuffer: {time: number, price: number}[] | null = null;

        const prependTickToState = (tick: { quote: number, time?: number }) => {
            const newPrice = tick.quote;
            const currentPipSize = pipSize !== null ? pipSize : 2;
            const priceString = newPrice.toFixed(currentPipSize);
            const newDigit = parseInt(priceString.slice(-1));

            setTickTimestamps(prev => [Date.now(), ...prev].slice(0, 2000));
            setPrice(newPrice);
            setLastDigitTicks(prevTicks => [newDigit, ...prevTicks].slice(0, 2000));
            setPriceHistory(prevPrices => [newPrice, ...prevPrices].slice(0, 2000));
        };

        ws.onopen = () => {
            ws.send(JSON.stringify({ 
                "ticks_history": selectedMarket, 
                "count": 500, // Reduced count for stability
                "end": "latest", 
                "style": "ticks", 
                "subscribe": 1 
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                // Centralized error handling without console.error to avoid UI error screens
                setConnectionStatus('disconnected');
                return;
            }

            if (data.msg_type === 'history') {
                if (data.history && data.history.times && data.history.prices) {
                    historyBuffer = data.history.prices.map((price: number, index: number) => ({
                        price: price,
                        time: data.history.times[index] * 1000 
                    })).reverse();
                    
                    if (pipSize !== null && historyBuffer) {
                        const digits = historyBuffer.map(h => parseInt(h.price.toFixed(pipSize!).slice(-1)));
                        const prices = historyBuffer.map(h => h.price);
                        const times = historyBuffer.map(h => h.time);
                        setLastDigitTicks(digits);
                        setPriceHistory(prices);
                        setTickTimestamps(times);
                        setPrice(prices[0]);
                        historyBuffer = null;
                    }
                }
            }

            if (data.msg_type === 'tick') {
                setConnectionStatus('streaming');
                if (data.tick && typeof data.tick.quote === 'number') {
                    if (pipSize === null) {
                        pipSize = data.tick.pip_size ?? 2;
                        setDecimalPlaces(pipSize);
                        
                        if (historyBuffer) {
                            const digits = historyBuffer.map(h => parseInt(h.price.toFixed(pipSize!).slice(-1)));
                            const prices = historyBuffer.map(h => h.price);
                            const times = historyBuffer.map(h => h.time);
                            
                            setLastDigitTicks(digits);
                            setPriceHistory(prices);
                            setTickTimestamps(times);
                            setPrice(prices[0]);
                            
                            historyBuffer = null;
                        }
                    }
                    prependTickToState(data.tick);
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
    }, [selectedMarket]);

    const handleMaxTicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '') {
            setMaxTicks(0);
            return;
        }
        let numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            if (numValue > 2000) numValue = 2000;
            setMaxTicks(numValue);
        }
    };

    const handleMaxTicksBlur = () => {
        if (maxTicks < 1) setMaxTicks(1);
    };

    const analyzedDigits = lastDigitTicks.slice(0, maxTicks);
    const analyzedPrices = priceHistory.slice(0, maxTicks);

    const statusColors = {
        streaming: 'text-emerald-400',
        connecting: 'text-amber-400',
        disconnected: 'text-rose-500'
    };

    const statusBg = {
        streaming: 'bg-emerald-400',
        connecting: 'bg-amber-400',
        disconnected: 'bg-rose-500'
    };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden">
      <header className="sticky top-0 z-[60] flex h-auto min-h-[4rem] flex-col md:flex-row items-center border-b bg-background/80 px-4 py-2 md:py-0 md:px-6 backdrop-blur-xl transition-all duration-300">
        <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto gap-2 md:gap-4">
          
          <div className="flex-1 hidden md:block" />

          <div className="flex flex-1 justify-center w-full md:w-auto mt-0">
            <a 
              href="https://frostytraders.com"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group transition-all duration-300 hover:scale-105 active:scale-95"
            >
                <div className={cn(
                    "absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000",
                    statusBg[connectionStatus]
                )}></div>
                <div className="relative flex items-center gap-3 px-4 md:px-8 py-2 md:py-3 bg-card border border-white/5 rounded-full shadow-2xl">
                    <div className="relative flex items-center justify-center">
                        <div className={cn("h-2 w-2 md:h-2.5 md:w-2.5 rounded-full transition-all duration-500", statusBg[connectionStatus])} />
                        {connectionStatus === 'streaming' && (
                            <div className={cn("absolute h-2 w-2 md:h-2.5 md:w-2.5 rounded-full animate-ping opacity-75", statusBg[connectionStatus])} />
                        )}
                    </div>
                    <span className={cn(
                        "text-[9px] sm:text-[11px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.4em] whitespace-nowrap transition-colors duration-500",
                        statusColors[connectionStatus]
                    )}>
                        FROSTY HOLDINGS
                    </span>
                </div>
            </a>
          </div>

          <div className="flex-1 hidden md:block" />
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative">
        <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8">
            <Tabs defaultValue="global-scan" className="w-full">
                <TabsList className="flex items-center justify-start md:justify-center gap-1.5 md:gap-2 bg-transparent h-auto p-0 mb-4 md:mb-10 overflow-x-auto no-scrollbar pb-2 w-full">
                    {['global-scan', 'scanner', 'analyzer', 'frequency', 'insight', 'circles'].map((tab) => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab}
                            className="flex-shrink-0 px-3 sm:px-6 md:px-8 py-2 md:py-3 rounded-full border border-transparent data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.15)] text-muted-foreground font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 hover:text-foreground hover:bg-muted/50"
                        >
                            {tab === 'global-scan' ? 'GLOBAL SCAN' : tab.toUpperCase()}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="global-scan" className="mt-0 animate-in fade-in zoom-in-95 duration-500 outline-none">
                    <GlobalMarketScanner 
                        onMarketSelect={setSelectedMarket} 
                        lastDigitTicks={analyzedDigits} 
                        price={price}
                        decimalPlaces={decimalPlaces}
                    />
                </TabsContent>

                <TabsContent value="scanner" className="mt-0 animate-in fade-in zoom-in-95 duration-500 outline-none">
                    <ScannerView 
                        price={price} 
                        lastDigitTicks={analyzedDigits}
                        priceHistory={analyzedPrices}
                        maxTicks={maxTicks}
                        handleMaxTicksChange={handleMaxTicksChange}
                        handleMaxTicksBlur={handleMaxTicksBlur}
                        selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket}
                        decimalPlaces={decimalPlaces}
                    />
                </TabsContent>

                <TabsContent value="analyzer" className="mt-0 animate-in fade-in zoom-in-95 duration-500 outline-none">
                    <AnalyzerView
                        price={price}
                        lastDigitTicks={analyzedDigits}
                        priceHistory={analyzedPrices}
                        maxTicks={maxTicks}
                        handleMaxTicksChange={handleMaxTicksChange}
                        handleMaxTicksBlur={handleMaxTicksBlur}
                        selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket}
                        decimalPlaces={decimalPlaces}
                        tickTimestamps={tickTimestamps}
                    />
                </TabsContent>

                <TabsContent value="frequency" className="mt-0 animate-in fade-in zoom-in-95 duration-500 outline-none">
                    <DigitFrequencyView
                        price={price}
                        lastDigitTicks={analyzedDigits}
                        priceHistory={analyzedPrices}
                        maxTicks={maxTicks}
                        handleMaxTicksChange={handleMaxTicksChange}
                        handleMaxTicksBlur={handleMaxTicksBlur}
                        selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket}
                        decimalPlaces={decimalPlaces}
                    />
                </TabsContent>

                <TabsContent value="insight" className="mt-0 animate-in fade-in zoom-in-95 duration-500 outline-none">
                    <InsightView
                        price={price}
                        decimalPlaces={decimalPlaces}
                        lastDigitTicks={analyzedDigits}
                        priceHistory={analyzedPrices}
                        selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket}
                        maxTicks={maxTicks}
                    />
                </TabsContent>
                
                <TabsContent value="circles" className="mt-0 animate-in fade-in zoom-in-95 duration-500 outline-none">
                    <CorrelationView
                        selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket}
                        lastDigitTicks={analyzedDigits}
                        price={price}
                        decimalPlaces={decimalPlaces}
                    />
                </TabsContent>
            </Tabs>
        </div>
      </main>
    </div>
  );
}
