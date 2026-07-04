'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';

export function GlobalScanView() {
    return (
        <div className="w-full h-[85vh] animate-in fade-in duration-1000 pb-24 max-w-[1600px] mx-auto px-2">
            <Card className="w-full h-full border-none shadow-sm bg-card rounded-[2rem] overflow-hidden border border-primary/10">
                <iframe 
                    src="https://tracktool.netlify.app/signals.html" 
                    className="w-full h-full border-none"
                    title="Global Scanner"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </Card>
        </div>
    );
}
