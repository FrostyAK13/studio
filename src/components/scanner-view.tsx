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

interface ScannerViewProps {
    price: number;
    lastDigitTicks: number[];
    maxTicks: number;
    handleMaxTicksChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMaxTicksBlur: () => void;
}

export function ScannerView({
    price,
    lastDigitTicks,
    maxTicks,
    handleMaxTicksChange,
    handleMaxTicksBlur
}: ScannerViewProps) {
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-card flex items-center justify-center">
                    <Select defaultValue={syntheticIndices[0].id}>
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
                <div className="rounded-lg p-4 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-primary-foreground">
                    <span className="text-sm tracking-widest">PRICE</span>
                    <span className="text-4xl font-bold">{price.toFixed(2)}</span>
                </div>
            </div>

            <EvenOddAnalysis lastDigitTicks={lastDigitTicks} />
            <div className="my-6" />
            <MatchesDiffersAnalysis lastDigitTicks={lastDigitTicks} />
            <div className="my-6" />
            <OverUnderAnalysis lastDigitTicks={lastDigitTicks} />
        </>
    )
}
