
'use client';

import * as React from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp, SeriesMarker } from 'lightweight-charts';
import { Button } from '@/components/ui/button';
import { AreaChart, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DerivChartProps {
    priceHistory: number[];
    tickTimestamps: number[];
    decimalPlaces: number;
}

type ChartType = 'line' | 'candles';

export function DerivChart({ priceHistory, tickTimestamps, decimalPlaces }: DerivChartProps) {
    const chartContainerRef = React.useRef<HTMLDivElement>(null);
    const chartRef = React.useRef<IChartApi | null>(null);
    const lineSeriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);
    const candleSeriesRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
    const [chartType, setChartType] = React.useState<ChartType>('line');

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

    // Handle switching visibility
    React.useEffect(() => {
        if (lineSeriesRef.current) lineSeriesRef.current.applyOptions({ visible: chartType === 'line' });
        if (candleSeriesRef.current) candleSeriesRef.current.applyOptions({ visible: chartType === 'candles' });
    }, [chartType]);

    React.useEffect(() => {
        if (!lineSeriesRef.current || !candleSeriesRef.current || priceHistory.length === 0 || tickTimestamps.length === 0) return;

        // Line Data
        const lineData = priceHistory.map((price, index) => ({
            time: (Math.floor(tickTimestamps[index] / 1000)) as UTCTimestamp,
            value: price
        })).reverse();

        // Unique check for time scale
        const uniqueLineData = lineData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
        lineSeriesRef.current.setData(uniqueLineData);

        // Candle Data Generation (Aggregate ticks into simulated candles for the "Deriv Look")
        // We use a window of 5 ticks to create 1 candle to maintain the high-frequency feel
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
            {/* Chart Control Header */}
            <div className="absolute top-4 left-4 z-[50] flex flex-col gap-3 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5 shadow-xl pointer-events-auto flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setChartType('line')}
                            className={cn(
                                "h-8 w-8 rounded-lg transition-all",
                                chartType === 'line' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <AreaChart className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setChartType('candles')}
                            className={cn(
                                "h-8 w-8 rounded-lg transition-all",
                                chartType === 'candles' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            <BarChart3 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <div>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">LIVE FEED</p>
                        <p className="text-lg font-black text-white tabular-nums mt-1">
                            {priceHistory.length > 0 ? priceHistory[0].toFixed(decimalPlaces) : '0.00'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeframe indicator */}
            <div className="absolute top-4 right-4 z-[50] pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 shadow-lg">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">TICKS (1S)</span>
                </div>
            </div>

            <div ref={chartContainerRef} className="w-full h-full" />
        </div>
    );
}
