
'use client';

import * as React from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface DerivChartProps {
    priceHistory: number[];
    tickTimestamps: number[];
    decimalPlaces: number;
}

export function DerivChart({ priceHistory, tickTimestamps, decimalPlaces }: DerivChartProps) {
    const chartContainerRef = React.useRef<HTMLDivElement>(null);
    const chartRef = React.useRef<IChartApi | null>(null);
    const lineSeriesRef = React.useRef<ISeriesApi<"Area"> | null>(null);

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
            },
            grid: {
                vertLines: { color: 'rgba(148, 163, 184, 0.05)' },
                horzLines: { color: 'rgba(148, 163, 184, 0.05)' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            rightPriceScale: {
                borderColor: 'rgba(148, 163, 184, 0.1)',
                autoScale: true,
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
        });

        chartRef.current = chart;
        lineSeriesRef.current = areaSeries;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [decimalPlaces]);

    React.useEffect(() => {
        if (!lineSeriesRef.current || priceHistory.length === 0 || tickTimestamps.length === 0) return;

        // Lightweight Charts expects data in chronological order
        // We have history in reverse order (newest first)
        const chartData = priceHistory.map((price, index) => ({
            time: (Math.floor(tickTimestamps[index] / 1000)) as UTCTimestamp,
            value: price
        })).reverse();

        // Remove duplicates and ensure unique timestamps (required by the lib)
        const uniqueData = chartData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i);
        
        lineSeriesRef.current.setData(uniqueData);
    }, [priceHistory, tickTimestamps]);

    return (
        <div className="w-full h-full relative group">
            <div ref={chartContainerRef} className="w-full h-full" />
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 shadow-xl">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">LIVE FEED</p>
                    <p className="text-xl font-black text-white tabular-nums">
                        {priceHistory.length > 0 ? priceHistory[0].toFixed(decimalPlaces) : '0.00'}
                    </p>
                </div>
            </div>
        </div>
    );
}
