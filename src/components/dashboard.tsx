'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerView } from './scanner-view';
import { AnalyzerView } from './analyzer-view';
import { syntheticIndices } from '@/lib/mock-data';
import { DigitFrequencyView } from './digit-frequency-view';
import { InsightView } from './insight-view';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCw, Radio, Activity, Moon, Sun, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LockScreen } from './lock-screen';

type EngineStatus = 'offline' | 'active';

export interface GlobalAnalysisResult {
    marketId: string;
    marketName: string;
    ci: number;
    ss: number;
    flowScore: number;
    tradeType: 'FLOW' | 'NO TRADE';
    triggerDigit: number | null; 
    targetDigit: number | null; 
    confidence: number;
    currentPrice: number;
    pip: number;
    scannerStrategy: 'OVER 3' | 'UNDER 6' | 'NONE';
    scannerEntry: number | null;
    scannerConfidence: number;
}

export function Dashboard() {
    const [mounted, setMounted] = React.useState(false);
    const [isLocked, setIsLocked] = React.useState(true);
    const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
    const [price, setPrice] = React.useState(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [priceHistory, setPriceHistory] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000); 
    const [selectedMarket, setSelectedMarket] = React.useState('1HZ10V');
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);
    
    const [surveillanceStatus, setSurveillanceStatus] = React.useState<EngineStatus>('offline');
    const [globalResults, setGlobalResults] = React.useState<Record<string, GlobalAnalysisResult>>({});
    const [activeScanId, setActiveScanId] = React.useState<string | null>(null);

    const currentMarketRef = React.useRef(selectedMarket);
    const pipSizeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        setMounted(true);
        const authState = localStorage.getItem('frosty_auth');
        if (authState === 'true') setIsLocked(false);
        
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);
    }, []);

    const handleUnlock = () => {
        setIsLocked(false);
        localStorage.setItem('frosty_auth', 'true');
    };

    React.useEffect(() => {
        if (!mounted) return;
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme, mounted]);

    // Global Surveillance Engine
    React.useEffect(() => {
        if (!mounted || isLocked) return;

        const scanWs = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');
        let currentIndex = 0;

        const runGlobalScan = () => {
            if (currentIndex >= syntheticIndices.length) {
                currentIndex = 0;
                setTimeout(runGlobalScan, 2000); 
                return;
            }

            const market = syntheticIndices[currentIndex];
            setActiveScanId(market.id);
            if (scanWs.readyState === WebSocket.OPEN) {
                scanWs.send(JSON.stringify({
                    "ticks_history": market.id,
                    "count": 1000, 
                    "end": "latest",
                    "style": "ticks"
                }));
            }
        };

        scanWs.onopen = () => runGlobalScan();

        scanWs.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.msg_type === 'history' && data.history) {
                const prices = data.history.prices;
                const latestPrice = prices[prices.length - 1];
                const marketId = data.echo_req.ticks_history;
                const marketName = syntheticIndices.find(m => m.id === marketId)?.name || marketId;
                const pip = data.echo_req.pip_size || 2;

                const ticks = prices.map((p: number) => {
                    const pStr = p.toFixed(8);
                    const dec = pStr.split('.')[1] || '00';
                    return parseInt(dec[pip - 1] || '0');
                }).reverse();

                const total = ticks.length || 1;
                const counts = Array(10).fill(0);
                ticks.forEach(d => counts[d]++);
                const P = counts.map(c => (c / total) * 100);
                const D = P.map(p => p - 10); 

                const variance = P.reduce((sum, p) => sum + Math.pow(p - 10, 2), 0) / 10;
                const stdDev = Math.sqrt(variance);
                const SS = Math.max(0, 1 - (stdDev / 10));
                const CI = D.reduce((sum, d) => sum + Math.pow(d, 2), 0);

                const entryCandidates = [0,1,2,3,4,5,6,7,8,9].filter(i => D[i] >= -1.0 && D[i] <= -0.2);
                const targetCandidates = [0,1,2,3,4,5,6,7,8,9].map(i => {
                    const prevIdx = (i + 9) % 10;
                    const nextIdx = (i + 1) % 10;
                    const ld = D[i] - (D[prevIdx] + D[nextIdx]) / 2;
                    return { i, ld, d: D[i] };
                }).filter(t => t.d > 0.3 && t.ld > 0);

                let bestE: number | null = null;
                let bestT: number | null = null;
                let bestFlowScore = -1000;
                let finalConfidence = 0;

                if (entryCandidates.length > 0 && targetCandidates.length > 0) {
                    entryCandidates.forEach(e => {
                        targetCandidates.forEach(t => {
                            if (e === t.i) return;
                            const score = Math.abs(t.d) - Math.abs(D[e]);
                            if (score > bestFlowScore) {
                                bestFlowScore = score;
                                bestE = e;
                                bestT = t.i;
                            }
                        });
                    });
                    if (bestE !== null && bestT !== null) {
                        finalConfidence = Math.min(99.9, 65 + (bestFlowScore * 12) + (SS * 15));
                    }
                }

                let S_U6 = 0; for (let i = 0; i <= 5; i++) S_U6 += D[i];
                let S_O3 = 0; for (let i = 4; i <= 9; i++) S_O3 += D[i];
                const scannerDirection = S_U6 > S_O3 ? 'UNDER 6' : 'OVER 3';
                const bestScanner = P.map((p, i) => ({ i, p })).sort((a, b) => b.p - a.p)[0];

                setGlobalResults(prev => ({
                    ...prev,
                    [marketId]: {
                        marketId, marketName, ci: CI, ss: SS, flowScore: bestFlowScore,
                        tradeType: bestE !== null ? 'FLOW' : 'NO TRADE',
                        triggerDigit: bestE, targetDigit: bestT, confidence: finalConfidence,
                        currentPrice: latestPrice, pip: pip, scannerStrategy: scannerDirection,
                        scannerEntry: bestScanner?.i ?? null, scannerConfidence: 60 + Math.max(S_U6, S_O3)
                    }
                }));

                currentIndex++;
                setTimeout(runGlobalScan, 200);
            }
        };

        return () => scanWs.close();
    }, [mounted, isLocked]);

    // Active Market Feed
    React.useEffect(() => {
        if (!mounted || isLocked) return;

        currentMarketRef.current = selectedMarket;
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');

        ws.onopen = () => {
            setSurveillanceStatus('active');
            // Request history first to fix percentage distribution
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

            if (data.msg_type === 'history' && data.history) {
                const prices = data.history.prices;
                const activePipSize = data.echo_req.pip_size || 2;
                pipSizeRef.current = activePipSize;
                setDecimalPlaces(activePipSize);

                const ticks = prices.map((p: number) => {
                    const pStr = p.toFixed(8);
                    const dec = pStr.split('.')[1] || '00';
                    return parseInt(dec[activePipSize - 1] || '0');
                }).reverse();

                setPrice(prices[prices.length - 1]);
                setLastDigitTicks(ticks);
                setPriceHistory([...prices].reverse());
            }

            if (data.msg_type === 'tick') {
                if (data.tick && typeof data.tick.quote === 'number') {
                    if (data.tick.pip_size !== undefined) {
                        pipSizeRef.current = data.tick.pip_size;
                        setDecimalPlaces(data.tick.pip_size);
                    }
                    const activePipSize = pipSizeRef.current ?? 2;
                    const newPrice = data.tick.quote;
                    const fullPriceStr = newPrice.toFixed(8);
                    const decimalsStr = fullPriceStr.split('.')[1] || '00000000';
                    const newDigit = parseInt(decimalsStr[activePipSize - 1] || '0');

                    setTickTimestamps(prev => [Date.now(), ...prev].slice(0, 2000));
                    setPrice(newPrice);
                    setLastDigitTicks(prev => [newDigit, ...prev].slice(0, 1000));
                    setPriceHistory(prev => [newPrice, ...prev].slice(0, 1000));
                }
            }
        };

        ws.onclose = () => setSurveillanceStatus('offline');
        return () => { if(ws && ws.readyState === WebSocket.OPEN) ws.close(); };
    }, [mounted, isLocked, selectedMarket]);

    const handleMaxTicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
        if (!isNaN(val)) setMaxTicks(val > 1000 ? 1000 : val);
    };

    const handleMaxTicksBlur = () => { if (maxTicks < 1) setMaxTicks(1); };

    if (!mounted) return <div className="flex min-h-screen items-center justify-center bg-background"><Activity className="h-4 w-4 animate-spin text-primary" /></div>;

    const analyzedDigits = lastDigitTicks.slice(0, maxTicks);
    const analyzedPrices = priceHistory.slice(0, maxTicks);

    return (
        <div className="flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden transition-colors duration-500">
            <AnimatePresence>
                {isLocked && <LockScreen onUnlock={handleUnlock} />}
            </AnimatePresence>

            <div className={cn("flex flex-col flex-1 transition-all duration-700", isLocked ? "blur-xl scale-95 opacity-50 pointer-events-none" : "blur-0 scale-100 opacity-100")}>
                <header className="sticky top-0 z-[100] flex h-16 md:h-[4.5rem] items-center border-b bg-background/95 backdrop-blur-xl px-4 shadow-sm">
                    <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto">
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <Button variant="outline" onClick={() => window.location.reload()} className="h-8 w-8 md:h-10 md:w-10 rounded-full border-border bg-card hover:bg-muted flex items-center justify-center shadow-lg active:scale-90 transition-all">
                                <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
                            </Button>
                            <div className="relative group">
                                <motion.div className="absolute -inset-1 bg-gradient-to-r from-primary via-cyan-500 to-primary rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                                <a href="https://frostytraders.com" target="_blank" rel="noopener noreferrer" className="relative flex items-center gap-1.5 md:gap-2 bg-card px-3 md:px-6 py-1.5 md:py-2.5 rounded-full border border-border shadow-xl hover:bg-muted transition-all active:scale-95">
                                    <span className="text-[8px] md:text-[10px] font-black text-foreground uppercase tracking-[0.2em] md:tracking-[0.4em] whitespace-nowrap">FROSTY TRADERS</span>
                                    <ExternalLink className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary" />
                                </a>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                            <div className="flex items-center bg-card border border-border rounded-full shadow-2xl h-8 md:h-10 px-0.5 md:px-1 overflow-hidden">
                                <div className="flex items-center gap-1.5 md:gap-3 px-2 md:px-5 py-1 md:py-2 border-r border-border">
                                    <div className={cn("h-2 w-2 md:h-2.5 md:w-2.5 rounded-full animate-pulse", surveillanceStatus === 'active' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)]")} />
                                    <span className="text-[7px] md:text-[10px] font-black text-foreground uppercase tracking-[0.2em] md:tracking-[0.3em] hidden sm:inline">LIVE</span>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2 px-2 md:px-5 py-1 md:py-2 bg-muted/30">
                                    <Radio className={cn("h-3 w-3 md:h-3.5 md:w-3.5 transition-all", surveillanceStatus === 'active' ? 'text-emerald-500 animate-pulse' : 'text-rose-500')} />
                                    <span className="text-[7px] md:text-[10px] font-black uppercase text-foreground tracking-[0.1em] md:tracking-[0.2em]">{surveillanceStatus === 'active' ? 'LIVE' : 'OFFLINE'}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-border bg-card shadow-xl hover:bg-muted text-foreground transition-all">
                                {theme === 'light' ? <Moon className="h-4 w-4 md:h-5 md:w-5" /> : <Sun className="h-4 w-4 md:h-5 md:w-5" />}
                            </Button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative p-2 sm:p-4">
                    <Tabs defaultValue="analyzer" className="w-full">
                        <TabsList className="flex items-center justify-start md:justify-center gap-1.5 md:gap-2 bg-transparent h-auto p-0 mb-4 md:mb-6 overflow-x-auto no-scrollbar w-full pb-2">
                            {['analyzer', 'last-digit-analysis', 'frequency', 'global-scan', 'insight'].map((tab) => (
                                <TabsTrigger key={tab} value={tab} className="flex-shrink-0 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all shadow-sm hover:bg-muted/50">
                                    {tab.toUpperCase().replace(/-/g, ' ')}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <TabsContent value="analyzer" className="mt-0 outline-none animate-in fade-in duration-500">
                            <AnalyzerView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} tickTimestamps={tickTimestamps} />
                        </TabsContent>
                        <TabsContent value="last-digit-analysis" className="mt-0 outline-none animate-in fade-in duration-500">
                            <ScannerView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                        </TabsContent>
                        <TabsContent value="frequency" className="mt-0 outline-none animate-in fade-in duration-500">
                            <DigitFrequencyView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                        </TabsContent>
                        <TabsContent value="global-scan" className="mt-0 outline-none animate-in fade-in duration-500">
                            <ScannerView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                        </TabsContent>
                        <TabsContent value="insight" className="mt-0 outline-none animate-in fade-in duration-500">
                            <InsightView globalResults={globalResults} activeScanId={activeScanId} dashboardPrice={price} dashboardMarketId={selectedMarket} />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
}
