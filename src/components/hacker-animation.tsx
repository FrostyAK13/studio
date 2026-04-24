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
      <Card className="w-full bg-slate-50 border-slate-200 font-mono shadow-sm">
        <CardHeader className="py-4 border-b border-slate-200">
          <CardTitle className="text-sm font-black text-emerald-600 uppercase tracking-widest">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="min-h-[160px] overflow-hidden bg-slate-50 p-6 rounded-b-lg text-emerald-700 text-sm tracking-wider">
            {children}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
