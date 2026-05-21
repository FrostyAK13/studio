'use client';

import * as React from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { AreaChart, CandlestickChart, Triangle, ChevronDown, Search, Maximize2, Camera } from 'lucide-react';
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

const granularityMap: Record<string, number> = {
    '1m': 60, '2m': 120, '3m': 180, '5m': 300, 
    '10m': 600, '15m': 900, '30m': 1800, '1h': 3600,
    '2h': 7200, '4h': 14400, '8h': 28800, '1d': 86400
};

const formatCountdown = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
            <div className="flex gap-2 sm:gap-4 p-3 bg-card/90 backdrop-blur-md rounded-2xl border border-primary/20 shadow-2xl pointer-events-auto items-end">
                {stats.map((s) => {
                    const radius = 16;
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (s.percentage / 40) * circumference; 
                    
                    return (
                        <div key={s.digit} className="flex flex-col items-center relative group">
                            <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle 
                                        cx="50%" cy="50%" r={radius} 
                                        stroke="currentColor" strokeWidth="2" 
                                        fill="transparent" className="text-muted/30" 
                                    />
                                    <circle 
                                        cx="50%" cy="50%" r={radius} 
                                        stroke={s.isMax ? "#00a69c" : s.isMin ? "#ff444f" : "hsl(var(--primary))"} 
                                        strokeWidth="3" fill="transparent" 
                                        strokeDasharray={circumference}
                                        strokeDashoffset={Math.max(0, offset)}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="flex flex-col items-center justify-center z-10 leading-none">
                                    <span className="text-xs sm:text-base font-black text-foreground">{s.digit}</span>
                                    <span className="text-[6px] sm:text-[8px] font-bold text-muted-foreground">{s.percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="h-4 flex items-center justify-center relative">
                                {s.isLast && (
                                    <motion.div 
                                        initial={{ scale: 0 }} 
                                        animate={{ scale: 1 }} 
                                        className="text-[#C5A059]"
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
    
    const [chartType, setChartType] = React.useState<'line' | 'candles'>('candles');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [countdown, setCountdown] = React.useState<string>("");

    const currentMarket = syntheticIndices.find(m => m.id === selectedMarket);
    const filteredIndices = syntheticIndices.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

    React.useEffect(() => {
        if (!ohlcDisplay || !selectedInterval) return;
        
        const granularity = granularityMap[selectedInterval] || 60;
        const openTime = Number(ohlcDisplay.time);
        const endTime = openTime + granularity;

        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = endTime - now;
            setCountdown(formatCountdown(remaining));
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [ohlcDisplay?.time, selectedInterval]);

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
                background: { type: ColorType.Solid, color: '#FDFCF0' }, 
                textColor: '#C5A059',
                fontSize: 11,
                fontFamily: 'Poppins',
            },
            grid: {
                vertLines: { color: 'rgba(197, 160, 89, 0.1)' },
                horzLines: { color: 'rgba(197, 160, 89, 0.1)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            rightPriceScale: {
                borderColor: 'rgba(197, 160, 89, 0.2)',
                autoScale: true,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.35, 
                },
            },
            timeScale: {
                borderColor: 'rgba(197, 160, 89, 0.2)',
                timeVisible: true,
                secondsVisible: true,
                shiftVisibleRangeOnNewBar: true,
            },
            crosshair: {
                vertLine: { color: '#C5A059', width: 1, style: 1 },
                horzLine: { color: '#C5A059', width: 1, style: 1 },
            },
        });

        const areaSeries = chart.addAreaSeries({
            lineColor: '#C5A059',
            topColor: 'rgba(197, 160, 89, 0.2)',
            bottomColor: 'rgba(197, 160, 89, 0)',
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

        chartRef.current = chart;
        lineSeriesRef.current = areaSeries;
        candleSeriesRef.current = candlestickSeries;

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [decimalPlaces, chartType]);

    React.useEffect(() => {
        if (!lineSeriesRef.current || !candleSeriesRef.current || !chartRef.current) return;

        if (candleData && candleData.length > 0) {
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
            
            if (uniqueData.length < 500) {
                chartRef.current.timeScale().fitContent();
            } else {
                chartRef.current.timeScale().scrollToRealTime();
            }
        }
    }, [candleData]);

    React.useEffect(() => {
        if (!lastCandleUpdate || !candleSeriesRef.current || !lineSeriesRef.current) return;

        const updateData = {
            time: Number(lastCandleUpdate.time) as UTCTimestamp,
            open: Number(lastCandleUpdate.open),
            high: Number(lastCandleUpdate.high),
            low: Number(lastCandleUpdate.low),
            close: Number(lastCandleUpdate.close)
        };

        candleSeriesRef.current.update(updateData);
        lineSeriesRef.current.update({ time: updateData.time, value: updateData.close });
    }, [lastCandleUpdate]);

    return (
        <div className="w-full h-full relative flex flex-col bg-background border border-primary/20 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex h-12 items-center border-b border-primary/10 bg-card px-4 justify-between z-50">
                <div className="flex items-center gap-1.5 h-full">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 hover:bg-muted px-3 py-1.5 rounded-lg transition-colors group">
                                <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                <span className="text-sm font-bold text-foreground tracking-tight">{currentMarket?.name}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[420px] p-0 shadow-2xl border-primary/10 rounded-xl bg-card">
                            <div className="p-3 border-b border-primary/5 bg-muted/30">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search assets..." 
                                        className="pl-9 h-9 border-primary/10 bg-card"
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
                                                    "w-full flex items-center justify-between p-2 rounded-lg transition-all hover:bg-primary/5",
                                                    isSelected ? "bg-primary/10" : "bg-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-left leading-none">
                                                        <p className="text-[11px] font-bold text-foreground">{market.name}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase mt-0.5">{market.category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] font-bold text-foreground">{(res?.currentPrice || market.price).toFixed(res?.pip || 2)}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-primary/10 mx-1" />

                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-1.5 hover:bg-muted px-3 py-1.5 rounded-lg transition-colors group">
                                <span className="text-xs font-bold text-foreground">{selectedInterval}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-4 border-primary/10 shadow-2xl rounded-xl bg-card">
                            <div className="space-y-4">
                                {['MINUTES', 'HOURS'].map(cat => (
                                    <div key={cat} className="space-y-2">
                                        <p className="text-[10px] font-black text-muted-foreground tracking-widest">{cat}</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {timeIntervals.filter(i => i.category === cat).map(t => (
                                                <button 
                                                    key={t.id}
                                                    onClick={() => onIntervalChange(t.id)}
                                                    className={cn(
                                                        "px-2 py-1.5 rounded text-xs font-bold transition-all border",
                                                        selectedInterval === t.id ? "bg-primary text-white border-primary" : "border-primary/10 text-muted-foreground hover:bg-muted"
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
                        className={cn("p-2 rounded-lg transition-colors hover:bg-muted", chartType === 'candles' ? "text-primary" : "text-muted-foreground")}
                    >
                        {chartType === 'candles' ? <CandlestickChart className="h-4 w-4" /> : <AreaChart className="h-4 w-4" />}
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 hover:bg-muted px-3 py-1 rounded transition-colors text-xs font-bold text-muted-foreground">Save</button>
                    <div className="w-px h-6 bg-primary/10" />
                    <Camera className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
                    <Maximize2 className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
                </div>
            </div>

            <div className="flex items-center gap-4 px-4 py-2 border-b border-primary/5 bg-card text-[11px] font-medium text-muted-foreground">
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

            {countdown && (
                <div className="absolute top-24 right-4 z-[70] bg-primary text-white px-2.5 py-1 rounded-md text-[10px] font-black shadow-2xl border border-white/20 tabular-nums">
                    {countdown}
                </div>
            )}
            
            <DigitStatsOverlay ticks={lastDigitTicks} />
        </div>
    );
}
