
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
import { KeyRound, ShieldCheck, Wallet, RefreshCw, LogOut, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ConnectionStatusType = 'connecting' | 'streaming' | 'disconnected' | 'authorized';

export function Dashboard() {
    const [price, setPrice] = React.useState(0);
    const [lastDigitTicks, setLastDigitTicks] = React.useState<number[]>([]);
    const [priceHistory, setPriceHistory] = React.useState<number[]>([]);
    const [maxTicks, setMaxTicks] = React.useState(1000); 
    const [selectedMarket, setSelectedMarket] = React.useState(syntheticIndices[0].id);
    const [decimalPlaces, setDecimalPlaces] = React.useState(2);
    const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatusType>('connecting');
    const [tickTimestamps, setTickTimestamps] = React.useState<number[]>([]);
    
    // API & Auth State
    const [apiToken, setApiToken] = React.useState('');
    const [isAuthorized, setIsAuthorized] = React.useState(false);
    const [balance, setBalance] = React.useState(10000);
    const [currency, setCurrency] = React.useState('USD');
    const [wsInstance, setWsInstance] = React.useState<WebSocket | null>(null);
    const { toast } = useToast();

    // Trade Handling State
    const [activeContract, setActiveContract] = React.useState<any>(null);

    React.useEffect(() => {
        setPrice(0);
        setLastDigitTicks([]);
        setPriceHistory([]);
        setTickTimestamps([]);
        setConnectionStatus('connecting');

        // Core Configuration: App ID 84799 for tactical commission tracking
        const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=84799');
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
            setConnectionStatus('connecting');
            ws.send(JSON.stringify({ 
                "ticks_history": selectedMarket, 
                "count": 500, 
                "end": "latest", 
                "style": "ticks", 
                "subscribe": 1 
            }));

            const savedToken = localStorage.getItem('frosty_api_token');
            if (savedToken) {
                ws.send(JSON.stringify({ "authorize": savedToken }));
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.error) {
                toast({
                    variant: "destructive",
                    title: "DERIV API ERROR",
                    description: data.error.message
                });
                return;
            }

            // Authentication Handler
            if (data.msg_type === 'authorize') {
                setIsAuthorized(true);
                setConnectionStatus('authorized');
                setCurrency(data.authorize.currency);
                localStorage.setItem('frosty_api_token', data.echo_req.authorize);
                ws.send(JSON.stringify({ "balance": 1, "subscribe": 1 }));
                toast({
                    title: "TACTICAL SYNC COMPLETE",
                    description: `Authorized as ${data.authorize.loginid}. Real balance engaged.`
                });
            }

            // Balance Updates
            if (data.msg_type === 'balance') {
                setBalance(data.balance.balance);
                setCurrency(data.balance.currency);
            }

            // Tick & History Stream
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
                if (!isAuthorized) setConnectionStatus('streaming');
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

            // Trade Execution Flow (Proposal -> Buy)
            if (data.msg_type === 'proposal') {
                if (data.proposal && data.proposal.id) {
                    ws.send(JSON.stringify({
                        "buy": data.proposal.id,
                        "price": data.proposal.ask_price
                    }));
                }
            }

            if (data.msg_type === 'buy') {
                if (data.buy && data.buy.contract_id) {
                    ws.send(JSON.stringify({
                        "proposal_open_contract": 1,
                        "contract_id": data.buy.contract_id,
                        "subscribe": 1
                    }));
                }
            }

            if (data.msg_type === 'proposal_open_contract') {
                setActiveContract(data.proposal_open_contract);
                if (data.proposal_open_contract.is_expired) {
                    // Final contract outcome handled here
                    setActiveContract(null);
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

    const handleAuthorize = () => {
        if (!wsInstance || !apiToken) return;
        wsInstance.send(JSON.stringify({ "authorize": apiToken }));
    };

    const handleLogout = () => {
        localStorage.removeItem('frosty_api_token');
        setIsAuthorized(false);
        setBalance(10000);
        setApiToken('');
        window.location.reload();
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
        authorized: 'text-cyan-400',
        connecting: 'text-amber-400',
        disconnected: 'text-rose-500'
    };

    const statusBg = {
        streaming: 'bg-emerald-400',
        authorized: 'bg-cyan-400',
        connecting: 'bg-amber-400',
        disconnected: 'bg-rose-500'
    };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans overflow-x-hidden">
      <header className="sticky top-0 z-[60] flex h-auto min-h-[5rem] flex-col md:flex-row items-center border-b bg-background/80 px-4 py-3 md:py-0 md:px-8 backdrop-blur-xl transition-all duration-300">
        <div className="flex w-full items-center justify-between max-w-[1600px] mx-auto gap-4">
          
          <div className="flex-1 flex items-center gap-4">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                        "h-12 px-6 rounded-full border-white/10 font-black text-[10px] uppercase tracking-widest gap-3 transition-all",
                        isAuthorized ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-black/40 hover:bg-white/5"
                    )}>
                        {isAuthorized ? <ShieldCheck className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                        {isAuthorized ? "API CONNECTED" : "CONNECT TACTICAL API"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-6 bg-slate-950 border-white/10 rounded-[2rem] shadow-2xl">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h4 className="text-xs font-black uppercase text-white tracking-widest">TACTICAL AUTHORIZATION</h4>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">Enter your Deriv API Token to enable real-market execution and commission tracking via App ID 84799.</p>
                        </div>
                        {isAuthorized ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black text-emerald-400 uppercase">LIVE BALANCE</span>
                                        <Wallet className="h-3 w-3 text-emerald-400" />
                                    </div>
                                    <p className="text-2xl font-black text-white">{balance.toFixed(2)} {currency}</p>
                                </div>
                                <Button onClick={handleLogout} variant="destructive" className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                                    <LogOut className="h-3 w-3" /> TERMINATE SESSION
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Input 
                                    placeholder="Enter API Token..." 
                                    value={apiToken}
                                    onChange={(e) => setApiToken(e.target.value)}
                                    className="h-12 bg-black/60 border-white/10 text-white font-bold rounded-xl focus:ring-primary/40"
                                />
                                <Button onClick={handleAuthorize} className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary hover:bg-primary/90">
                                    INITIATE SYNC
                                </Button>
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-1 justify-center w-full md:w-auto mt-0">
            <div className="relative group transition-all duration-300 hover:scale-105 active:scale-95">
                <div className={cn(
                    "absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000",
                    statusBg[connectionStatus]
                )}></div>
                <div className="relative flex items-center gap-3 px-6 md:px-10 py-3 md:py-4 bg-card border border-white/5 rounded-full shadow-2xl">
                    <div className="relative flex items-center justify-center">
                        <div className={cn("h-2 w-2 md:h-3 md:w-3 rounded-full transition-all duration-500", statusBg[connectionStatus])} />
                        {(connectionStatus === 'streaming' || connectionStatus === 'authorized') && (
                            <div className={cn("absolute h-2 w-2 md:h-3 md:w-3 rounded-full animate-ping opacity-75", statusBg[connectionStatus])} />
                        )}
                    </div>
                    <span className={cn(
                        "text-[10px] sm:text-[12px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.4em] whitespace-nowrap transition-colors duration-500",
                        statusColors[connectionStatus]
                    )}>
                        FROSTY HOLDINGS
                    </span>
                </div>
            </div>
          </div>

          <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/5">
                <div className="text-right">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{isAuthorized ? 'LIVE BALANCE' : 'VIRTUAL EQUITY'}</p>
                    <p className={cn("text-sm font-black tabular-nums", isAuthorized ? "text-emerald-400" : "text-primary")}>
                        {balance.toFixed(2)} <span className="text-[10px] opacity-40">{currency}</span>
                    </p>
                </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full relative">
        <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8">
            <Tabs defaultValue="strategy-over-one" className="w-full">
                <TabsList className="flex items-center justify-start md:justify-center gap-1.5 md:gap-2 bg-transparent h-auto p-0 mb-4 md:mb-10 overflow-x-auto no-scrollbar pb-2 w-full">
                    {['strategy-over-one', 'global-scan', 'scanner', 'analyzer', 'frequency', 'insight', 'circles'].map((tab) => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab}
                            className="flex-shrink-0 px-3 sm:px-6 md:px-8 py-2 md:py-3 rounded-full border border-transparent data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(var(--primary),0.15)] text-muted-foreground font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all duration-300 hover:text-foreground hover:bg-muted/50"
                        >
                            {tab === 'strategy-over-one' ? 'OVER 1' : tab === 'global-scan' ? 'GLOBAL SCAN' : tab.toUpperCase()}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="strategy-over-one" className="mt-0 animate-in fade-in zoom-in-95 duration-500 outline-none">
                    <StrategyOverOne 
                        price={price}
                        lastDigitTicks={analyzedDigits}
                        selectedMarket={selectedMarket}
                        onMarketChange={setSelectedMarket}
                        decimalPlaces={decimalPlaces}
                        balance={balance}
                        isAuthorized={isAuthorized}
                        currency={currency}
                        onExecuteTrade={handleExecuteRealTrade}
                    />
                </TabsContent>

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
