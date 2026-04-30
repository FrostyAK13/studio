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
import { motion, AnimatePresence } from 'framer-motion';
import { LockScreen } from './lock-screen';

type EngineStatus = 'offline' | 'active';

export interface GlobalAnalysisResult {
    marketId: string;
    marketName: string;
    // Sniper Model Metrics
    ci: number;
    ss: number;
    de: number;
    cs: number;
    marketScore: number;
    // Execution
    tradeType: 'MATCHES' | 'NO TRADE';
    entryDigit: number | null;
    confidence: number;
    // Distribution Strategy (Scanner - O3/U6 Model)
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
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');

        const savedMarket = localStorage.getItem('selectedMarket');
        if (savedMarket) setSelectedMarket(savedMarket);

        const savedTicks = localStorage.getItem('maxTicks');
        if (savedTicks) setMaxTicks(parseInt(savedTicks, 10));

        const authState = localStorage.getItem('frosty_auth');
        if (authState === 'true') setIsLocked(false);
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

    React.useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('selectedMarket', selectedMarket);
        localStorage.setItem('maxTicks', maxTicks.toString());
        currentMarketRef.current = selectedMarket;
    }, [selectedMarket, maxTicks, mounted]);

    // Background Global Sniper Engine
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
                    "count": 250,
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
                const marketId = data.echo_req.ticks_history;
                const marketName = syntheticIndices.find(m => m.id === marketId)?.name || marketId;
                const pip = data.echo_req.pip_size || 2;

                const ticks = prices.map((p: number) => {
                    const pStr = p.toFixed(8);
                    const dec = pStr.split('.')[1] || '00';
                    return parseInt(dec[pip - 1] || '0');
                }).reverse();

                // Sniper Step 1: Normalize each market
                const total = ticks.length || 1;
                const counts = Array(10).fill(0);
                ticks.forEach(d => counts[d]++);
                const P = counts.map(c => (c / total) * 100);
                const D = P.map(p => p - 10);

                // Sniper Step 2: Market Quality Score
                const CI = D.reduce((sum, d) => sum + Math.pow(d, 2), 0);
                const mean = P.reduce((a, b) => a + b) / 10;
                const stdDev = Math.sqrt(P.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / 10);
                const SS = 1 - (stdDev / 10); 
                const DE = Math.max(...D);
                const CS = [...D].sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + Math.abs(b), 0);

                // Weights: Direction > CI > SS > CS
                const marketScore = (DE * 0.4) + (CI * 0.3) + (SS * 0.2) + (CS * 0.1);

                // Sniper Step 4: Filter markets
                let sniperTradeType: 'MATCHES' | 'NO TRADE' = 'NO TRADE';
                let bestEntryDigit: number | null = null;
                let normalizedScore = 0;

                // Thresholds: Moderate dispersion
                if (CI > 5 && CI < 80 && SS > 0.4) {
                    // Sniper Step 6: Single-Digit Strategy on Selected Market
                    const digitScores = P.map((pi, i) => {
                        const n1 = (i + 1) % 10;
                        const n2 = (i + 9) % 10;
                        const neighborVar = Math.abs(P[n1] - P[n2]);
                        const finalScore = (pi - 10) * (1 - (neighborVar / 10));
                        return { digit: i, score: finalScore, percentage: pi };
                    });

                    // Rules: Above average, not the absolute highest, in stable cluster
                    const highestP = Math.max(...P);
                    const candidates = digitScores.filter(ds => 
                        ds.percentage > 10 && 
                        ds.percentage < highestP
                    ).sort((a, b) => b.score - a.score);

                    if (candidates.length > 0) {
                        bestEntryDigit = candidates[0].digit;
                        sniperTradeType = 'MATCHES';
                        normalizedScore = Math.min(99.9, 60 + (marketScore * 2));
                    }
                }

                // Distribution Strategy (Global Scan Logic)
                let S_U6 = 0;
                for (let i = 0; i <= 5; i++) S_U6 += D[i];
                for (let i = 6; i <= 9; i++) S_U6 -= Math.abs(D[i]);
                let S_O3 = 0;
                for (let i = 4; i <= 9; i++) S_O3 += D[i];
                for (let i = 0; i <= 3; i++) S_O3 -= Math.abs(D[i]);
                const scannerDirection = S_U6 > S_O3 ? 'UNDER 6' : 'OVER 3';
                const scannerCandidates = scannerDirection === 'UNDER 6' ? [0, 1, 2, 3, 4, 5] : [4, 5, 6, 7, 8, 9];
                const bestScanner = scannerCandidates.map(i => ({ digit: i, score: (10 - P[i]) * (1 - Math.abs(D[(i+1)%10] - D[(i+9)%10]) / 10) })).sort((a, b) => b.score - a.score)[0];

                setGlobalResults(prev => ({
                    ...prev,
                    [marketId]: {
                        marketId,
                        marketName,
                        ci: CI,
                        ss: SS,
                        de: DE,
                        cs: CS,
                        marketScore,
                        tradeType: sniperTradeType,
                        entryDigit: bestEntryDigit,
                        confidence: normalizedScore,
                        scannerStrategy: scannerDirection,
                        scannerEntry: bestScanner?.digit ?? null,
                        scannerConfidence: 60 + Math.max(S_U6, S_O3)
                    }
                }));

                currentIndex++;
                setTimeout(runGlobalScan, 200);
            }
        };

        return () => scanWs.close();
    }, [mounted, isLocked]);

    // Primary Market WebSocket
    React.useEffect(() => {
        if (!mounted || isLocked) return;

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
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const msgMarket = data.echo_req?.ticks_history || data.tick?.symbol;
            if (msgMarket && msgMarket !== currentMarketRef.current) return;

            if (data.error) return;

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
                    setLastDigitTicks(prev => [newDigit, ...prev].slice(0, 2000));
                    setPriceHistory(prev => [newPrice, ...prev].slice(0, 2000));
                }
            }
        };

        ws.onclose = () => setSurveillanceStatus('offline');
        return () => { if(ws && ws.readyState === WebSocket.OPEN) ws.close(); };
    }, [mounted, isLocked, selectedMarket]);

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
            <AnimatePresence>
                {isLocked && <LockScreen onUnlock={handleUnlock} />}
            </AnimatePresence>

            <div className={cn("flex flex-col flex-1 transition-all duration-700", isLocked ? "blur-xl scale-95 opacity-50 pointer-events-none" : "blur-0 scale-100 opacity-100")}>
                <header className="sticky top-0 z-[100] flex h-16 md:h-[4.5rem] items-center border-b bg-background/95 backdrop-blur-xl px-4 shadow-sm">
                    <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto">
                        <div className="flex items-center gap-2 md:gap-3 shrink-0">
                            <Button variant="outline" onClick={() => window.location.reload()} className="h-8 w-8 md:h-10 md:w-10 rounded-full border-border bg-card hover:bg-muted flex items-center justify-center shadow-lg group active:scale-90 transition-all duration-300 overflow-hidden">
                                <motion.div whileTap={{ rotate: 360 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                                    <RefreshCw className="h-4 w-4 md:h-5 md:w-5 text-foreground" />
                                </motion.div>
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
                                    <div className={cn("h-2 w-2 md:h-2.5 md:w-2.5 rounded-full animate-pulse transition-all duration-500", surveillanceStatus === 'active' ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.9)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)]")} />
                                    <span className="text-[7px] md:text-[10px] font-black text-foreground uppercase tracking-[0.2em] md:tracking-[0.3em] hidden sm:inline">SURVEILLANCE</span>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2 px-2 md:px-5 py-1 md:py-2 bg-muted/30">
                                    <Radio className={cn("h-3 w-3 md:h-3.5 md:w-3.5 transition-all duration-500", surveillanceStatus === 'active' ? 'text-emerald-500 animate-pulse' : 'text-rose-500')} />
                                    <span className="text-[7px] md:text-[10px] font-black uppercase text-foreground tracking-[0.1em] md:tracking-[0.2em]">{surveillanceStatus === 'active' ? 'LIVE' : 'OFFLINE'}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-border bg-card shadow-xl hover:bg-muted text-foreground transition-all active:scale-95">
                                <motion.div initial={false} animate={{ rotate: theme === 'light' ? 0 : 180 }} transition={{ type: "spring", stiffness: 200, damping: 10 }}>
                                    {theme === 'light' ? <Moon className="h-4 w-4 md:h-5 md:w-5" /> : <Sun className="h-4 w-4 md:h-5 md:w-5" />}
                                </motion.div>
                            </Button>
                        </div>
                    </div>
                </header>
                <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative p-2 sm:p-4">
                    <Tabs defaultValue="analyzer" className="w-full">
                        <TabsList className="flex items-center justify-start md:justify-center gap-1.5 md:gap-2 bg-transparent h-auto p-0 mb-4 md:mb-6 overflow-x-auto no-scrollbar w-full pb-2">
                            {['analyzer', 'global-scan', 'last-digit-analysis', 'frequency', 'insight'].map((tab) => (
                                <TabsTrigger key={tab} value={tab} className="flex-shrink-0 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground font-black text-[8px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all shadow-sm hover:bg-muted/50">
                                    {tab.toUpperCase().replace(/-/g, ' ')}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <TabsContent value="analyzer" className="mt-0 outline-none animate-in fade-in duration-500">
                            <AnalyzerView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} tickTimestamps={tickTimestamps} />
                        </TabsContent>
                        <TabsContent value="global-scan" className="mt-0 outline-none animate-in fade-in duration-500">
                            <GlobalMarketScanner onMarketSelect={setSelectedMarket} selectedMarket={selectedMarket} lastDigitTicks={analyzedDigits} price={price} decimalPlaces={decimalPlaces} globalResults={globalResults} activeScanId={activeScanId} />
                        </TabsContent>
                        <TabsContent value="last-digit-analysis" className="mt-0 outline-none animate-in fade-in duration-500">
                            <ScannerView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                        </TabsContent>
                        <TabsContent value="frequency" className="mt-0 outline-none animate-in fade-in duration-500">
                            <DigitFrequencyView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} />
                        </TabsContent>
                        <TabsContent value="insight" className="mt-0 outline-none animate-in fade-in duration-500">
                            <InsightView globalResults={globalResults} activeScanId={activeScanId} />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    );
}
