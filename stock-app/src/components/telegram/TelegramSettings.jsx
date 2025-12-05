import { useState, useEffect } from 'react';
import { Send, Bell, MessageCircle, Check } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Switch from '../ui/Switch';

export default function TelegramSettings({ settings, onSave }) {
  const [chatId, setChatId] = useState(settings?.chatId || '');
  const [isActive, setIsActive] = useState(settings?.isActive || false);
  const [notifyPriceChange, setNotifyPriceChange] = useState(settings?.notifyPriceChange ?? true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(settings?.notifyDailySummary ?? true);
  const [priceThreshold, setPriceThreshold] = useState(settings?.priceThreshold || 5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setChatId(settings.chatId || '');
      setIsActive(settings.isActive || false);
      setNotifyPriceChange(settings.notifyPriceChange ?? true);
      setNotifyDailySummary(settings.notifyDailySummary ?? true);
      setPriceThreshold(settings.priceThreshold || 5);
    }
  }, [settings]);

  const handleSave = () => {
    onSave({
      chatId,
      isActive,
      notifyPriceChange,
      notifyDailySummary,
      priceThreshold: parseFloat(priceThreshold)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card>
      <div className="border-b border-gray-700/50 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
            <Send className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg">הגדרות טלגרם</h3>
        </div>
      </div>

      <div className="space-y-6">
        {/* Chat ID */}
        <div>
          <Input
            label="Telegram Chat ID"
            placeholder="הכנס את ה-Chat ID שלך"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            icon={MessageCircle}
          />
          <p className="text-gray-500 text-xs mt-2">
            שלח /start לבוט @YourStockBot כדי לקבל את ה-Chat ID
          </p>
        </div>

        {/* Activate */}
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-white font-medium">הפעל התראות</p>
              <p className="text-gray-500 text-sm">קבל התראות לטלגרם</p>
            </div>
          </div>
          <Switch checked={isActive} onChange={setIsActive} />
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">התראות שינוי מחיר</span>
            <Switch checked={notifyPriceChange} onChange={setNotifyPriceChange} />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">סיכום יומי</span>
            <Switch checked={notifyDailySummary} onChange={setNotifyDailySummary} />
          </div>
        </div>

        {/* Threshold */}
        <Input
          type="number"
          label="סף התראה (%)"
          placeholder="5"
          value={priceThreshold}
          onChange={(e) => setPriceThreshold(e.target.value)}
        />

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full" variant={saved ? 'secondary' : 'primary'}>
          {saved ? (
            <>
              <Check className="w-4 h-4 ml-2" />
              נשמר!
            </>
          ) : (
            'שמור הגדרות'
          )}
        </Button>
      </div>
    </Card>
  );
}