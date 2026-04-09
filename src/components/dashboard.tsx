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
import { KeyRound, ShieldCheck, Wallet, LogOut, Activity, Lock, RefreshCw, Cpu, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type EngineStatus = 'offline' | 'active' | 'standby' | 'authorized' | 'executing';

export function Dashboard() {
    const [mounted, setMounted] = React.useState(false);
    const [price, setPrice] = React.useState(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [priceHistory, setPriceHistory] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000); 
    const [selectedMarket, setSelectedMarket] = React.useState(syntheticIndices[0].id);
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);
    
    // Dual Engine State
    const [surveillanceStatus, setSurveillanceStatus] = React.useState<EngineStatus>('active');
    const [executionStatus, setExecutionStatus] = React.useState<EngineStatus>('standby');
    
    // API & Auth State
    const [apiToken, setApiToken] = React.useState('');
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [isVirtual, setIsVirtual] = React.useState(false);
    const [balance, setBalance] = React.useState(0);
    const [currency, setCurrency] = React.useState('USD');
    const [wsInstance, setWsInstance] = React.useState<WebSocket | null>(null);
    const { toast } = useToast();

    // Trade Handling State
    const [activeContract, setActiveContract] = React.useState<any>(null);

    // Initial mounting guard
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // PERSISTENT WEBSOCKET INITIALIZATION (App ID 84799)
    React.useEffect(() => {
        if (!mounted) return;

        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=84799');
        setWsInstance(ws);

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
            setSurveillanceStatus('active');
            const savedToken = localStorage.getItem('frosty_api_token');
            if (savedToken) {
                ws.send(JSON.stringify({ "authorize": savedToken }));
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                if (data.msg_type === 'authorize') {
                    setIsAuthorized(false);
                    setExecutionStatus('standby');
                    localStorage.removeItem('frosty_api_token');
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
                toast({ title: "CONNECTED" });
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
                const contract = data.proposal_open_contract;
                setActiveContract(contract);
                if (contract.is_expired) {
                    setExecutionStatus('authorized');
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ "balance": 1 }));
                    }
                }
            }
        };

        ws.onclose = () => {
            setSurveillanceStatus('offline');
            setExecutionStatus('standby');
        };
        ws.onerror = () => {
            setSurveillanceStatus('offline');
            setExecutionStatus('standby');
        };

        return () => {
           if(ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
             ws.close();
           }
        };
    }, [mounted, toast]);

    // LIVE MARKET SYNCHRONIZATION
    React.useEffect(() => {
        if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
        
        setPrice(0);
        setLastDigitTicks([]);
        setPriceHistory([]);
        setTickTimestamps([]);
        
        wsInstance.send(JSON.stringify({ "forget_all": "ticks" }));
        wsInstance.send(JSON.stringify({ 
            "ticks_history": selectedMarket, 
            "count": 500, 
            "end": "latest", 
            "style": "ticks", 
            "subscribe": 1 
        }));
    }, [selectedMarket, wsInstance]);

    const handleAuthorize = () => {
        if (!wsInstance || !apiToken) return;
        wsInstance.send(JSON.stringify({ "authorize": apiToken }));
    };

    const handleLogout = () => {
        localStorage.removeItem('frosty_api_token');
        setIsAuthorized(false);
        setBalance(0);
        setApiToken('');
        window.location.reload();
    };

    const handleSystemReload = () => {
        window.location.reload();
    };

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

    if (!mounted) {
        return (
            <div className="flex min-h-screen w-full flex-col bg-background font-sans items-center justify-center">
                <Activity className="h-6 w-6 text-primary animate-spin" />
                <p className="mt-2 text-[8px] font-black uppercase tracking-[0.2em] text-primary/60 animate-pulse">Initializing...</p>
            </div>
        );
    }

    const analyzedDigits = lastDigitTicks.slice(0, maxTicks);
    const analyzedPrices = priceHistory.slice(0, maxTicks);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden">
      <header className="sticky top-0 z-[100] flex h-[3.5rem] items-center border-b bg-white/95 backdrop-blur-xl transition-all duration-300 px-2 sm:px-6">
        <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto">
          
          {/* LEFT: RELOAD & API HANDSHAKE */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button 
                variant="outline" 
                onClick={handleSystemReload}
                className="h-7 w-7 sm:h-9 sm:w-9 rounded-full border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center shadow-sm group active:scale-95"
            >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-slate-950 group-hover:rotate-180 transition-transform duration-500" />
            </Button>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                        "h-7 sm:h-9 px-2 sm:px-4 rounded-full border-slate-200 font-black text-[7px] sm:text-[9px] uppercase tracking-widest gap-1 sm:gap-2 transition-all shadow-sm",
                        isAuthorized ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-950 text-white"
                    )}>
                        {isAuthorized ? <ShieldCheck className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" /> : <KeyRound className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />}
                        <span className="hidden xs:inline">{isAuthorized ? "AUTHORIZED" : "CONNECT TACTICAL API"}</span>
                        <span className="inline xs:hidden">{isAuthorized ? "OK" : "API"}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-3 bg-slate-950 border-white/10 rounded-xl shadow-2xl">
                    <div className="space-y-3">
                        {isAuthorized ? (
                            <div className="space-y-2">
                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <p className="text-[7px] font-black text-emerald-400 uppercase mb-1">EQUITY</p>
                                    <p className="text-sm font-black text-white">{balance.toFixed(2)} {currency}</p>
                                </div>
                                <Button onClick={handleLogout} variant="destructive" className="w-full h-8 rounded-lg font-black text-[8px] uppercase tracking-widest">LOGOUT</Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Input 
                                    placeholder="API Token..." 
                                    type="password"
                                    value={apiToken}
                                    onChange={(e) => setApiToken(e.target.value)}
                                    className="h-8 bg-black/60 border-white/10 text-white font-bold rounded-lg text-xs"
                                />
                                <Button onClick={handleAuthorize} className="w-full h-8 rounded-lg font-black text-[8px] uppercase tracking-widest bg-primary">INITIATE SYNC</Button>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            <div className={cn(
                "flex items-center gap-1.5 sm:gap-3 bg-slate-50 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full border border-slate-200 shadow-sm transition-all",
                !isAuthorized && "opacity-50"
            )}>
                <div className="text-left leading-none">
                    <p className="text-[6px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">LIQUIDITY LOCKED</p>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <p className="text-[10px] sm:text-sm font-black text-slate-950 tabular-nums">
                            {isAuthorized ? balance.toFixed(2) : '0.00'} <span className="text-[7px] sm:text-[9px] opacity-40">{currency}</span>
                        </p>
                        {isAuthorized && (
                            <Badge className={cn(
                                "h-3 sm:h-4 text-[5px] sm:text-[7px] font-black uppercase px-1 border-none",
                                isVirtual ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                            )}>
                                {isVirtual ? 'DEMO' : 'REAL'}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
          </div>

          {/* CENTER: FROSTY BRANDING */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <a 
                href="https://frostytraders.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 bg-slate-950 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all group"
            >
                <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                <span className="text-[10px] sm:text-sm font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.4em]">FROSTY</span>
            </a>
          </div>

          {/* RIGHT: SURVEILLANCE */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-slate-50 rounded-full border border-slate-200 shadow-sm">
                <Radio className={cn("h-2.5 w-2.5 sm:h-3.5 sm:w-3.5", surveillanceStatus === 'active' ? 'text-emerald-500 animate-pulse' : 'text-rose-500')} />
                <span className="hidden sm:inline text-[7px] sm:text-[9px] font-black uppercase text-slate-950 tracking-[0.2em]">SURVEILLANCE LIVE</span>
                <span className="sm:hidden text-[7px] font-black uppercase text-slate-950 tracking-widest">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative">
        <div className="flex-1 p-2 sm:p-4">
            <Tabs defaultValue="strategy-over-one" className="w-full">
                <TabsList className="flex items-center justify-start md:justify-center gap-1 bg-transparent h-auto p-0 mb-4 overflow-x-auto no-scrollbar w-full">
                    {['strategy-over-one', 'global-scan', 'scanner', 'analyzer', 'frequency', 'insight', 'circles'].map((tab) => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab}
                            className="flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border border-transparent data-[state=active]:bg-primary/10 data-[state=active]:text-primary text-muted-foreground font-black text-[7px] sm:text-[9px] uppercase tracking-widest transition-all"
                        >
                            {tab === 'strategy-over-one' ? 'OVER 1' : tab.toUpperCase().replace('-', ' ')}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="strategy-over-one" className="mt-0 outline-none">
                    <StrategyOverOne 
                        price={price} lastDigitTicks={analyzedDigits} selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} balance={balance}
                        isAuthorized={isAuthorized} currency={currency} onExecuteTrade={handleExecuteRealTrade}
                        activeContract={activeContract} surveillanceStatus={surveillanceStatus} executionStatus={executionStatus}
                    />
                </TabsContent>

                <TabsContent value="global-scan" className="mt-0 outline-none">
                    <GlobalMarketScanner onMarketSelect={setSelectedMarket} lastDigitTicks={analyzedDigits} price={price} decimalPlaces={decimalPlaces} />
                </TabsContent>

                <TabsContent value="scanner" className="mt-0 outline-none">
                    <ScannerView 
                        price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks}
                        handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces}
                    />
                </TabsContent>

                <TabsContent value="analyzer" className="mt-0 outline-none">
                    <AnalyzerView
                        price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks}
                        handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces} tickTimestamps={tickTimestamps}
                    />
                </TabsContent>

                <TabsContent value="frequency" className="mt-0 outline-none">
                    <DigitFrequencyView
                        price={price} lastDigitTicks={analyzedDigits} priceHistory={analyzedPrices} maxTicks={maxTicks}
                        handleMaxTicksChange={handleMaxTicksChange} handleMaxTicksBlur={handleMaxTicksBlur} selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket} decimalPlaces={decimalPlaces}
                    />
                </TabsContent>

                <TabsContent value="insight" className="mt-0 outline-none">
                    <InsightView
                        price={price} decimalPlaces={decimalPlaces} lastDigitTicks={analyzedDigits}
                        priceHistory={analyzedPrices} selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} maxTicks={maxTicks}
                    />
                </TabsContent>
                
                <TabsContent value="circles" className="mt-0 outline-none">
                    <CorrelationView selectedMarket={selectedMarket} onMarketChange={setSelectedMarket} lastDigitTicks={analyzedDigits} price={price} decimalPlaces={decimalPlaces} />
                </TabsContent>
            </Tabs>
        </div>
      </main>
    </div>
  );
}
