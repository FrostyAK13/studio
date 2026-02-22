'use client';

import {
  Bitcoin,
  BrainCircuit,
  History,
  Settings,
  Star,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InteractiveChart } from './interactive-chart';
import { DigitAnalyzer } from './digit-analyzer';
import { Watchlist } from './watchlist';
import { HistoricalData } from './historical-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { syntheticIndices } from '@/lib/mock-data';

export function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <Bitcoin className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">DerivInsight Pro</h1>
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:grid md:grid-cols-3 lg:grid-cols-4 lg:gap-6 lg:p-6">
        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-3">
          <Card className="flex-1">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Market Analysis</CardTitle>
                <CardDescription>
                  Real-time price movements for synthetic indices.
                </CardDescription>
              </div>
              <div className="ml-auto">
                <Select defaultValue={syntheticIndices[0].id}>
                  <SelectTrigger className="w-[200px]">
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
            </CardHeader>
            <CardContent>
              <InteractiveChart />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col">
          <Tabs defaultValue="analyzer" className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="analyzer">
                <BrainCircuit className="mr-2 h-4 w-4" />
                Analyzer
              </TabsTrigger>
              <TabsTrigger value="watchlist">
                <Star className="mr-2 h-4 w-4" />
                Watchlist
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="analyzer" className="mt-4">
              <DigitAnalyzer />
            </TabsContent>
            <TabsContent value="watchlist" className="mt-4">
              <Watchlist />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <HistoricalData />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
