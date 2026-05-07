
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
import { Radio, Activity, Moon, Sun, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LockScreen } from './lock-screen';
import { DerivChart } from './deriv-chart';

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
    const [price, setPrice] = React.useState<number>(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [priceHistory, setPriceHistory] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000); 
    const [selectedMarket, setSelectedMarket] = React.useState('1HZ10V');
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);
    const [chartInterval, setChartInterval] = React.useState('1m');
    const [candleData, setCandleData] = React.useState<any[]>([]);
    
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
                const prices = (data.history.prices || []).map((p: any) => Number(p));
                const latestPrice = prices.length > 0 ? prices[prices.length - 1] : 0;
                const marketId = data.echo_req.ticks_history;
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
                        marketId, marketName: syntheticIndices.find(m => m.id === marketId)?.name || marketId, 
                        ci: CI, ss: SS, flowScore: bestFlowScore,
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
        
        const intervalToGranularity = (int: string) => {
            const map: Record<string, number> = {
                '1t': 0, '1m': 60, '2m': 120, '3m': 180, '5m': 300, 
                '10m': 600, '15m': 900, '30m': 1800, '1h': 3600,
                '2h': 7200, '4h': 14400, '8h': 28800, '1d': 86400
            };
            return map[int] || 60;
        };

        const granularity = intervalToGranularity(chartInterval);

        ws.onopen = () => {
            setSurveillanceStatus('active');
            ws.send(JSON.stringify({
                "ticks_history": selectedMarket,
                "count": 500,
                "end": "latest",
                "style": "candles",
                "granularity": granularity,
                "subscribe": 1
            }));
            // Also subscribe to ticks for digit analysis
            ws.send(JSON.stringify({ "ticks": selectedMarket, "subscribe": 1 }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.error) return;

            if (data.msg_type === 'history' && data.history) {
                const prices = (data.history.prices || []).map((p: any) => Number(p));
                const activePipSize = data.echo_req.pip_size || 2;
                pipSizeRef.current = activePipSize;
                setDecimalPlaces(activePipSize);
            }

            if (data.msg_type === 'candles' && data.candles) {
                const formatted = data.candles.map((c: any) => ({
                    time: Number(c.epoch),
                    open: Number(c.open),
                    high: Number(c.high),
                    low: Number(c.low),
                    close: Number(c.close)
                }));
                setCandleData(formatted);
            }

            if (data.msg_type === 'ohlc' && data.ohlc) {
                const newCandle = {
                    time: Number(data.ohlc.epoch),
                    open: Number(data.ohlc.open),
                    high: Number(data.ohlc.high),
                    low: Number(data.ohlc.low),
                    close: Number(data.ohlc.close)
                };
                setCandleData(prev => {
                    const filtered = prev.filter(c => c.time !== newCandle.time);
                    return [...filtered, newCandle].sort((a, b) => a.time - b.time).slice(-500);
                });
                setPrice(Number(data.ohlc.close) || 0);
            }

            if (data.msg_type === 'tick') {
                if (data.tick && typeof data.tick.quote === 'number') {
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
                    setPrice(newPrice);
                    setLastDigitTicks(prev => [newDigit, ...prev].slice(0, 1000));
                }
            }
        };

        ws.onclose = () => setSurveillanceStatus('offline');
        return () => { if(ws && ws.readyState === WebSocket.OPEN) ws.close(); };
    }, [mounted, isLocked, selectedMarket, chartInterval]);

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
                    <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto gap-4">
                        <div className="flex items-center gap-4 shrink-0">
                            <a href="https://frostytraders.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm font-black text-foreground uppercase tracking-widest hidden sm:block">FROSTY TRADERS</span>
                            </a>
                        </div>
                        
                        <div className="flex-1 flex justify-center">
                             <div className="relative group transition-all duration-300 hover:scale-105 active:scale-95">
                                <motion.div 
                                    className="absolute -inset-1 bg-gradient-to-r from-primary via-cyan-500 to-primary rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"
                                    animate={{ opacity: [0.25, 0.5, 0.25] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                />
                                <a href="https://frostytraders.com" target="_blank" rel="noopener noreferrer" className="relative flex items-center gap-3 px-8 py-2 bg-card border border-white/5 rounded-full shadow-2xl">
                                    <span className="text-[10px] font-black text-foreground uppercase tracking-[0.4em] whitespace-nowrap">FROSTY TRADERS</span>
                                    <ExternalLink className="h-3 w-3 text-primary" />
                                </a>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                            <div className="flex items-center bg-card border border-border rounded-full shadow-2xl h-10 px-1 overflow-hidden">
                                <div className="flex items-center gap-3 px-5 py-2 border-r border-border">
                                    <div className={cn("h-2.5 w-2.5 rounded-full animate-pulse", surveillanceStatus === 'active' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)]")} />
                                    <span className="text-[10px] font-black text-foreground uppercase tracking-[0.3em] hidden sm:inline">LIVE</span>
                                </div>
                                <div className="flex items-center gap-2 px-5 py-2 bg-muted/30">
                                    <Radio className={cn("h-3.5 w-3.5 transition-all", surveillanceStatus === 'active' ? 'text-emerald-500 animate-pulse' : 'text-rose-500')} />
                                    <span className="text-[10px] font-black uppercase text-foreground tracking-[0.2em]">{surveillanceStatus === 'active' ? 'LIVE' : 'OFFLINE'}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="h-10 w-10 rounded-full border border-border bg-card shadow-xl hover:bg-muted text-foreground transition-all">
                                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative p-2 sm:p-4">
                    <Tabs defaultValue="analyzer" className="w-full">
                        <TabsList className="flex items-center justify-start md:justify-center gap-1.5 md:gap-2 bg-transparent h-auto p-0 mb-4 md:mb-6 overflow-x-auto no-scrollbar w-full pb-2">
                            {['analyzer', 'last-digit-analysis', 'frequency', 'global-scan', 'chart', 'insight'].map((tab) => (
                                <TabsTrigger key={tab} value={tab} className="flex-shrink-0 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all shadow-sm hover:bg-muted/50">
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
                        <TabsContent value="chart" className="mt-0 outline-none animate-in fade-in duration-500 h-[88vh]">
                            <DerivChart 
                                priceHistory={priceHistory} 
                                tickTimestamps={tickTimestamps} 
                                decimalPlaces={decimalPlaces} 
                                lastDigitTicks={analyzedDigits}
                                selectedInterval={chartInterval}
                                onIntervalChange={setChartInterval}
                                candleData={candleData}
                                selectedMarket={selectedMarket}
                                onMarketChange={setSelectedMarket}
                                globalResults={globalResults}
                            />
                        </TabsContent>
                        <TabsContent value="insight" className="mt-0 outline-none animate-in fade-in duration-500">
                            <InsightView globalResults={globalResults} activeScanId={activeScanId} dashboardPrice={Number(price) || 0} dashboardMarketId={selectedMarket} />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
}

