import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { getMarketNews } from '../../api/api';

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(diffMs)) return '';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'עכשיו';
  if (minutes < 60) return `לפני ${minutes}ד׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours}ש׳`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
};

export default function MarketNews() {
  const { data: news = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['marketNews'],
    queryFn: async () => {
      const res = await getMarketNews();
      return res.data;
    },
    staleTime: 300000,
    refetchInterval: 300000,
  });

  return (
    <Card className="h-full">
      <div className="border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg shadow-lg shadow-amber-500/20">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg">חדשות שוק</h3>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            רענן
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="text-sm text-slate-400">טוען חדשות...</div>
        )}
        {!isLoading && news.length === 0 && (
          <div className="text-sm text-slate-400">לא נמצאו חדשות כרגע</div>
        )}
        {news.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
          >
            <a href={item.url} target="_blank" rel="noreferrer" className="block">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Badge variant="purple" className="mb-2">{item.category}</Badge>
                  <p className="text-slate-200 text-sm font-medium group-hover:text-white transition-colors leading-relaxed">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs">
                    <span>{item.source}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(item.time)}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-emerald-300 transition-colors mt-1" />
              </div>
            </a>
            {index < news.length - 1 && <div className="border-b border-white/10 mt-4" />}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
