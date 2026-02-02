import { useState, useEffect } from 'react';
import { Send, Bell, MessageCircle, Check, ShieldCheck, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Switch from '../ui/Switch';
import { sendTelegramTest } from '../../api/api';

export default function TelegramSettings({ settings, onSave }) {
  const [chatId, setChatId] = useState(settings?.chatId || '');
  const [botToken, setBotToken] = useState(settings?.botToken || '');
  const [isActive, setIsActive] = useState(settings?.isActive || false);
  const [notifyPriceChange, setNotifyPriceChange] = useState(settings?.notifyPriceChange ?? true);
  const [notifyDailySummary, setNotifyDailySummary] = useState(settings?.notifyDailySummary ?? true);
  const [notifyEntryAlerts, setNotifyEntryAlerts] = useState(settings?.notifyEntryAlerts ?? true);
  const [priceThreshold, setPriceThreshold] = useState(settings?.priceThreshold || 5);
  const [entryChangeThreshold, setEntryChangeThreshold] = useState(settings?.entryChangeThreshold || 3);
  const [entryVolumeMultiplier, setEntryVolumeMultiplier] = useState(settings?.entryVolumeMultiplier || 2);
  const [summaryDailyEnabled, setSummaryDailyEnabled] = useState(settings?.summaryDailyEnabled || false);
  const [summaryWeeklyEnabled, setSummaryWeeklyEnabled] = useState(settings?.summaryWeeklyEnabled || false);
  const [summaryMonthlyEnabled, setSummaryMonthlyEnabled] = useState(settings?.summaryMonthlyEnabled || false);
  const [summaryDailyTime, setSummaryDailyTime] = useState(settings?.summaryDailyTime || '20:00');
  const [summaryWeeklyDay, setSummaryWeeklyDay] = useState(settings?.summaryWeeklyDay ?? 5);
  const [summaryWeeklyTime, setSummaryWeeklyTime] = useState(settings?.summaryWeeklyTime || '20:00');
  const [summaryMonthlyDay, setSummaryMonthlyDay] = useState(settings?.summaryMonthlyDay ?? 1);
  const [summaryMonthlyTime, setSummaryMonthlyTime] = useState(settings?.summaryMonthlyTime || '20:00');
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [testError, setTestError] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const publicToken = settings?.publicToken || '';

  useEffect(() => {
    if (settings) {
      setChatId(settings.chatId || '');
      setBotToken(settings.botToken || '');
      setIsActive(settings.isActive || false);
      setNotifyPriceChange(settings.notifyPriceChange ?? true);
      setNotifyDailySummary(settings.notifyDailySummary ?? true);
      setNotifyEntryAlerts(settings.notifyEntryAlerts ?? true);
      setPriceThreshold(settings.priceThreshold || 5);
      setEntryChangeThreshold(settings.entryChangeThreshold || 3);
      setEntryVolumeMultiplier(settings.entryVolumeMultiplier || 2);
      setSummaryDailyEnabled(settings.summaryDailyEnabled || false);
      setSummaryWeeklyEnabled(settings.summaryWeeklyEnabled || false);
      setSummaryMonthlyEnabled(settings.summaryMonthlyEnabled || false);
      setSummaryDailyTime(settings.summaryDailyTime || '20:00');
      setSummaryWeeklyDay(settings.summaryWeeklyDay ?? 5);
      setSummaryWeeklyTime(settings.summaryWeeklyTime || '20:00');
      setSummaryMonthlyDay(settings.summaryMonthlyDay ?? 1);
      setSummaryMonthlyTime(settings.summaryMonthlyTime || '20:00');
    }
  }, [settings]);

  const handleSave = () => {
    if (!chatId) {
      setTestError('נא להזין Chat ID לפני הפעלה.');
      return;
    }
    onSave({
      chatId,
      botToken,
      isActive,
      notifyPriceChange,
      notifyDailySummary,
      notifyEntryAlerts,
      priceThreshold: parseFloat(priceThreshold),
      entryChangeThreshold: parseFloat(entryChangeThreshold),
      entryVolumeMultiplier: parseFloat(entryVolumeMultiplier),
      summaryDailyEnabled,
      summaryWeeklyEnabled,
      summaryMonthlyEnabled,
      summaryDailyTime,
      summaryWeeklyDay: parseInt(summaryWeeklyDay, 10),
      summaryWeeklyTime,
      summaryMonthlyDay: parseInt(summaryMonthlyDay, 10),
      summaryMonthlyTime
    });
    setSaved(true);
    setTestError('');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestError('');
    setTestStatus('');
    try {
      const res = await sendTelegramTest();
      setTestStatus(res.data?.message || 'הודעת בדיקה נשלחה!');
    } catch (err) {
      const message = err.response?.data?.message || 'שגיאה בשליחת הודעת בדיקה';
      const details = err.response?.data?.details;
      setTestError(details ? `${message}: ${details}` : message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyToken = async () => {
    if (!publicToken) {
      return;
    }
    try {
      await navigator.clipboard.writeText(publicToken);
      setCopyStatus('הועתק!');
      setTimeout(() => setCopyStatus(''), 1500);
    } catch {
      setCopyStatus('נכשל');
      setTimeout(() => setCopyStatus(''), 1500);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
            <p className="text-gray-300 font-medium">1. התחבר לבוט</p>
            <p className="text-gray-500">שלח /start לבוט שלך</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
            <p className="text-gray-300 font-medium">2. קבל Chat ID</p>
            <p className="text-gray-500">השתמש ב-@userinfobot לקבלת ID</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/40">
            <p className="text-gray-300 font-medium">3. בדיקה</p>
            <p className="text-gray-500">לחץ "בדוק שליחה"</p>
          </div>
        </div>

        {testError && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4" />
            {testError}
          </div>
        )}
        {testStatus && (
          <div className="flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <ShieldCheck className="w-4 h-4" />
            {testStatus}
          </div>
        )}

        {/* Public Token */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-medium">טוקן התראות ציבורי</p>
              <p className="text-gray-500 text-sm">
                שתף את הטוקן כדי לאפשר לאחרים להירשם להתראות.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyToken}
              disabled={!publicToken}
            >
              {copyStatus || 'העתק'}
            </Button>
          </div>
          <div className="mt-3">
            <input
              type="text"
              readOnly
              value={publicToken || 'הוסף TELEGRAM_PUBLIC_TOKEN בשרת'}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white/80"
            />
          </div>
        </div>

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
            טיפ: שלח /start לבוט שלך, או השתמש ב-@userinfobot כדי לקבל Chat ID.
          </p>
        </div>

        {/* Bot Token */}
        <div>
          <Input
            label="Telegram Bot Token"
            placeholder="הדבק את הטוקן מבוטפאדר"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
          />
          <p className="text-gray-500 text-xs mt-2">
            אם תוסיף טוקן משלך, ההתראות ישלחו מהבוט שלך.
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
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">התראות כניסה לעסקה</span>
            <Switch checked={notifyEntryAlerts} onChange={setNotifyEntryAlerts} />
          </div>
        </div>

        {/* Threshold */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            type="number"
            label="סף התראה (%)"
            placeholder="5"
            value={priceThreshold}
            onChange={(e) => setPriceThreshold(e.target.value)}
          />
          <Input
            type="number"
            label="כניסה לעסקה: שינוי %"
            placeholder="3"
            value={entryChangeThreshold}
            onChange={(e) => setEntryChangeThreshold(e.target.value)}
          />
          <Input
            type="number"
            label="כניסה לעסקה: מכפיל נפח"
            placeholder="2"
            value={entryVolumeMultiplier}
            onChange={(e) => setEntryVolumeMultiplier(e.target.value)}
          />
        </div>

        {/* Portfolio Summaries */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">דוח יומי</span>
            <Switch checked={summaryDailyEnabled} onChange={setSummaryDailyEnabled} />
          </div>
          {summaryDailyEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                type="time"
                label="שעת שליחה יומית"
                value={summaryDailyTime}
                onChange={(e) => setSummaryDailyTime(e.target.value)}
              />
              <div className="text-xs text-slate-400 flex items-end">
                נשלח כל יום לפי השעה שתבחר.
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">דוח שבועי</span>
            <Switch checked={summaryWeeklyEnabled} onChange={setSummaryWeeklyEnabled} />
          </div>
          {summaryWeeklyEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 text-sm mb-2 block">יום בשבוע</label>
                <select
                  value={summaryWeeklyDay}
                  onChange={(e) => setSummaryWeeklyDay(parseInt(e.target.value, 10))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white"
                >
                  <option value={0}>ראשון</option>
                  <option value={1}>שני</option>
                  <option value={2}>שלישי</option>
                  <option value={3}>רביעי</option>
                  <option value={4}>חמישי</option>
                  <option value={5}>שישי</option>
                  <option value={6}>שבת</option>
                </select>
              </div>
              <Input
                type="time"
                label="שעת שליחה שבועית"
                value={summaryWeeklyTime}
                onChange={(e) => setSummaryWeeklyTime(e.target.value)}
              />
              <div className="text-xs text-slate-400 flex items-end">
                נשלח ביום ובשעה שתבחר.
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <span className="text-gray-300">דוח חודשי</span>
            <Switch checked={summaryMonthlyEnabled} onChange={setSummaryMonthlyEnabled} />
          </div>
          {summaryMonthlyEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                type="number"
                label="יום בחודש (1-28)"
                value={summaryMonthlyDay}
                onChange={(e) => setSummaryMonthlyDay(e.target.value)}
                min={1}
                max={28}
              />
              <Input
                type="time"
                label="שעת שליחה חודשית"
                value={summaryMonthlyTime}
                onChange={(e) => setSummaryMonthlyTime(e.target.value)}
              />
              <div className="text-xs text-slate-400 flex items-end">
                מומלץ לבחור יום עד 28.
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          <Button
            onClick={handleTest}
            className="w-full"
            variant="outline"
            disabled={!chatId || isTesting}
          >
            {isTesting ? 'בודק...' : 'בדוק שליחה'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
