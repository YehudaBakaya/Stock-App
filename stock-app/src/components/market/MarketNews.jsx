import { motion } from 'framer-motion';
import { Newspaper, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const mockNews = [
  { id: 1, title: 'מניות הטכנולוגיה ממשיכות לעלות בוול סטריט', source: 'גלובס', time: 'לפני שעה', category: 'טכנולוגיה' },
  { id: 2, title: 'אפל מציגה רווחים מעל לצפיות האנליסטים', source: 'כלכליסט', time: 'לפני 2 שעות', category: 'דוחות' },
  { id: 3, title: 'הפד רומז על הורדת ריבית בחודשים הקרובים', source: 'TheMarker', time: 'לפני 3 שעות', category: 'מאקרו' },
  { id: 4, title: 'טסלה מכריזה על מפעל חדש באירופה', source: 'גלובס', time: 'לפני 5 שעות', category: 'חברות' },
];

export default function MarketNews() {
  return (
    <Card className="h-full">
      <div className="border-b border-gray-700/50 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg">חדשות שוק</h3>
        </div>
      </div>

      <div className="space-y-4">
        {mockNews.map((news, index) => (
          <motion.div
            key={news.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Badge variant="purple" className="mb-2">{news.category}</Badge>
                <p className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors leading-relaxed">
                  {news.title}
                </p>
                <div className="flex items-center gap-2 mt-2 text-gray-500 text-xs">
                  <span>{news.source}</span>
                  <span>•</span>
                  <span>{news.time}</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors mt-1" />
            </div>
            {index < mockNews.length - 1 && <div className="border-b border-gray-800 mt-4" />}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}