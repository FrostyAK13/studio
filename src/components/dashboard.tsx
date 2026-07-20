'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { AnalyzerView } from './analyzer-view';
import { GlobalScanView } from './global-scan-view';
import { DigitFrequencyView } from './digit-frequency-view';
import { cn } from '@/lib/utils';
import { Radio, Activity, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

type EngineStatus = 'offline' | 'active';

export function Dashboard() {
    const [mounted, setMounted] = React.useState(false);
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
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
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

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
                <header className="sticky top-0 z-[100] flex h-16 md:h-20 items-center border-b bg-background/95 backdrop-blur-xl px-2 sm:px-4 shadow-sm transition-all duration-300">
                    <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto gap-2 sm:gap-4">
                        <div className="flex-1 flex items-center justify-start gap-2 sm:gap-4">
                            <div className="flex items-center gap-2">
                                <motion.a 
                                    href="https://frostydbot.site"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    animate={{ 
                                        y: [0, -2, 0],
                                        textShadow: [
                                            "0 0 10px rgba(14,165,233,0.1)",
                                            "0 0 20px rgba(14,165,233,0.3)",
                                            "0 0 10px rgba(14,165,233,0.1)"
                                        ]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="text-base sm:text-2xl font-black text-[#0EA5E9] uppercase tracking-tighter cursor-pointer hover:opacity-80 transition-all select-none no-underline"
                                >
                                    FROSTYDBOT
                                </motion.a>
                            </div>
                            
                            <div className="flex items-center bg-muted/50 border rounded-full h-8 sm:h-9 px-1 transition-colors">
                                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3">
                                    <Radio className={cn("h-3 w-3", surveillanceStatus === 'active' ? 'text-emerald-500 animate-pulse' : 'text-rose-500')} />
                                    <span className="text-[7px] sm:text-[9px] font-black uppercase text-foreground tracking-[0.2em] hidden xs:inline">{surveillanceStatus === 'active' ? 'STREAMING' : 'OFFLINE'}</span>
                                    <span className="text-[7px] font-black uppercase text-foreground tracking-[0.2em] xs:hidden">{surveillanceStatus === 'active' ? 'STRM' : 'OFF'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-6">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-9 w-9 sm:h-10 sm:w-10 text-primary hover:bg-primary/5">
                                {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5" />}
                            </Button>
                        </div>
                    </div>
                </header>

                <nav className="bg-card border-b sticky top-16 md:top-20 z-50 transition-colors duration-300">
                    <div className="max-w-[1600px] mx-auto w-full">
                        <Tabs defaultValue="analyzer" className="w-full">
                            <TabsList className="flex items-center justify-start md:justify-center gap-0 bg-transparent h-12 p-0 overflow-x-auto no-scrollbar w-full border-none">
                                {['analyzer', 'last-digit-analysis', 'frequency', 'global-scan'].map((tab) => (
                                    <TabsTrigger 
                                        key={tab} 
                                        value={tab} 
                                        className="flex-shrink-0 h-full px-4 sm:px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        {tab.toUpperCase().replace(/-/g, ' ')}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            
                            <main className="flex-1 flex flex-col w-full relative p-2 sm:p-6 min-h-[calc(100vh-128px)] bg-background">
                                <TabsContent value="analyzer" className="mt-0 outline-none animate-in fade-in duration-500">
                                    <AnalyzerView />
                                </TabsContent>
                                <TabsContent value="last-digit-analysis" className="mt-0 outline-none animate-in fade-in duration-500">
                                    <ScannerView price={Number(price) || 0} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                                </TabsContent>
                                <TabsContent value="frequency" className="mt-0 outline-none animate-in fade-in duration-500">
                                    <DigitFrequencyView price={Number(price) || 0} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                                </TabsContent>
                                <TabsContent value="global-scan" className="mt-0 outline-none animate-in fade-in duration-500">
                                    <GlobalScanView />
                                </TabsContent>
                            </main>
                        </Tabs>
                    </div>
                </nav>
            </div>
        </div>
    );
}
