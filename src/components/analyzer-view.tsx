'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';

export function AnalyzerView() {
    return (
        <div className="w-full h-[85vh] animate-in fade-in duration-1000 pb-24 max-w-[1600px] mx-auto px-2">
            <Card className="w-full h-full border-none shadow-sm bg-card rounded-[2rem] overflow-hidden border border-primary/10 relative">
                <div className="absolute inset-0 -top-[110px] h-[calc(100%+110px)] w-full">
                    <iframe 
                        src="https://api.binarytool.site/" 
                        className="w-full h-full border-none"
                        title="Analyzer View"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </Card>
        </div>
    );
}
