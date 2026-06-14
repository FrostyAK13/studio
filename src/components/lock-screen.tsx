'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LockScreenProps {
    onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState(false);

    const handleAccess = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'FROSTY') {
            onUnlock();
        } else {
            setError(true);
            setTimeout(() => setError(false), 500);
            setPassword('');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-100/40 dark:bg-slate-900/60 backdrop-blur-3xl p-4 sm:p-6"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={cn("w-full max-w-[440px]", error && "animate-bounce")}
            >
                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 sm:p-12 space-y-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
                                <Lock className="h-8 w-8 text-white fill-current" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Signals Center Access</h2>
                                <p className="text-[11px] sm:text-[12px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">This section requires premium access credentials</p>
                            </div>
                        </div>

                        <form onSubmit={handleAccess} className="space-y-6">
                            <div className="relative">
                                <Input
                                    type="password"
                                    placeholder="Enter access password..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-14 sm:h-16 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-base font-medium placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-center"
                                />
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute -bottom-6 left-0 w-full"
                                    >
                                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Access Denied // Invalid Key</p>
                                    </motion.div>
                                )}
                            </div>

                            <Button 
                                type="submit"
                                className="w-full h-14 sm:h-16 bg-[#63a2b1] hover:bg-[#528d9a] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-[#63a2b1]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Lock className="h-4 w-4" /> Access
                            </Button>
                        </form>

                        <div className="flex flex-col items-center gap-2 pt-4">
                            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                <Lightbulb className="h-3 w-3 text-amber-400" /> Contact Support for premium access
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
