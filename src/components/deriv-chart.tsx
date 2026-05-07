'use client';

import * as React from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { AreaChart, Settings2, CandlestickChart, Activity, Info, Triangle, ChevronDown, Search, TrendingUp, TrendingDown } from 'lucide-react';
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
    selectedMarket: string;
    onMarketChange: (marketId: string) => void;
    globalResults: Record<string, GlobalAnalysisResult>;
}

const timeIntervals = [
    { label: '1 tick', id: '1t' },
    { label: '1 minute', id: '1m' },
    { label: '2 minutes', id: '2m' },
    { label: '3 minutes', id: '3m' },
    { label: '5 minutes', id: '5m' },
    { label: '10 minutes', id: '10m' },
    { label: '15 minutes', id: '15m' },
    { label: '30 minutes', id: '30m' },
    { label: '1 hour', id: '1h' },
    { label: '2 hours', id: '2h' },
    { label: '4 hours', id: '4h' },
    { label: '8 hours', id: '8h' },
    { label: '1 day', id: '1d' },
];

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
        <div className="absolute bottom-12 left-0 w-full flex justify-center pointer-events-none z-[60]">
            <div className="flex gap-1.5 sm:gap-4 p-2 sm:p-4 bg-background/20 backdrop-blur-md rounded-2xl border border-white/5 pointer-events-auto items-end">
                {stats.map((s) => {
                    const radius = 18;
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
                                        stroke={s.isMax ? "#2dd4bf" : s.isMin ? "#f43f5e" : "#94a3b8"} 
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
                                        className="text-orange-500"
                                    >
                                        <Triangle className="w-2 h-2 sm:w-3 sm:h-3 fill-current rotate-180" />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <button className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors ml-2 mb-4">
                    <Info className="h-3 w-3 text-white/40" />
                </button>
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
    selectedMarket,
    onMarketChange,
    globalResults
}: DerivChartProps) {
    const chartContainerRef = React.useRef<HTMLDivElement>(null);
    const chartRef = React.useRef<IChartApi | null>(null);
    const lineSeriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);
    const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
    const [chartType, setChartType] = React.useState<'line' | 'candles'>('line');
    const [searchQuery, setSearchQuery] = React.useState('');

    const currentMarket = syntheticIndices.find(m => m.id === selectedMarket);
    const filteredIndices = syntheticIndices.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#94a3b8',
                fontSize: 10,
                fontFamily: 'Poppins',
            },
            grid: {
                vertLines: { color: 'rgba(148, 163, 184, 0.03)' },
                horzLines: { color: 'rgba(148, 163, 184, 0.03)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            rightPriceScale: {
                borderColor: 'rgba(148, 163, 184, 0.1)',
                autoScale: true,
                alignLabels: true,
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.3, 
                },
            },
            timeScale: {
                borderColor: 'rgba(148, 163, 184, 0.1)',
                timeVisible: true,
                secondsVisible: true,
            },
            crosshair: {
                vertLine: {
                    color: '#2dd4bf',
                    width: 1,
                    style: 1,
                    labelBackgroundColor: '#2dd4bf',
                },
                horzLine: {
                    color: '#2dd4bf',
                    width: 1,
                    style: 1,
                    labelBackgroundColor: '#2dd4bf',
                },
            },
            handleScroll: true,
            handleScale: true,
        });

        const areaSeries = chart.addAreaSeries({
            lineColor: '#2dd4bf',
            topColor: 'rgba(45, 212, 191, 0.3)',
            bottomColor: 'rgba(45, 212, 191, 0)',
            lineWidth: 2,
            priceFormat: {
                type: 'price',
                precision: decimalPlaces,
                minMove: 1 / Math.pow(10, decimalPlaces),
            },
            visible: chartType === 'line',
        });

        const candlestickSeries = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#f43f5e',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#f43f5e',
            priceFormat: {
                type: 'price',
                precision: decimalPlaces,
                minMove: 1 / Math.pow(10, decimalPlaces),
            },
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
    }, [decimalPlaces]);

    React.useEffect(() => {
        if (lineSeriesRef.current) lineSeriesRef.current.applyOptions({ visible: chartType === 'line' });
        if (candleSeriesRef.current) candleSeriesRef.current.applyOptions({ visible: chartType === 'candles' });
    }, [chartType]);

    React.useEffect(() => {
        if (!lineSeriesRef.current || !candleSeriesRef.current) return;

        if (selectedInterval === '1t') {
            const lineData = priceHistory.map((price, index) => ({
                time: (Math.floor(tickTimestamps[index] / 1000)) as UTCTimestamp,
                value: Number(price)
            })).reverse();
            const uniqueLineData = lineData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
            lineSeriesRef.current.setData(uniqueLineData);

            const tempCandles = [];
            const windowSize = 5;
            const reversedPrices = [...priceHistory].reverse();
            const reversedTimes = [...tickTimestamps].reverse();
            for (let i = 0; i < reversedPrices.length; i += windowSize) {
                const window = reversedPrices.slice(i, i + windowSize);
                if (window.length === 0) continue;
                tempCandles.push({
                    time: (Math.floor(reversedTimes[i] / 1000)) as UTCTimestamp,
                    open: Number(window[0]),
                    high: Number(Math.max(...window)),
                    low: Number(Math.min(...window)),
                    close: Number(window[window.length - 1]),
                });
            }
            candleSeriesRef.current.setData(tempCandles.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i));
        } else {
            if (candleData && candleData.length > 0) {
                const sanitizedCandleData = candleData.map(c => ({
                    time: Number(c.time) as UTCTimestamp,
                    open: Number(c.open),
                    high: Number(c.high),
                    low: Number(c.low),
                    close: Number(c.close)
                }));
                candleSeriesRef.current.setData(sanitizedCandleData);
                const candleLine = sanitizedCandleData.map(c => ({ time: c.time, value: c.close }));
                lineSeriesRef.current.setData(candleLine);
            }
        }
    }, [priceHistory, tickTimestamps, candleData, selectedInterval]);

    return (
        <div className="w-full h-full relative group bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 z-[50] flex flex-col gap-3 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 shadow-2xl pointer-events-auto flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-lg border border-white/10 transition-all active:scale-95 group">
                                <Activity className="h-4 w-4 text-emerald-400" />
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-white/60 uppercase leading-none tracking-widest">{currentMarket?.name}</p>
                                    <p className="text-sm font-black text-white tabular-nums mt-0.5">
                                        {priceHistory.length > 0 ? (Number(priceHistory[0]) || 0).toFixed(decimalPlaces) : '0.00'}
                                    </p>
                                </div>
                                <ChevronDown className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] md:w-[420px] p-0 bg-card border-border shadow-2xl rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search assets..." 
                                        className="pl-10 h-10 bg-card border-border rounded-xl font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                                <div className="px-2 py-3 space-y-1">
                                    {filteredIndices.map((market) => {
                                        const res = globalResults[market.id];
                                        const marketPrice = res?.currentPrice || market.price;
                                        const isSelected = selectedMarket === market.id;
                                        
                                        return (
                                            <button 
                                                key={market.id}
                                                onClick={() => onMarketChange(market.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-2.5 rounded-xl transition-all hover:bg-primary/5 group",
                                                    isSelected ? "bg-primary/10" : "bg-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        <Activity className="h-4 w-4" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={cn("text-[11px] font-black uppercase tracking-wider", isSelected ? "text-primary" : "text-foreground")}>{market.name}</p>
                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{market.category}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] font-black tabular-nums text-foreground">{(Number(marketPrice) || 0).toFixed(res?.pip || 2)}</p>
                                                    <div className={cn(
                                                        "flex items-center justify-end gap-1 text-[9px] font-black mt-0.5",
                                                        market.change >= 0 ? "text-emerald-500" : "text-rose-500"
                                                    )}>
                                                        {market.change >= 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                                        {Math.abs(market.change).toFixed(2)}%
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-white/10" />

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-5 bg-card border-border shadow-2xl rounded-2xl">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Chart types</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => setChartType('line')}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                                                chartType === 'line' ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <AreaChart className="h-5 w-5" />
                                            <span className="text-[10px] font-black uppercase">Area</span>
                                        </button>
                                        <button 
                                            onClick={() => setChartType('candles')}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                                                chartType === 'candles' ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <CandlestickChart className="h-5 w-5" />
                                            <span className="text-[10px] font-black uppercase">Candle</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Time interval</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {timeIntervals.map((t) => (
                                            <button 
                                                key={t.id}
                                                onClick={() => onIntervalChange(t.id)}
                                                className={cn(
                                                    "px-2 py-2 rounded-lg text-[9px] font-black uppercase border transition-all",
                                                    selectedInterval === t.id ? "bg-primary text-white border-primary shadow-lg scale-105" : "border-border text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-[50] pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 shadow-lg">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                        {timeIntervals.find(i => i.id === selectedInterval)?.label.toUpperCase()}
                    </span>
                </div>
            </div>

            <div ref={chartContainerRef} className="w-full h-full" />
            
            <DigitStatsOverlay ticks={lastDigitTicks} />
        </div>
    );
}
