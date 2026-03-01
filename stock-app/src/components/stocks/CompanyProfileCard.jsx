import { useQuery } from '@tanstack/react-query';
import { getCompanyProfile, getAnalystRatings } from '../../api/api';
import Card from '../ui/Card';
import { Globe, Building2 } from 'lucide-react';

function RatingsBar({ ratings }) {
  const total = (ratings.strongBuy || 0) + (ratings.buy || 0) + (ratings.hold || 0) +
    (ratings.sell || 0) + (ratings.strongSell || 0);
  if (total === 0) return null;

  const buyPct = (((ratings.strongBuy || 0) + (ratings.buy || 0)) / total) * 100;
  const holdPct = ((ratings.hold || 0) / total) * 100;
  const sellPct = (((ratings.sell || 0) + (ratings.strongSell || 0)) / total) * 100;

  return (
    <div className="mt-3 space-y-1">
      <p className="text-xs text-slate-400 mb-2">דירוג אנליסטים ({total})</p>
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {buyPct > 0 && <div className="bg-emerald-400 rounded-full" style={{ width: `${buyPct}%` }} />}
        {holdPct > 0 && <div className="bg-slate-400 rounded-full" style={{ width: `${holdPct}%` }} />}
        {sellPct > 0 && <div className="bg-rose-400 rounded-full" style={{ width: `${sellPct}%` }} />}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500">
        <span className="text-emerald-400">קנה {Math.round(buyPct)}%</span>
        <span>המתן {Math.round(holdPct)}%</span>
        <span className="text-rose-400">מכור {Math.round(sellPct)}%</span>
      </div>
    </div>
  );
}

export default function CompanyProfileCard({ symbol }) {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['companyProfile', symbol],
    queryFn: async () => {
      const res = await getCompanyProfile(symbol);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: ratings } = useQuery({
    queryKey: ['analystRatings', symbol],
    queryFn: async () => {
      const res = await getAnalystRatings(symbol);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (profileLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-3 bg-white/10 rounded w-3/4" />
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <div className="text-center py-4">
          <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-xs">נתוני חברה אינם זמינים</p>
          <p className="text-slate-600 text-xs mt-1">הוסף FINNHUB_API_KEY להפעלה</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start gap-3 mb-3">
        {profile.logo && (
          <img
            src={profile.logo}
            alt={profile.name}
            className="w-10 h-10 rounded-lg object-contain bg-white/5 p-1 flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{profile.name}</p>
          <p className="text-xs text-slate-400">{profile.exchange} · {profile.country}</p>
          {profile.industry && (
            <p className="text-xs text-slate-500 mt-0.5">{profile.industry}</p>
          )}
        </div>
      </div>

      {profile.marketCap > 0 && (
        <p className="text-xs text-slate-400 mb-2">
          שווי שוק: <span className="text-slate-200">${(profile.marketCap / 1000).toFixed(1)}B</span>
        </p>
      )}

      {profile.website && (
        <a
          href={profile.website}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <Globe className="w-3 h-3" />
          אתר החברה
        </a>
      )}

      {ratings && <RatingsBar ratings={ratings} />}
    </Card>
  );
}
