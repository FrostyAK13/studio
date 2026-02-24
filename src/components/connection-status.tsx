'use client';

import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  status: 'connecting' | 'streaming' | 'disconnected';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const statusConfig = {
    connecting: {
      text: 'Connecting...',
      className: 'bg-yellow-500',
    },
    streaming: {
      text: 'Streaming',
      className: 'bg-green-500',
    },
    disconnected: {
      text: 'Disconnected',
      className: 'bg-red-500',
    },
  };

  const { text, className } = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-2.5 w-2.5 rounded-full", className)}>
        {status === 'streaming' && <div className={cn("h-2.5 w-2.5 rounded-full animate-ping", className)} />}
      </div>
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}
