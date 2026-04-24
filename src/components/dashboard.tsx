'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { AnalyzerView } from './analyzer-view';
import { syntheticIndices } from '@/lib/mock-data';
import { DigitFrequencyView } from './digit-frequency-view';
import { InsightView } from './insight-view';
import { GlobalMarketScanner } from './global-market-scanner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCw, Radio, Activity, Moon, Sun, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

type EngineStatus = 'offline' | 'active';

export function Dashboard() {
    const [mounted, setMounted] = React.useState(false);
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const [price, setPrice] = React.useState(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [priceHistory, setPriceHistory] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000); 
    const [selectedMarket, setSelectedMarket] = React.useState('1HZ10V');
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);
    
    const [surveillanceStatus, setSurveillanceStatus] = React.useState<EngineStatus>('offline');
    const [wsInstance, setWsInstance] = React.useState<WebSocket | null>(null);

    const currentMarketRef = React.useRef(selectedMarket);
    const pipSizeRef = React.useRef<number | null>(null);

    // Initial load from Session/Local Storage
    React.useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

        const savedMarket = localStorage.getItem('selectedMarket');
        if (savedMarket) setSelectedMarket(savedMarket);

        const savedTicks = localStorage.getItem('maxTicks');
        if (savedTicks) setMaxTicks(parseInt(savedTicks, 10));
    }, []);

    // Theme Persistence
    React.useEffect(() => {
        if (!mounted) return;
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme, mounted]);

    // Market & Ticks Persistence
    React.useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('selectedMarket', selectedMarket);
        localStorage.setItem('maxTicks', maxTicks.toString());
        currentMarketRef.current = selectedMarket;
    }, [selectedMarket, maxTicks, mounted]);

    React.useEffect(() => {
        if (!mounted) return;

        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');
        setWsInstance(ws);

        let historyBuffer: {time: number, price: number}[] | null = null;

        ws.onopen = () => {
            setSurveillanceStatus('active');
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
            const msgMarket = data.echo_req?.ticks_history || data.tick?.symbol;
            if (msgMarket && msgMarket !== currentMarketRef.current) return;

            if (data.error) return;

            if (data.msg_type === 'history') {
                if (data.history && data.history.times && data.history.prices) {
                    historyBuffer = data.history.prices.map((p: number, index: number) => ({
                        price: p,
                        time: data.history.times[index] * 1000 
                    })).reverse();
                    
                    const currentPipSize = pipSizeRef.current;
                    if (currentPipSize !== null && historyBuffer) {
                        const digits = historyBuffer.map(h => {
                            const pStr = h.price.toFixed(8);
                            const decPart = pStr.split('.')[1] || '00000000';
                            return parseInt(decPart[currentPipSize - 1] || '0');
                        });
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
                if (data.tick && typeof data.tick.quote === 'number') {
                    if (data.tick.pip_size !== undefined) {
                        pipSizeRef.current = data.tick.pip_size;
                        setDecimalPlaces(data.tick.pip_size);
                    }

                    const activePipSize = pipSizeRef.current ?? 2;

                    if (historyBuffer) {
                        const digits = historyBuffer.map(h => {
                            const pStr = h.price.toFixed(8);
                            const decPart = pStr.split('.')[1] || '00000000';
                            return parseInt(decPart[activePipSize - 1] || '0');
                        });
                        const prices = historyBuffer.map(h => h.price);
                        const times = historyBuffer.map(h => h.time);
                        setLastDigitTicks(digits);
                        setPriceHistory(prices);
                        setTickTimestamps(times);
                        setPrice(prices[0]);
                        historyBuffer = null;
                    }

                    const newPrice = data.tick.quote;
                    const fullPriceStr = newPrice.toFixed(8);
                    const decimalsStr = fullPriceStr.split('.')[1] || '00000000';
                    const newDigit = parseInt(decimalsStr[activePipSize - 1] || '0');

                    setTickTimestamps(prev => [Date.now(), ...prev].slice(0, 2000));
                    setPrice(newPrice);
                    setLastDigitTicks(prev => [newDigit, ...prev].slice(0, 2000));
                    setPriceHistory(prev => [newPrice, ...prev].slice(0, 2000));
                }
            }
        };

        ws.onclose = () => { setSurveillanceStatus('offline'); };
        ws.onerror = () => { setSurveillanceStatus('offline'); };

        return () => { if(ws && ws.readyState === WebSocket.OPEN) ws.close(); };
    }, [mounted]);

    React.useEffect(() => {
        if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
        pipSizeRef.current = null;
        setDecimalPlaces(2);
        setLastDigitTicks([]);
        setPriceHistory([]);
        setTickTimestamps([]);
        wsInstance.send(JSON.stringify({ "forget_all": "ticks" }));
        wsInstance.send(JSON.stringify({ "ticks_history": selectedMarket, "count": 1000, "end": "latest", "style": "ticks", "subscribe": 1 }));
    }, [selectedMarket, wsInstance]);

    const handleMaxTicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
        if (!isNaN(val)) setMaxTicks(val > 2000 ? 2000 : val);
    };

    const handleMaxTicksBlur = () => { if (maxTicks < 1) setMaxTicks(1); };

    if (!mounted) return <div className="flex min-h-screen items-center justify-center bg-background"><Activity className="h-4 w-4 animate-spin text-primary" /></div>;

    const analyzedDigits = lastDigitTicks.slice(0, maxTicks);
    const analyzedPrices = priceHistory.slice(0, maxTicks);

    return (
        <div className="flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden transition-colors duration-500">
            <header className="sticky top-0 z-[100] flex h-[4.5rem] items-center border-b bg-background/95 backdrop-blur-xl px-4 shadow-sm">
                <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-3 shrink-0">
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.reload()} 
                            className="h-10 w-10 rounded-full border-border bg-card hover:bg-muted flex items-center justify-center shadow-lg group active:scale-90 transition-all duration-300 overflow-hidden"
                        >
                            <motion.div
                                whileHover={{ rotate: 360, scale: 1.2 }}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                                <RefreshCw className="h-5 w-5 text-foreground" />
                            </motion.div>
                        </Button>
                        <div className="relative group">
                            <motion.div 
                                className="absolute -inset-1 bg-gradient-to-r from-primary via-cyan-500 to-primary rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000"
                                animate={{ opacity: [0.4, 0.8, 0.4] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                            <a 
                                href="https://frostytraders.com" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="relative flex items-center gap-2 bg-card px-6 py-2.5 rounded-full border border-border shadow-xl hover:bg-muted transition-all active:scale-95"
                            >
                                <span className="text-[10px] font-black text-foreground uppercase tracking-[0.4em]">FROSTY TRADERS</span>
                                <ExternalLink className="h-3 w-3 text-primary" />
                            </a>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="flex items-center bg-card border border-border rounded-full shadow-2xl h-10 px-1 overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-2 border-r border-border">
                                <div className={cn("h-2.5 w-2.5 rounded-full animate-pulse transition-all duration-500", surveillanceStatus === 'active' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)]")} />
                                <span className="text-[10px] font-black text-foreground uppercase tracking-[0.3em]">SURVEILLANCE</span>
                            </div>
                            <div className="flex items-center gap-2 px-5 py-2 bg-muted/30">
                                <Radio className={cn("h-3.5 w-3.5 transition-all duration-500", surveillanceStatus === 'active' ? 'text-emerald-500 animate-pulse' : 'text-rose-500')} />
                                <span className="text-[10px] font-black uppercase text-foreground tracking-[0.2em]">{surveillanceStatus === 'active' ? 'LIVE' : 'OFFLINE'}</span>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                            className="h-10 w-10 rounded-full border border-border bg-card shadow-xl hover:bg-muted text-foreground transition-all active:scale-95"
                        >
                            <motion.div
                                initial={false}
                                animate={{ rotate: theme === 'light' ? 0 : 180 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                            </motion.div>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative p-2 sm:p-4">
                <Tabs defaultValue="analyzer" className="w-full">
                    <TabsList className="flex items-center justify-start md:justify-center gap-2 bg-transparent h-auto p-0 mb-6 overflow-x-auto no-scrollbar w-full pb-2">
                        {['analyzer', 'global-scan', 'last-digit-analysis', 'frequency', 'insight'].map((tab) => (
                            <TabsTrigger 
                                key={tab} 
                                value={tab} 
                                className="flex-shrink-0 px-5 py-2.5 rounded-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm hover:bg-muted/50"
                            >
                                {tab.toUpperCase().replace(/-/g, ' ')}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="analyzer" className="mt-0 outline-none animate-in fade-in duration-500">
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
                    <TabsContent value="global-scan" className="mt-0 outline-none animate-in fade-in duration-500">
                        <GlobalMarketScanner 
                            onMarketSelect={setSelectedMarket} 
                            selectedMarket={selectedMarket}
                            lastDigitTicks={analyzedDigits} 
                            price={price} 
                            decimalPlaces={decimalPlaces} 
                        />
                    </TabsContent>
                    <TabsContent value="last-digit-analysis" className="mt-0 outline-none animate-in fade-in duration-500">
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
                    <TabsContent value="frequency" className="mt-0 outline-none animate-in fade-in duration-500">
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
                    <TabsContent value="insight" className="mt-0 outline-none animate-in fade-in duration-500">
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
                </Tabs>
            </main>
        </div>
    );
}