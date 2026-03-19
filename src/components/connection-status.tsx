'use client';

import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  status: 'connecting' | 'streaming' | 'disconnected';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const statusConfig = {
    connecting: {
      text: 'Connecting...',
      colorClass: 'bg-amber-500',
      shadowClass: 'shadow-amber-500/50',
    },
    streaming: {
      text: 'Streaming',
      colorClass: 'bg-emerald-500',
      shadowClass: 'shadow-emerald-500/50',
    },
    disconnected: {
      text: 'Offline',
      colorClass: 'bg-rose-500',
      shadowClass: 'shadow-rose-500/50',
    },
  };

  const { text, colorClass, shadowClass } = statusConfig[status];

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center">
        <div className={cn("h-2.5 w-2.5 rounded-full transition-all duration-500", colorClass, "shadow-[0_0_8px]", shadowClass)} />
        {status === 'streaming' && (
            <div className={cn("absolute h-2.5 w-2.5 rounded-full animate-ping opacity-75", colorClass)} />
        )}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
        {text}
      </span>
    </div>
  );
}
