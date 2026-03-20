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
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

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
        <div className="space-y-6 sm:space-y-8">
            <Card className="border-none shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-slate-900/40 backdrop-blur-[50px] overflow-hidden relative rounded-[3rem]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardContent className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 items-end">
                    <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">MARKET VECTOR SELECT</Label>
                        <Select value={selectedMarket} onValueChange={onMarketChange}>
                            <SelectTrigger className="h-16 bg-black/40 border-white/10 rounded-[1.5rem] font-black text-lg shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] px-8">
                                <SelectValue placeholder="Select Index" />
                            </SelectTrigger>
                            <SelectContent side="bottom" position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] max-h-[400px] rounded-[1.5rem] border-white/10 bg-slate-950 text-white z-[100]">
                                {syntheticIndices.map((index) => (
                                <SelectItem key={index.id} value={index.id} className="focus:bg-primary/20 focus:text-white cursor-pointer py-3">
                                    {index.name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-4">
                        <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">DATA HORIZON (TICKS)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="1"
                                max="5000"
                                value={maxTicks === 0 ? '' : maxTicks}
                                onChange={handleMaxTicksChange}
                                onBlur={handleMaxTicksBlur}
                                className="h-16 bg-black/40 border-white/10 rounded-[1.5rem] font-black text-3xl text-primary text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] focus:ring-primary/50 transition-all"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><Activity size={24} /></div>
                        </div>
                    </div>
                    <div className="space-y-4">
                         <Label className="text-[12px] font-black uppercase tracking-[0.5em] text-primary ml-2">LIVE PIVOT PRICE</Label>
                        <div className="h-16 bg-gradient-to-br from-primary to-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-lg px-8">
                             <span className="text-3xl font-black tabular-nums text-white drop-shadow-md">{price.toFixed(decimalPlaces)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-8">
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
