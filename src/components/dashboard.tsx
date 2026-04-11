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
import { StrategyOverOne } from './strategy-over-one';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { KeyRound, ShieldCheck, RefreshCw, Radio, Activity, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type EngineStatus = 'offline' | 'active' | 'standby' | 'authorized' | 'executing';

export function Dashboard() {
    const [mounted, setMounted] = React.useState(false);
    const [price, setPrice] = React.useState(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [priceHistory, setPriceHistory] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000); 
    const [selectedMarket, setSelectedMarket] = React.useState('1HZ10V');
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);
    
    const [surveillanceStatus, setSurveillanceStatus] = React.useState<EngineStatus>('offline');
    const [executionStatus, setExecutionStatus] = React.useState<EngineStatus>('standby');
    
    const [apiToken, setApiToken] = React.useState('');
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [isVirtual, setIsVirtual] = React.useState(false);
    const [balance, setBalance] = React.useState(0);
    const [currency, setCurrency] = React.useState('USD');
    const [wsInstance, setWsInstance] = React.useState<WebSocket | null>(null);
    const { toast } = useToast();

    const [activeContract, setActiveContract] = React.useState<any>(null);

    const currentMarketRef = React.useRef(selectedMarket);
    const pipSizeRef = React.useRef<number | null>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        currentMarketRef.current = selectedMarket;
    }, [selectedMarket]);

    React.useEffect(() => {
        if (!mounted) return;

        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');
        setWsInstance(ws);

        let historyBuffer: {time: number, price: number}[] | null = null;

        ws.onopen = () => {
            setSurveillanceStatus('active');
            const savedToken = localStorage.getItem('frosty_api_token');
            if (savedToken) {
                ws.send(JSON.stringify({ "authorize": savedToken }));
            }
            ws.send(JSON.stringify({ 
                "ticks_history": selectedMarket, 
                "count": 500, 
                "end": "latest", 
                "style": "ticks", 
                "subscribe": 1 
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const msgMarket = data.echo_req?.ticks_history || data.tick?.symbol;
            if (msgMarket && msgMarket !== currentMarketRef.current) return;

            if (data.error) {
                if (data.msg_type === 'authorize') {
                    setIsAuthorized(false);
                    setExecutionStatus('standby');
                }
                return;
            }

            if (data.msg_type === 'authorize') {
                setIsAuthorized(true);
                setExecutionStatus('authorized');
                setCurrency(data.authorize.currency);
                setIsVirtual(data.authorize.is_virtual === 1);
                localStorage.setItem('frosty_api_token', data.echo_req.authorize);
                ws.send(JSON.stringify({ "balance": 1, "subscribe": 1 }));
                toast({ title: "API AUTHORIZED" });
            }

            if (data.msg_type === 'balance') {
                setBalance(data.balance.balance);
                setCurrency(data.balance.currency);
            }

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
                    // EXACT DIGIT EXTRACTION: No rounding.
                    const fullPriceStr = newPrice.toFixed(8);
                    const decimals = fullPriceStr.split('.')[1] || '00000000';
                    const newDigit = parseInt(decimals[activePipSize - 1] || '0');

                    setTickTimestamps(prev => [Date.now(), ...prev].slice(0, 2000));
                    setPrice(newPrice);
                    setLastDigitTicks(prev => [newDigit, ...prev].slice(0, 2000));
                    setPriceHistory(prev => [newPrice, ...prev].slice(0, 2000));
                }
            }

            if (data.msg_type === 'proposal') {
                if (data.proposal && data.proposal.id) {
                    ws.send(JSON.stringify({ "buy": data.proposal.id, "price": data.proposal.ask_price }));
                }
            }

            if (data.msg_type === 'buy') {
                if (data.buy && data.buy.contract_id) {
                    setExecutionStatus('executing');
                    ws.send(JSON.stringify({ "proposal_open_contract": 1, "contract_id": data.buy.contract_id, "subscribe": 1 }));
                }
            }

            if (data.msg_type === 'proposal_open_contract') {
                setActiveContract(data.proposal_open_contract);
                if (data.proposal_open_contract.is_expired) {
                    setExecutionStatus('authorized');
                    ws.send(JSON.stringify({ "balance": 1 }));
                }
            }
        };

        ws.onclose = () => { setSurveillanceStatus('offline'); setExecutionStatus('standby'); };
        ws.onerror = () => { setSurveillanceStatus('offline'); setExecutionStatus('standby'); };

        return () => { if(ws && ws.readyState === WebSocket.OPEN) ws.close(); };
    }, [mounted, toast]);

    React.useEffect(() => {
        if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
        pipSizeRef.current = null;
        setDecimalPlaces(2);
        setLastDigitTicks([]);
        setPriceHistory([]);
        setTickTimestamps([]);
        wsInstance.send(JSON.stringify({ "forget_all": "ticks" }));
        wsInstance.send(JSON.stringify({ "ticks_history": selectedMarket, "count": 500, "end": "latest", "style": "ticks", "subscribe": 1 }));
    }, [selectedMarket, wsInstance]);

    const handleMaxTicksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
        if (!isNaN(val)) setMaxTicks(val > 2000 ? 2000 : val);
    };

    const handleMaxTicksBlur = () => { if (maxTicks < 1) setMaxTicks(1); };

    const handleExecuteRealTrade = (params: any) => {
        if (!wsInstance || !isAuthorized) return;
        wsInstance.send(JSON.stringify({
            "proposal": 1,
            "amount": params.stake,
            "barrier": params.barrier || "1",
            "basis": "stake",
            "contract_type": params.contract_type || "DIGITOVER",
            "currency": currency,
            "duration": 1, 
            "duration_unit": "t",
            "symbol": selectedMarket
        }));
    };

    if (!mounted) return <div className="flex min-h-screen items-center justify-center bg-white"><Activity className="h-4 w-4 animate-spin text-primary" /></div>;

    const analyzedDigits = lastDigitTicks.slice(0, maxTicks);
    const analyzedPrices = priceHistory.slice(0, maxTicks);

    return (
        <div className="flex min-h-screen w-full flex-col bg-slate-50 font-sans overflow-x-hidden">
            <header className="sticky top-0 z-[100] flex h-[3.5rem] items-center border-b bg-white/95 backdrop-blur-xl px-4 shadow-sm">
                <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" onClick={() => window.location.reload()} title="SYSTEM RELOAD" className="h-8 w-8 rounded-full border-slate-200 bg-slate-100 hover:bg-slate-200 flex items-center justify-center shadow-sm group active:scale-95 transition-all">
                            <RefreshCw className="h-3.5 w-3.5 text-slate-950 group-hover:rotate-180 transition-transform duration-500" />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("h-8 px-3 rounded-full border-slate-200 font-black text-[9px] uppercase tracking-widest gap-2 transition-all shadow-sm", isAuthorized ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-950 text-white")}>
                                    {isAuthorized ? <ShieldCheck className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
                                    <span className="hidden xs:inline">{isAuthorized ? "AUTHORIZED" : "TACTICAL API"}</span>
                                    <span className="inline xs:hidden">API</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[220px] p-3 bg-slate-950 border-white/10 rounded-2xl shadow-2xl">
                                {isAuthorized ? (
                                    <Button onClick={() => { localStorage.removeItem('frosty_api_token'); window.location.reload(); }} variant="destructive" className="w-full h-9 rounded-xl font-black text-[9px] uppercase tracking-widest">LOGOUT SESSION</Button>
                                ) : (
                                    <div className="space-y-3">
                                        <Input placeholder="API Token..." type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} className="h-9 bg-black/60 border-white/10 text-white font-bold rounded-xl text-[11px]" />
                                        <Button onClick={() => wsInstance?.send(JSON.stringify({"authorize": apiToken}))} className="w-full h-9 rounded-xl font-black text-[9px] uppercase tracking-widest bg-primary">SYNC ENGINE</Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                        <div className={cn("flex items-center gap-2.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm transition-all", !isAuthorized && "opacity-50")}>
                            <Wallet className="h-3.5 w-3.5 text-slate-500" />
                            <div className="text-left leading-none">
                                <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mb-0.5">LIQUIDITY</p>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-black text-slate-950 tabular-nums">{isAuthorized ? balance.toFixed(2) : '0.00'}</p>
                                    {isAuthorized && <Badge className={cn("h-3.5 text-[6px] font-black uppercase px-1 border-none", isVirtual ? "bg-amber-500 text-white" : "bg-emerald-500 text-white")}>{isVirtual ? 'DEMO' : 'REAL'}</Badge>}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white border border-slate-200 rounded-full shadow-lg h-8 px-1 overflow-hidden">
                            <a href="https://frostytraders.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-1.5 border-r border-slate-100 hover:bg-slate-50 transition-colors group">
                                <div className={cn("h-2 w-2 rounded-full animate-pulse transition-all duration-500", surveillanceStatus === 'active' ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]")} />
                                <span className="text-[10px] font-black text-slate-950 uppercase tracking-[0.3em]">FROSTY</span>
                            </a>
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50/50">
                                <Radio className={cn("h-3 w-3 transition-all duration-500", surveillanceStatus === 'active' ? 'text-emerald-500 animate-pulse' : 'text-rose-500')} />
                                <span className="hidden sm:inline text-[9px] font-black uppercase text-slate-950 tracking-[0.2em]">{surveillanceStatus === 'active' ? 'SURVEILLANCE LIVE' : 'ENGINE OFFLINE'}</span>
                                <span className="sm:hidden text-[9px] font-black uppercase text-slate-950">{surveillanceStatus === 'active' ? 'LIVE' : 'OFF'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative p-2 sm:p-4">
                <Tabs defaultValue="strategy-over-one" className="w-full">
                    <TabsList className="flex items-center justify-start md:justify-center gap-1.5 bg-transparent h-auto p-0 mb-4 overflow-x-auto no-scrollbar w-full">
                        {['strategy-over-one', 'global-scan', 'scanner', 'analyzer', 'frequency', 'insight', 'circles'].map((tab) => (
                            <TabsTrigger key={tab} value={tab} className="flex-shrink-0 px-3.5 py-2 rounded-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground font-black text-[8px] uppercase tracking-widest transition-all">
                                {tab === 'strategy-over-one' ? 'OVER 1 BOT' : tab.toUpperCase().replace('-', ' ')}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="strategy-over-one" className="mt-0 outline-none"><StrategyOverOne price={price} lastDigitTicks={analyzedDigits} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} balance={balance} isAuthorized={isAuthorized} currency={currency} onExecuteTrade={handleExecuteRealTrade} activeContract={activeContract} surveillanceStatus={surveillanceStatus} executionStatus={executionStatus}/></TabsContent>
                    <TabsContent value="global-scan" className="mt-0 outline-none"><GlobalMarketScanner onMarketSelect={setSelectedMarket} lastDigitTicks={analyzedDigits} price={price} decimalPlaces={decimalPlaces} /></TabsContent>
                    <TabsContent value="scanner" className="mt-0 outline-none"><ScannerView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} /></TabsContent>
                    <TabsContent value="analyzer" className="mt-0 outline-none"><AnalyzerView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} tickTimestamps={tickTimestamps} /></TabsContent>
                    <TabsContent value="frequency" className="mt-0 outline-none"><DigitFrequencyView price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks} handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} /></TabsContent>
                    <TabsContent value="insight" className="mt-0 outline-none"><InsightView price={price} decimalPlaces={decimalPlaces} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} maxTicks={maxTicks} /></TabsContent>
                    <TabsContent value="circles" className="mt-0 outline-none"><CorrelationView selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} lastDigitTicks={analyzedDigits} price={price} decimalPlaces={decimalPlaces} /></TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
