'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { historicalData } from '@/lib/mock-data';
import { Badge } from './ui/badge';

export function HistoricalData() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Historical Data</CardTitle>
            <CardDescription>Review past market performance.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-card">
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Close</TableHead>
                        <TableHead className="text-right">High</TableHead>
                        <TableHead className="text-right">Low</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {historicalData.map((data) => (
                        <TableRow key={data.date}>
                            <TableCell className="font-medium">{data.date}</TableCell>
                            <TableCell className="text-right">
                                <Badge variant={data.close > data.open ? "secondary" : "destructive"}>
                                    {data.close.toFixed(2)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right text-green-400">{data.high.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-red-400">{data.low.toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}
