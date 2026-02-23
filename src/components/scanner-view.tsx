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
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-card flex items-center justify-center">
                    <Select value={selectedMarket} onValueChange={onMarketChange}>
                      <SelectTrigger className="w-full bg-transparent font-semibold text-lg h-full border-0 focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Select Index" />
                      </SelectTrigger>
                      <SelectContent>
                        {syntheticIndices.map((index) => (
                          <SelectItem key={index.id} value={index.id}>
                            {index.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>
                 <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-card gap-3">
                    <div className="flex justify-between items-center w-full">
                      <Label htmlFor="max-ticks-scanner" className="text-sm text-muted-foreground tracking-widest">TICKS</Label>
                      <Input
                        id="max-ticks-scanner"
                        type="number"
                        min="10"
                        max="5000"
                        value={maxTicks === 0 ? '' : maxTicks}
                        onChange={handleMaxTicksChange}
                        onBlur={handleMaxTicksBlur}
                        className="w-24 text-right font-bold bg-card border-input focus:ring-ring text-2xl h-auto p-1 rounded-md"
                      />
                    </div>
                </div>
                <div className="rounded-lg p-4 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
                    <span className="text-sm tracking-widest">PRICE</span>
                    <span className="text-4xl font-bold">{price.toFixed(decimalPlaces)}</span>
                </div>
            </div>

            <OverUnderAnalysis lastDigitTicks={lastDigitTicks} selectedMarket={selectedMarket} price={price} decimalPlaces={decimalPlaces} />
            <div className="my-6" />
            <EvenOddAnalysis lastDigitTicks={lastDigitTicks} selectedMarket={selectedMarket} price={price} decimalPlaces={decimalPlaces} />
            <div className="my-6" />
            <MatchesDiffersAnalysis lastDigitTicks={lastDigitTicks} selectedMarket={selectedMarket} price={price} decimalPlaces={decimalPlaces} />
            <div className="my-6" />
            <RiseFallAnalysis 
                priceHistory={priceHistory}
                selectedMarket={selectedMarket}
                price={price}
                decimalPlaces={decimalPlaces}
            />
        </>
    )
}
