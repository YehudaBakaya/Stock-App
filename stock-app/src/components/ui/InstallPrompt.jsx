import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setPromptEvent(event);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === 'accepted') {
      setPromptEvent(null);
    }
  };

  if (!promptEvent) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <p className="text-slate-200">אפשר להתקין את StockPro כאפליקציה מלאה.</p>
      <button
        type="button"
        onClick={handleInstall}
        className="text-xs font-semibold uppercase tracking-wide text-emerald-300"
      >
        התקן עכשיו
      </button>
    </div>
  );
}
