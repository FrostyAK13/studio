'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { AnalyzerView } from './analyzer-view';
import { syntheticIndices } from '@/lib/mock-data';
import { DigitFrequencyView } from './digit-frequency-view';
import { cn } from '@/lib/utils';
import { Radio, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

type EngineStatus = 'offline' | 'active';

export function Dashboard() {
    const [mounted, setMounted] = React.useState(false);
    const [price, setPrice] = React.useState<number>(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [priceHistory, setPriceHistory] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000); 
    const [selectedMarket, setSelectedMarket] = React.useState('1HZ10V');
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);
    
    const [surveillanceStatus, setSurveillanceStatus] = React.useState<EngineStatus>('offline');

    const currentMarketRef = React.useRef(selectedMarket);
    const pipSizeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Active Market Feed
    React.useEffect(() => {
        if (!mounted) return;

        setLastDigitTicks([]);
        setPriceHistory([]);
        
        currentMarketRef.current = selectedMarket;
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');
        
        ws.onopen = () => {
            setSurveillanceStatus('active');
            
            ws.send(JSON.stringify({
                "ticks_history": selectedMarket,
                "count": 1000,
                "end": "latest",
                "style": "ticks",
                "subscribe": 1
            }));
            
            ws.send(JSON.stringify({ "ticks": selectedMarket, "subscribe": 1 }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.error) return;

            if (data.msg_type === 'history' && data.history) {
                if (data.history.prices) {
                    const activePipSize = data.echo_req.pip_size || 2;
                    pipSizeRef.current = activePipSize;
                    setDecimalPlaces(activePipSize);
                    
                    const prices = (data.history.prices || []).map((p: any) => Number(p));
                    const ticks = prices.map((p: number) => {
                        const pStr = p.toFixed(8);
                        const dec = pStr.split('.')[1] || '00000000';
                        return parseInt(dec[activePipSize - 1] || '0');
                    }).reverse();
                    
                    setLastDigitTicks(ticks.slice(0, 1000));
                    setPriceHistory(prices.reverse().slice(0, 1000));
                    if (prices.length > 0) setPrice(prices[0]);
                }
            }

            if (data.msg_type === 'tick') {
                if (data.tick && data.tick.symbol === currentMarketRef.current) {
                    if (data.tick.pip_size !== undefined) {
                        pipSizeRef.current = data.tick.pip_size;
                        setDecimalPlaces(data.tick.pip_size);
                    }
                    const activePipSize = pipSizeRef.current ?? 2;
                    const newPrice = Number(data.tick.quote);
                    const fullPriceStr = newPrice.toFixed(8);
                    const decimalsStr = fullPriceStr.split('.')[1] || '00000000';
                    const newDigit = parseInt(decimalsStr[activePipSize - 1] || '0');
                    const epochMs = Number(data.tick.epoch) * 1000;

                    setTickTimestamps(prev => [epochMs, ...prev].slice(0, 1000));
                    setLastDigitTicks(prev => [newDigit, ...prev].slice(0, 1000));
                    setPriceHistory(prev => [newPrice, ...prev].slice(0, 1000));
                    setPrice(newPrice);
                }
            }
        };

        ws.onclose = () => setSurveillanceStatus('offline');
        return () => { if(ws && ws.readyState === WebSocket.OPEN) ws.close(); };
    }, [mounted, selectedMarket]);

    const handleMaxTicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
        if (!isNaN(val)) setMaxTicks(val > 1000 ? 1000 : val);
    };

    const handleMaxTicksBlur = () => { if (maxTicks < 1) setMaxTicks(1); };

    if (!mounted) return <div className="flex min-h-screen items-center justify-center bg-background"><Activity className="h-4 w-4 animate-spin text-primary" /></div>;

    const analyzedDigits = lastDigitTicks.slice(0, maxTicks);
    const analyzedPrices = priceHistory.slice(0, maxTicks);

    return (
        <div className="flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden">
            <div className="flex flex-col flex-1">
                <header className="sticky top-0 z-[100] flex h-16 md:h-[4.5rem] items-center border-b bg-background/95 backdrop-blur-xl px-4 shadow-sm">
                    <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto">
                        <div className="flex-1 flex items-center justify-start">
                            <div className="flex items-center bg-card border rounded-full shadow-sm h-10 px-1">
                                <div className="flex items-center gap-3 px-4 py-2 border-r">
                                    <div className={cn("h-2 w-2 rounded-full animate-pulse", surveillanceStatus === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500")} />
                                    <span className="text-[9px] font-black text-foreground uppercase tracking-widest hidden sm:inline">LIVE</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <Radio className={cn("h-3.5 w-3.5", surveillanceStatus === 'active' ? 'text-emerald-500 animate-pulse' : 'text-rose-500')} />
                                    <span className="text-[9px] font-black uppercase text-foreground tracking-widest">{surveillanceStatus === 'active' ? 'STREAMING' : 'OFFLINE'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex justify-center">
                            <motion.h1 
                                animate={{ 
                                    y: [0, -4, 0],
                                    filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
                                    textShadow: [
                                        "0 0 10px rgba(197,160,89,0.2)",
                                        "0 0 25px rgba(197,160,89,0.6)",
                                        "0 0 10px rgba(197,160,89,0.2)"
                                    ]
                                }}
                                transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="text-xl md:text-2xl font-black text-[#C5A059] uppercase tracking-[0.4em] whitespace-nowrap drop-shadow-md cursor-default select-none"
                            >
                                FROSTYDBOT
                            </motion.h1>
                        </div>

                        <div className="flex-1" />
                    </div>
                </header>
                <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative p-2 sm:p-4">
                    <Tabs defaultValue="analyzer" className="w-full">
                        <TabsList className="flex items-center justify-start md:justify-center gap-2 bg-transparent h-auto p-0 mb-6 overflow-x-auto no-scrollbar w-full">
                            {['analyzer', 'last-digit-analysis', 'frequency', 'global-scan'].map((tab) => (
                                <TabsTrigger key={tab} value={tab} className="flex-shrink-0 px-4 py-2.5 rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black text-[9px] uppercase tracking-widest shadow-sm">
                                    {tab.toUpperCase().replace(/-/g, ' ')}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <TabsContent value="analyzer" className="mt-0 outline-none animate-in fade-in duration-500">
                            <AnalyzerView price={Number(price) || 0} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} tickTimestamps={tickTimestamps} />
                        </TabsContent>
                        <TabsContent value="last-digit-analysis" className="mt-0 outline-none animate-in fade-in duration-500">
                            <ScannerView price={Number(price) || 0} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                        </TabsContent>
                        <TabsContent value="frequency" className="mt-0 outline-none animate-in fade-in duration-500">
                            <DigitFrequencyView price={Number(price) || 0} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                        </TabsContent>
                        <TabsContent value="global-scan" className="mt-0 outline-none animate-in fade-in duration-500">
                            <ScannerView price={Number(price) || 0} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
}