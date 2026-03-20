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
import { BotRunner } from './bot-runner';
import { Button } from './ui/button';
import { Bot, PanelRightClose, PanelRightOpen } from 'lucide-react';

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
    const [isRunnerOpen, setIsRunnerOpen] = React.useState(true);

    React.useEffect(() => {
        setPrice(0);
        setLastDigitTicks([]);
        setPriceHistory([]);
        setTickTimestamps([]);
        setConnectionStatus('connecting');

        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=84799');

        let pipSize: number | null = null;
        let historyBuffer: {time: number, price: number}[] | null = null;

        const prependTickToState = (tick: { quote: number, time?: number }) => {
            const newPrice = tick.quote;
            const currentPipSize = pipSize !== null ? pipSize : 2;
            const priceString = newPrice.toFixed(currentPipSize);
            const newDigit = parseInt(priceString.slice(-1));

            setTickTimestamps(prev => [Date.now(), ...prev].slice(0, 5000));
            setPrice(newPrice);
            setLastDigitTicks(prevTicks => [newDigit, ...prevTicks].slice(0, 5000));
            setPriceHistory(prevPrices => [newPrice, ...prevPrices].slice(0, 5000));
        };

        ws.onopen = () => {
            ws.send(JSON.stringify({ 
                "ticks_history": selectedMarket, 
                "count": 5000, 
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
            if (numValue > 5000) numValue = 5000;
            setMaxTicks(numValue);
        }
    };

    const handleMaxTicksBlur = () => {
        if (maxTicks < 1) setMaxTicks(1);
    };

    const analyzedDigits = lastDigitTicks.slice(0, maxTicks);
    const analyzedPrices = priceHistory.slice(0, maxTicks);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden">
      <header className="sticky top-0 z-[60] flex h-auto min-h-20 flex-col md:flex-row items-center border-b bg-background/80 px-4 py-4 md:py-0 md:px-6 backdrop-blur-xl transition-all duration-300">
        <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto gap-2 md:gap-4">
          
          <div className="flex-1 min-w-0">
            <a
              href="https://frostytraders.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg sm:text-2xl font-black tracking-tighter text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-transform hover:scale-105 block truncate"
            >
              frosty<span className="text-foreground">traders.com</span>
            </a>
          </div>

          <div className="flex flex-1 justify-center order-3 md:order-2 w-full md:w-auto mt-2 md:mt-0">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-cyan-400/20 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center px-4 md:px-6 py-1 md:py-2 bg-card border border-white/5 rounded-full shadow-2xl">
                    <span className="text-[8px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-foreground/70 whitespace-nowrap">
                        EMPORER MIGOSI
                    </span>
                </div>
            </div>
          </div>

          <div className="flex-1 flex justify-end order-2 md:order-3 gap-2 md:gap-4">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsRunnerOpen(!isRunnerOpen)}
                className="rounded-full hover:bg-white/5 text-muted-foreground hover:text-primary transition-all hidden lg:flex"
            >
                {isRunnerOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-full border border-white/5 backdrop-blur-sm shadow-inner">
                <ConnectionStatus status={connectionStatus} />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full relative">
        <div className={cn(
            "flex-1 p-3 sm:p-6 lg:p-8 transition-all duration-500 ease-in-out",
            isRunnerOpen ? "lg:mr-[380px]" : "lg:mr-0"
        )}>
            <Tabs defaultValue="scanner" className="w-full">
                <TabsList className="flex items-center justify-start md:justify-center gap-2 bg-transparent h-auto p-0 mb-6 md:mb-10 overflow-x-auto no-scrollbar pb-2 w-full">
                    {['scanner', 'analyzer', 'frequency', 'insight', 'circles'].map((tab) => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab}
                            className="flex-shrink-0 px-4 sm:px-8 py-2.5 sm:py-3 rounded-full border border-transparent data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.15)] text-muted-foreground font-black text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 hover:text-foreground hover:bg-muted/50"
                        >
                            {tab}
                        </TabsTrigger>
                    ))}
                </TabsList>

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
                    />
                </TabsContent>
            </Tabs>
        </div>

        {/* Persistent/Floating Runner Panel */}
        <aside className={cn(
            "lg:fixed lg:right-0 lg:top-20 lg:bottom-0 transition-all duration-500 ease-in-out z-50",
            "w-full lg:w-[380px]",
            isRunnerOpen ? "lg:translate-x-0" : "lg:translate-x-full",
            !isRunnerOpen && "lg:opacity-0 pointer-events-none"
        )}>
            <BotRunner />
        </aside>

        {/* Mobile Run Toggle FAB */}
        <Button
            onClick={() => setIsRunnerOpen(!isRunnerOpen)}
            className={cn(
                "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-[70] lg:hidden animate-bounce",
                isRunnerOpen ? "bg-rose-500" : "bg-primary"
            )}
        >
            {isRunnerOpen ? <PanelRightClose /> : <Bot />}
        </Button>
      </main>
    </div>
  );
}
