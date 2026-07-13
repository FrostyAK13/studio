'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';

export function AnalyzerView() {
    return (
        <div className="w-full h-[85vh] animate-in fade-in duration-1000 pb-24 max-w-[1600px] mx-auto px-2 relative group">
            <Card className="w-full h-full border-none shadow-sm bg-card rounded-[2rem] overflow-hidden border border-primary/10 relative">
                {/* Tactical Branding Crop & Dark Mode Filter */}
                <div className="absolute inset-0 -top-[110px] h-[calc(100%+160px)] w-full">
                    <iframe 
                        src="https://api.binarytool.site/" 
                        className="w-full h-full border-none scale-[1.01] transition-all duration-700 dark:invert dark:hue-rotate-180 dark:brightness-[0.8] dark:contrast-[1.2]"
                        title="Analyzer View"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>

                {/* Tactical Watermark Masking Layer */}
                <div className="absolute bottom-0 right-0 w-full h-12 bg-card z-[110] pointer-events-none transition-colors duration-500" />
                <div className="absolute bottom-4 right-4 w-48 h-10 bg-card/90 backdrop-blur-sm z-[120] rounded-xl border border-primary/5 shadow-sm pointer-events-none flex items-center justify-center">
                    <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.3em]">System Active</span>
                </div>
            </Card>
        </div>
    );
}
