'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HackerAnimationProps {
  title: string;
  children: React.ReactNode;
}

export function HackerAnimation({ title, children }: HackerAnimationProps) {
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
          <div className="min-h-[160px] overflow-hidden bg-black p-4 rounded-md text-green-500 text-sm tracking-wider">
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
