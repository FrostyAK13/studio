'use client';

import * as React from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { AreaChart, BarChart3, Settings2, X, TrendingUp, CandlestickChart, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DerivChartProps {
    priceHistory: number[];
    tickTimestamps: number[];
    decimalPlaces: number;
}

type ChartType = 'line' | 'candles' | 'hollow' | 'ohlc';

const timeIntervals = [
    { label: '1 tick', id: '1t' },
    { label: '1 minute', id: '1m', disabled: true },
    { label: '2 minutes', id: '2m', disabled: true },
    { label: '3 minutes', id: '3m', disabled: true },
    { label: '5 minutes', id: '5m', disabled: true },
    { label: '10 minutes', id: '10m', disabled: true },
    { label: '15 minutes', id: '15m', disabled: true },
    { label: '30 minutes', id: '30m', disabled: true },
    { label: '1 hour', id: '1h', disabled: true },
    { label: '2 hours', id: '2h', disabled: true },
    { label: '4 hours', id: '4h', disabled: true },
    { label: '8 hours', id: '8h', disabled: true },
    { label: '1 day', id: '1d', disabled: true },
];

export function DerivChart({ priceHistory, tickTimestamps, decimalPlaces }: DerivChartProps) {
    const chartContainerRef = React.useRef<HTMLDivElement>(null);
    const chartRef = React.useRef<IChartApi | null>(null);
    const lineSeriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);
    const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
    const [chartType, setChartType] = React.useState<ChartType>('line');
    const [selectedInterval, setSelectedInterval] = React.useState('1t');

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
        if (!lineSeriesRef.current || !candleSeriesRef.current || priceHistory.length === 0 || tickTimestamps.length === 0) return;

        const lineData = priceHistory.map((price, index) => ({
            time: (Math.floor(tickTimestamps[index] / 1000)) as UTCTimestamp,
            value: price
        })).reverse();

        const uniqueLineData = lineData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
        lineSeriesRef.current.setData(uniqueLineData);

        const candleData = [];
        const reversedPrices = [...priceHistory].reverse();
        const reversedTimes = [...tickTimestamps].reverse();
        const windowSize = 5;

        for (let i = 0; i < reversedPrices.length; i += windowSize) {
            const window = reversedPrices.slice(i, i + windowSize);
            if (window.length === 0) continue;
            
            candleData.push({
                time: (Math.floor(reversedTimes[i] / 1000)) as UTCTimestamp,
                open: window[0],
                high: Math.max(...window),
                low: Math.min(...window),
                close: window[window.length - 1],
            });
        }
        
        const uniqueCandleData = candleData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
        candleSeriesRef.current.setData(uniqueCandleData);

    }, [priceHistory, tickTimestamps]);

    return (
        <div className="w-full h-full relative group bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute top-4 left-4 z-[50] flex flex-col gap-3 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 shadow-2xl pointer-events-auto flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-5 bg-card border-border shadow-2xl rounded-2xl">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Chart types</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        <button 
                                            onClick={() => setChartType('line')}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
                                                chartType === 'line' ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <AreaChart className="h-4 w-4" />
                                            <span className="text-[8px] font-black uppercase">Area</span>
                                        </button>
                                        <button 
                                            onClick={() => setChartType('candles')}
                                            className={cn(
                                                "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
                                                chartType === 'candles' ? "bg-primary/10 border-primary text-primary" : "border-transparent text-muted-foreground hover:bg-muted"
                                            )}
                                        >
                                            <CandlestickChart className="h-4 w-4" />
                                            <span className="text-[8px] font-black uppercase">Candle</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-transparent text-muted-foreground/30 cursor-not-allowed">
                                            <Activity className="h-4 w-4" />
                                            <span className="text-[8px] font-black uppercase">Hollow</span>
                                        </button>
                                        <button className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-transparent text-muted-foreground/30 cursor-not-allowed">
                                            <TrendingUp className="h-4 w-4" />
                                            <span className="text-[8px] font-black uppercase">OHLC</span>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Time interval</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {timeIntervals.map((t) => (
                                            <button 
                                                key={t.id}
                                                disabled={t.disabled}
                                                onClick={() => setSelectedInterval(t.id)}
                                                className={cn(
                                                    "px-2 py-1.5 rounded-md text-[9px] font-black uppercase border transition-all",
                                                    selectedInterval === t.id && !t.disabled ? "bg-primary text-white border-primary" : 
                                                    t.disabled ? "opacity-20 border-transparent cursor-not-allowed" : "border-border text-muted-foreground hover:bg-muted"
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

                    <div className="w-px h-4 bg-white/10" />
                    
                    <div>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">LIVE FEED</p>
                        <p className="text-lg font-black text-white tabular-nums mt-1">
                            {priceHistory.length > 0 ? priceHistory[0].toFixed(decimalPlaces) : '0.00'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="absolute top-4 right-4 z-[50] pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 shadow-lg">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{selectedInterval === '1t' ? '1 TICK' : 'TIME'}</span>
                </div>
            </div>

            <div ref={chartContainerRef} className="w-full h-full" />
        </div>
    );
}
