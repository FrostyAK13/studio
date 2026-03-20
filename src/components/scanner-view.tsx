'use client';
import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { syntheticIndices } from '@/lib/mock-data';
import { MatchesDiffersAnalysis } from './matches-differs-analysis';
import { OverUnderAnalysis } from './over-under-analysis';
import { EvenOddAnalysis } from './even-odd-analysis';
import { RiseFallAnalysis } from './rise-fall-analysis';

interface ScannerViewProps {
    price: number;
    lastDigitTicks: number[];
    priceHistory: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    decimalPlaces: number;
}

export function ScannerView({
    price,
    lastDigitTicks,
    priceHistory,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur,
    selectedMarket,
    onMarketChange,
    decimalPlaces,
}: ScannerViewProps) {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-card border border-white/5 flex items-center justify-center">
                    <Select value={selectedMarket} onValueChange={onMarketChange}>
                      <SelectTrigger className="w-full bg-transparent font-bold text-base sm:text-lg h-full border-0 focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select Index" />
                      </SelectTrigger>
                      <SelectContent side="bottom" position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-xl border-white/10 bg-slate-950 text-white z-[100]">
                        {syntheticIndices.map((index) => (
                          <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-2">
                            {index.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                 <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-card border border-white/5 gap-2 sm:gap-3">
                    <div className="flex justify-between items-center w-full">
                      <Label htmlFor="max-ticks-scanner" className="text-[10px] sm:text-xs text-muted-foreground tracking-widest uppercase font-black">(TICKS)</Label>
                      <Input
                        id="max-ticks-scanner"
                        type="number"
                        min="1"
                        max="5000"
                        value={maxTicks === 0 ? '' : maxTicks}
                        onChange={handleMaxTicksChange}
                        onBlur={handleMaxTicksBlur}
                        className="w-20 sm:w-24 text-right font-black bg-transparent border-none focus-visible:ring-0 text-xl sm:text-2xl h-auto p-0"
                      />
                    </div>
                </div>
                <div className="rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center bg-gradient-to-br from-primary to-chart-2 text-primary-foreground sm:col-span-2 md:col-span-1 shadow-lg">
                    <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase opacity-70">LIVE PRICE</span>
                    <span className="text-2xl sm:text-4xl font-black tabular-nums">{price.toFixed(decimalPlaces)}</span>
                </div>
            </div>

            <div className="space-y-6">
                <OverUnderAnalysis lastDigitTicks={lastDigitTicks} selectedMarket={selectedMarket} price={price} decimalPlaces={decimalPlaces} />
                <EvenOddAnalysis lastDigitTicks={lastDigitTicks} selectedMarket={selectedMarket} price={price} decimalPlaces={decimalPlaces} />
                <MatchesDiffersAnalysis lastDigitTicks={lastDigitTicks} selectedMarket={selectedMarket} price={price} decimalPlaces={decimalPlaces} />
                <RiseFallAnalysis 
                    priceHistory={priceHistory}
                    selectedMarket={selectedMarket}
                    price={price}
                    decimalPlaces={decimalPlaces}
                />
            </div>
        </div>
    )
}
