
'use client';

import * as React from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { AreaChart, CandlestickChart, Triangle, ChevronDown, Search, Undo2, Redo2, Maximize2, Camera, FunctionSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { syntheticIndices } from '@/lib/mock-data';
import { GlobalAnalysisResult } from './dashboard';

interface DerivChartProps {
    priceHistory: number[];
    tickTimestamps: number[];
    decimalPlaces: number;
    lastDigitTicks: number[];
    selectedInterval: string;
    onIntervalChange: (interval: string) => void;
    candleData?: any[];
    lastCandleUpdate?: any;
    selectedMarket: string;
    onMarketChange: (marketId: string) => void;
    globalResults: Record<string, GlobalAnalysisResult>;
}

const timeIntervals = [
    { label: '1m', id: '1m', category: 'MINUTES' },
    { label: '2m', id: '2m', category: 'MINUTES' },
    { label: '3m', id: '3m', category: 'MINUTES' },
    { label: '5m', id: '5m', category: 'MINUTES' },
    { label: '10m', id: '10m', category: 'MINUTES' },
    { label: '15m', id: '15m', category: 'MINUTES' },
    { label: '30m', id: '30m', category: 'MINUTES' },
    { label: '1h', id: '1h', category: 'HOURS' },
    { label: '2h', id: '2h', category: 'HOURS' },
    { label: '4h', id: '4h', category: 'HOURS' },
    { label: '8h', id: '8h', category: 'HOURS' },
    { label: '24h', id: '1d', category: 'HOURS' },
];

const indicatorScripts = [
  "Bollinger Bands",
  "Moving Average Exponential",
  "Double EMA",
  "MACD",
  "Relative Strength Index",
  "Stochastic RSI"
];

const calculateEMA = (data: any[], period: number) => {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    let ema = data[0].close;
    const results = [];
    for (let i = 0; i < data.length; i++) {
        ema = data[i].close * k + ema * (1 - k);
        results.push({ time: data[i].time as UTCTimestamp, value: Number(ema) });
    }
    return results;
};

const calculateBollingerBands = (data: any[], period: number, stdDev: number) => {
    if (data.length < period) return { upper: [], lower: [], middle: [] };
    const results = { upper: [] as any[], lower: [] as any[], middle: [] as any[] };
    
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const avg = slice.reduce((sum, item) => sum + Number(item.close), 0) / period;
        const variance = slice.reduce((sum, item) => sum + Math.pow(Number(item.close) - avg, 2), 0) / period;
        const dev = Math.sqrt(variance);
        
        results.middle.push({ time: data[i].time as UTCTimestamp, value: Number(avg) });
        results.upper.push({ time: data[i].time as UTCTimestamp, value: Number(avg + (stdDev * dev)) });
        results.lower.push({ time: data[i].time as UTCTimestamp, value: Number(avg - (stdDev * dev)) });
    }
    return results;
};

const DigitStatsOverlay = ({ ticks }: { ticks: number[] }) => {
    const stats = React.useMemo(() => {
        const counts = Array(10).fill(0);
        ticks.forEach(d => { if (d >= 0 && d <= 9) counts[d]++; });
        const total = ticks.length || 1;
        const mapped = counts.map((count, index) => ({ 
            digit: index, 
            percentage: (count / total) * 100 
        }));
        const sorted = [...mapped].sort((a, b) => b.percentage - a.percentage);
        const max = sorted[0].percentage;
        const min = sorted[sorted.length - 1].percentage;
        
        return mapped.map(item => ({
            ...item,
            isMax: item.percentage === max && total > 20,
            isMin: item.percentage === min && total > 20,
            isLast: ticks.length > 0 && ticks[0] === item.digit
        }));
    }, [ticks]);

    return (
        <div className="absolute bottom-10 left-0 w-full flex justify-center pointer-events-none z-[60]">
            <div className="flex gap-2 sm:gap-4 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-border shadow-2xl pointer-events-auto items-end">
                {stats.map((s) => {
                    const radius = 16;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (s.percentage / 20) * circumference; 
                    
                    return (
                        <div key={s.digit} className="flex flex-col items-center relative group">
                            <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle 
                                        cx="50%" cy="50%" r={radius} 
                                        stroke="currentColor" strokeWidth="2" 
                                        fill="transparent" className="text-muted/10" 
                                    />
                                    <circle 
                                        cx="50%" cy="50%" r={radius} 
                                        stroke={s.isMax ? "#00a69c" : s.isMin ? "#ff444f" : "#94a3b8"} 
                                        strokeWidth="3" fill="transparent" 
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="flex flex-col items-center justify-center z-10 leading-none">
                                    <span className="text-xs sm:text-base font-black">{s.digit}</span>
                                    <span className="text-[6px] sm:text-[8px] font-bold text-muted-foreground">{s.percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="h-4 flex items-center justify-center">
                                {s.isLast && (
                                    <motion.div 
                                        initial={{ scale: 0 }} 
                                        animate={{ scale: 1 }} 
                                        className="text-[#ff9100]"
                                    >
                                        <Triangle className="w-2.5 h-2.5 fill-current rotate-180" />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export function DerivChart({ 
    priceHistory, 
    tickTimestamps, 
    decimalPlaces, 
    lastDigitTicks,
    selectedInterval,
    onIntervalChange,
    candleData = [],
    lastCandleUpdate,
    selectedMarket,
    onMarketChange,
    globalResults
}: DerivChartProps) {
    const chartContainerRef = React.useRef<HTMLDivElement>(null);
    const chartRef = React.useRef<IChartApi | null>(null);
    const lineSeriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);
    const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
    
    const emaSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
    const bbUpperSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
    const bbLowerSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);
    const bbMiddleSeriesRef = React.useRef<ISeriesApi<"Line"> | null>(null);

    const [chartType, setChartType] = React.useState<'line' | 'candles'>('candles');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [indicatorSearch, setIndicatorSearch] = React.useState('');
    const [activeIndicators, setActiveIndicators] = React.useState<string[]>([]);

    const currentMarket = syntheticIndices.find(m => m.id === selectedMarket);
    const filteredIndices = syntheticIndices.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredIndicators = indicatorScripts.filter(s => s.toLowerCase().includes(indicatorSearch.toLowerCase()));

    const ohlcDisplay = React.useMemo(() => {
        const last = lastCandleUpdate || (candleData.length > 0 ? candleData[candleData.length - 1] : null);
        if (!last) return null;
        const prev = candleData.length > 1 ? candleData[candleData.length - 2] : last;
        const currentClose = Number(last.close);
        const prevClose = Number(prev.close);
        const diff = currentClose - prevClose;
        const perc = (diff / (prevClose || 1)) * 100;
        return { ...last, diff, perc };
    }, [candleData, lastCandleUpdate]);

    const toggleIndicator = (name: string) => {
        setActiveIndicators(prev => 
            prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
        );
    };

    React.useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ 
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight 
                });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#ffffff' },
                textColor: '#333333',
                fontSize: 11,
                fontFamily: 'Poppins',
            },
            grid: {
                vertLines: { color: '#f3f4f6' },
                horzLines: { color: '#f3f4f6' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            rightPriceScale: {
                borderColor: '#e5e7eb',
                autoScale: true,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.35, 
                },
            },
            timeScale: {
                borderColor: '#e5e7eb',
                timeVisible: true,
                secondsVisible: true,
                shiftVisibleRangeOnNewBar: true,
            },
            crosshair: {
                vertLine: { color: '#00a69c', width: 1, style: 1 },
                horzLine: { color: '#00a69c', width: 1, style: 1 },
            },
        });

        const areaSeries = chart.addAreaSeries({
            lineColor: '#00a69c',
            topColor: 'rgba(0, 166, 156, 0.2)',
            bottomColor: 'rgba(0, 166, 156, 0)',
            lineWidth: 2,
            priceFormat: { type: 'price', precision: decimalPlaces },
            visible: chartType === 'line',
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#00a69c',
            downColor: '#ff444f',
            borderVisible: false,
            wickUpColor: '#00a69c',
            wickDownColor: '#ff444f',
            priceFormat: { type: 'price', precision: decimalPlaces },
            visible: chartType === 'candles',
        });

        const emaSeries = chart.addLineSeries({
            color: '#3b82f6',
            lineWidth: 1.5,
            priceFormat: { type: 'price', precision: decimalPlaces },
            visible: activeIndicators.includes("Moving Average Exponential"),
        });

        const bbUpper = chart.addLineSeries({
            color: 'rgba(0, 166, 156, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceFormat: { type: 'price', precision: decimalPlaces },
            visible: activeIndicators.includes("Bollinger Bands"),
        });

        const bbLower = chart.addLineSeries({
            color: 'rgba(0, 166, 156, 0.5)',
            lineWidth: 1,
            lineStyle: 2,
            priceFormat: { type: 'price', precision: decimalPlaces },
            visible: activeIndicators.includes("Bollinger Bands"),
        });

        const bbMiddle = chart.addLineSeries({
            color: 'rgba(0, 166, 156, 0.3)',
            lineWidth: 1,
            priceFormat: { type: 'price', precision: decimalPlaces },
            visible: activeIndicators.includes("Bollinger Bands"),
        });

        chartRef.current = chart;
        lineSeriesRef.current = areaSeries;
        candleSeriesRef.current = candlestickSeries;
        emaSeriesRef.current = emaSeries;
        bbUpperSeriesRef.current = bbUpper;
        bbLowerSeriesRef.current = bbLower;
        bbMiddleSeriesRef.current = bbMiddle;

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [decimalPlaces, chartType, activeIndicators]);

    // Handle initial historical load
    React.useEffect(() => {
        if (!lineSeriesRef.current || !candleSeriesRef.current || !chartRef.current) return;

        if (candleData && candleData.length > 0) {
            // Strictly sort and deduplicate by timestamp to prevent library assertions
            const uniqueData = Array.from(new Map(candleData.map(c => [c.time, c])).values())
                .sort((a, b) => a.time - b.time)
                .map(c => ({
                    time: Number(c.time) as UTCTimestamp,
                    open: Number(c.open),
                    high: Number(c.high),
                    low: Number(c.low),
                    close: Number(c.close)
                }));
            
            candleSeriesRef.current.setData(uniqueData);
            lineSeriesRef.current.setData(uniqueData.map(c => ({ time: c.time, value: c.close })));

            // Calculate indicators based on clean historical sequence
            if (activeIndicators.includes("Moving Average Exponential") && emaSeriesRef.current) {
                emaSeriesRef.current.setData(calculateEMA(uniqueData, 20));
            }

            if (activeIndicators.includes("Bollinger Bands") && bbUpperSeriesRef.current && bbLowerSeriesRef.current && bbMiddleSeriesRef.current) {
                const bbData = calculateBollingerBands(uniqueData, 20, 2);
                bbUpperSeriesRef.current.setData(bbData.upper);
                bbLowerSeriesRef.current.setData(bbData.lower);
                bbMiddleSeriesRef.current.setData(bbData.middle);
            }
            
            chartRef.current.timeScale().fitContent();
        } else {
            // Clear chart if no data
            candleSeriesRef.current.setData([]);
            lineSeriesRef.current.setData([]);
        }
    }, [candleData, activeIndicators]);

    // Handle real-time OHLC morphing within the active candle
    React.useEffect(() => {
        if (!lastCandleUpdate || !candleSeriesRef.current || !lineSeriesRef.current) return;

        const updateData = {
            time: Number(lastCandleUpdate.time) as UTCTimestamp,
            open: Number(lastCandleUpdate.open),
            high: Number(lastCandleUpdate.high),
            low: Number(lastCandleUpdate.low),
            close: Number(lastCandleUpdate.close)
        };

        // lightweight-charts update() morphs the candle if timestamp matches, 
        // or creates a new one if timestamp is greater.
        candleSeriesRef.current.update(updateData);
        lineSeriesRef.current.update({ time: updateData.time, value: updateData.close });
        
        // Instant re-calculation for indicator precision
        if (activeIndicators.length > 0 && candleData.length > 0) {
            const combinedData = [...candleData];
            const existingIdx = combinedData.findIndex(c => Number(c.time) === Number(updateData.time));
            if (existingIdx !== -1) {
                combinedData[existingIdx] = updateData;
            } else {
                combinedData.push(updateData);
            }

            if (emaSeriesRef.current && activeIndicators.includes("Moving Average Exponential")) {
                const emaVal = calculateEMA(combinedData.slice(-30), 20).pop();
                if (emaVal) emaSeriesRef.current.update(emaVal);
            }

            if (activeIndicators.includes("Bollinger Bands") && bbUpperSeriesRef.current && bbLowerSeriesRef.current && bbMiddleSeriesRef.current) {
                const bbData = calculateBollingerBands(combinedData.slice(-30), 20, 2);
                const u = bbData.upper.pop();
                const l = bbData.lower.pop();
                const m = bbData.middle.pop();
                if (u) bbUpperSeriesRef.current.update(u);
                if (l) bbLowerSeriesRef.current.update(l);
                if (m) bbMiddleSeriesRef.current.update(m);
            }
        }
    }, [lastCandleUpdate, activeIndicators, candleData]);

    return (
        <div className="w-full h-full relative flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex h-12 items-center border-b bg-white px-4 justify-between z-50">
                <div className="flex items-center gap-1.5 h-full">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors group">
                                <Search className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                                <span className="text-sm font-bold text-slate-700 tracking-tight">{currentMarket?.name}</span>
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[420px] p-0 shadow-2xl border-border rounded-xl">
                            <div className="p-3 border-b bg-slate-50/50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search assets..." 
                                        className="pl-9 h-9 border-slate-200"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                                <div className="p-2 space-y-0.5">
                                    {filteredIndices.map((market) => {
                                        const res = globalResults[market.id];
                                        const isSelected = selectedMarket === market.id;
                                        return (
                                            <button 
                                                key={market.id}
                                                onClick={() => onMarketChange(market.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-2 rounded-lg transition-all hover:bg-slate-50",
                                                    isSelected ? "bg-slate-100" : "bg-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-left leading-none">
                                                        <p className="text-[11px] font-bold text-slate-800">{market.name}</p>
                                                        <p className="text-[9px] text-slate-400 uppercase mt-0.5">{market.category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] font-bold">{(res?.currentPrice || market.price).toFixed(res?.pip || 2)}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors group">
                                <span className="text-xs font-bold text-slate-700">{selectedInterval}</span>
                                <ChevronDown className="h-3 w-3 text-slate-400" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-4 border-border shadow-2xl rounded-xl">
                            <div className="space-y-4">
                                {['MINUTES', 'HOURS'].map(cat => (
                                    <div key={cat} className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 tracking-widest">{cat}</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {timeIntervals.filter(i => i.category === cat).map(t => (
                                                <button 
                                                    key={t.id}
                                                    onClick={() => onIntervalChange(t.id)}
                                                    className={cn(
                                                        "px-2 py-1.5 rounded text-xs font-bold transition-all border",
                                                        selectedInterval === t.id ? "bg-slate-900 text-white border-slate-900" : "border-slate-100 text-slate-600 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>

                    <button 
                        onClick={() => setChartType(chartType === 'line' ? 'candles' : 'line')}
                        className={cn("p-2 rounded-lg transition-colors hover:bg-slate-50", chartType === 'candles' ? "text-primary" : "text-slate-500")}
                    >
                        {chartType === 'candles' ? <CandlestickChart className="h-4 w-4" /> : <AreaChart className="h-4 w-4" />}
                    </button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500">
                                <FunctionSquare className="h-4 w-4" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0 shadow-2xl border-border rounded-xl overflow-hidden">
                            <div className="p-3 border-b bg-slate-50/50">
                                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-2 uppercase">Indicators</p>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search scripts..." 
                                        className="pl-9 h-9 border-slate-200"
                                        value={indicatorSearch}
                                        onChange={(e) => setIndicatorSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                                <div className="p-1">
                                    {filteredIndicators.map((script) => {
                                        const isActive = activeIndicators.includes(script);
                                        return (
                                            <button 
                                                key={script}
                                                onClick={() => toggleIndicator(script)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors group text-left",
                                                    isActive ? "bg-primary/5" : ""
                                                )}
                                            >
                                                <Star className={cn("h-3.5 w-3.5", isActive ? "text-amber-400 fill-amber-400" : "text-slate-300")} />
                                                <span className={cn("text-[11px] font-bold", isActive ? "text-primary" : "text-slate-700 group-hover:text-primary")}>{script}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-slate-50 rounded transition-colors text-slate-300"><Undo2 className="h-4 w-4" /></button>
                        <button className="p-2 hover:bg-slate-50 rounded transition-colors text-slate-300"><Redo2 className="h-4 w-4" /></button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 hover:bg-slate-50 px-3 py-1 rounded transition-colors text-xs font-bold text-slate-400">Save</button>
                    <div className="w-px h-6 bg-slate-200" />
                    <Camera className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                    <Maximize2 className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-2 border-b bg-white text-[11px] font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", (ohlcDisplay?.diff || 0) >= 0 ? "bg-emerald-500" : "bg-rose-500")} />
                    <span className="flex gap-2">
                        <span className="flex gap-0.5"><span className="text-muted-foreground/60 font-bold">O:</span> {Number(ohlcDisplay?.open || 0).toFixed(decimalPlaces)}</span>
                        <span className="flex gap-0.5"><span className="text-muted-foreground/60 font-bold">H:</span> {Number(ohlcDisplay?.high || 0).toFixed(decimalPlaces)}</span>
                        <span className="flex gap-0.5"><span className="text-muted-foreground/60 font-bold">L:</span> {Number(ohlcDisplay?.low || 0).toFixed(decimalPlaces)}</span>
                        <span className="flex gap-0.5"><span className="text-muted-foreground/60 font-bold">C:</span> {Number(ohlcDisplay?.close || 0).toFixed(decimalPlaces)}</span>
                    </span>
                    <span className={cn("ml-2 font-black tabular-nums", (ohlcDisplay?.diff || 0) >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        {(ohlcDisplay?.diff || 0).toFixed(decimalPlaces)} ({(ohlcDisplay?.perc || 0).toFixed(2)}%)
                    </span>
                </div>
            </div>

            <div ref={chartContainerRef} className="flex-1 w-full relative" />
            
            <DigitStatsOverlay ticks={lastDigitTicks} />
        </div>
    );
}

