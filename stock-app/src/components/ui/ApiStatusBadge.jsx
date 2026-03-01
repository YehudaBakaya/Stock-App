import { useQuery } from '@tanstack/react-query';
import { getApiStatus } from '../../api/api';
import { useLivePrices } from '../../context/WebSocketContext';

export default function ApiStatusBadge() {
  const { wsStatus } = useLivePrices() || {};

  const { data } = useQuery({
    queryKey: ['apiStatus'],
    queryFn: async () => {
      const res = await getApiStatus();
      return res.data;
    },
    refetchInterval: 30000,
    retry: false,
  });

  // קביעת סטטוס וצבע
  const isConnected = wsStatus === 'connected';
  const source = data?.twelvedata ?? 'unknown';

  let color = 'bg-slate-500';
  let label = 'Unknown';

  if (!isConnected) {
    color = 'bg-red-500';
    label = 'Offline';
  } else if (source === 'real') {
    color = 'bg-emerald-400';
    label = 'Live';
  } else if (source === 'mock') {
    color = 'bg-red-400';
    label = 'Mock';
  } else {
    color = 'bg-amber-400';
    label = 'Cached';
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color} ${isConnected && source === 'real' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}
