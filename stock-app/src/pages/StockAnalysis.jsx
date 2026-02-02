import { useQuery } from '@tanstack/react-query';
import { getHoldings } from '../api/api';
import SignalChart from '../components/portfolio/SignalChart';

export default function StockAnalysis() {
  const { data: holdings = [] } = useQuery({
    queryKey: ['holdings'],
    queryFn: async () => {
      const res = await getHoldings();
      return res.data;
    }
  });

  return (
    <div className="min-h-screen app-bg p-4 md:p-6 pb-24 md:pb-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black font-display text-white">ניתוח מניות</h1>
          <p className="text-slate-400 mt-2">
            הזן סימול או בחר מהתיק שלך, הצג טווח זמן, והוסף רמות כניסה/סטופ/יעד.
          </p>
        </div>
        <SignalChart holdings={holdings} />
      </div>
    </div>
  );
}
