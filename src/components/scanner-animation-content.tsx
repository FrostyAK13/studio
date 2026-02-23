'use client';
import React, { useState, useEffect } from 'react';

const lines = [
  'INITIALIZING SCANNER V2.1...',
  'CONNECTING TO TICKSTREAM API... OK',
  'LOADING HISTORICAL DATA... 1000 TICKS LOADED',
  'ANALYZING MARKET PATTERNS...',
  '$MS$OCHNKZARRIOVCBD@FKEIQ52D%X0T*X4JQ0Q',
  '#VV#W1I!^!OI7J5D4S8%RMNX6!QSVDNH%H!IWUYU',
  'DETECTING ANOMALIES IN TICK STREAM...',
  '*M%EWW4TUKF&LHI0U)U$04!$7*GOPT96W1#*(7M9',
  'FBOUJ#A@APR0F2SWOUSZOTU75LI5X1SD^8AIJGMQ',
  'CALCULATING PROBABILITY VECTORS...',
  'VM05XY6NQCM@1NP9192N&JA04ZPG@K6D@*$&XY@@',
  'N6#BK%*COG7H^Q7^)GPPZ%M9S&E^ICSAX7WGX(EJ',
  'CROSS-REFERENCING STRATEGY MATRIX...',
  '9EDUFOO6RWB9OXL4F%%GK3SB$O6H%9Y&^@PU50EF',
  'WOHFSO161AS^!$G#8F&QO@Q))QE1MB*3QTQ^!TE@',
  'FINALIZING PREDICTION...',
];

export function ScannerAnimationContent() {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    setVisibleLines([]); 
    let lineIndex = 0;
    
    const interval = setInterval(() => {
      if (lineIndex < lines.length) {
        setVisibleLines(prev => [...prev, lines[lineIndex]]);
        lineIndex++;
      } else {
        lineIndex = 0;
        setVisibleLines([]);
      }
    }, 150); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-left break-words text-xs">
        <div className="space-y-1">
            {visibleLines.map((line, index) => (
                <p key={index}>{line}</p>
            ))}
        </div>
        <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1 mt-1"></span>
    </div>
  );
}
