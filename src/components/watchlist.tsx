'use client';

import * as React from 'react';
import { PlusCircle, Star, TrendingDown, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { syntheticIndices, type SyntheticIndex } from '@/lib/mock-data';
import { Separator } from './ui/separator';

export function Watchlist() {
  const [watchlist, setWatchlist] = React.useState<SyntheticIndex[]>(
    syntheticIndices.slice(0, 4)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Watchlist</CardTitle>
        <CardDescription>Your favorite indices at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {watchlist.map((item, index) => (
          <React.Fragment key={item.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p
                  className={`flex items-center gap-1 font-medium ${
                    item.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {item.change >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                  {item.change.toFixed(2)}%
                </p>
                <Button variant="ghost" size="icon" className="h-7 w-7 mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400"/>
                </Button>
              </div>
            </div>
            {index < watchlist.length - 1 && <Separator />}
          </React.Fragment>
        ))}
         <Button variant="outline" className="w-full mt-4">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add to Watchlist
        </Button>
      </CardContent>
    </Card>
  );
}
