'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HackerAnimationProps {
  title: string;
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

const generateRandomLine = (length: number) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function HackerAnimation({ title }: HackerAnimationProps) {
  const [lines, setLines] = useState<string[]>([]);
  const lineCount = 10;
  const lineLength = 60;

  useEffect(() => {
    const interval = setInterval(() => {
      setLines(Array.from({ length: lineCount }, () => generateRandomLine(lineLength)));
    }, 80);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6"
    >
        <Card className="w-full bg-black border-green-500/30 font-mono">
            <CardHeader>
                <CardTitle className="text-lg text-green-400">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-40 overflow-hidden bg-black p-2 rounded-md text-green-500 text-xs tracking-wider">
                    {lines.map((line, index) => (
                        <p key={index} className="whitespace-nowrap">
                        {line}
                        </p>
                    ))}
                </div>
            </CardContent>
        </Card>
    </motion.div>
  );
}
