  import { useEffect, useState } from 'react';
  import { Link, useLocation } from 'react-router-dom';
  import { useTranslation } from 'react-i18next';
  import { useAuth } from './context/AuthContext';
  import { useTheme } from './components/Profile/ThemeProvider';
  import Switch from './components/ui/Switch';
  import { 
    BarChart3, 
    TrendingUp,
    LineChart,
    Briefcase, 
    User,
    Bell,
    LogOut,
    Sparkles,
    Menu,
    X, Zap
  } from 'lucide-react';

  export default function Layout({ children }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
      const nextLang = i18n.language || 'en';
      document.documentElement.setAttribute('lang', nextLang);
      document.documentElement.setAttribute('dir', nextLang === 'he' ? 'rtl' : 'ltr');
    }, [i18n.language]);

  const navigationItems = [
  { title: t('nav.dashboard'), url: '/', icon: BarChart3 },
  { title: t('nav.stocks'), url: '/Stocks', icon: TrendingUp },
  { title: 'ניתוח מניות', url: '/analysis', icon: LineChart },
  { title: t('nav.trading'), url: '/trading', icon: Zap },
  { title: t('nav.portfolio'), url: '/Portfolio', icon: Briefcase },
  { title: t('nav.profile'), url: '/profile', icon: User },
];

    return (
      <div className="min-h-screen flex text-white app-bg" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 right-0 z-50
          w-64 bg-[#0f1722]/95 backdrop-blur-xl border-l border-white/10
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Logo */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl bg-gradient-to-r from-emerald-200 via-white to-amber-200 bg-clip-text text-transparent">
                    StockPro
                  </h2>
                  <p className="text-xs text-slate-400">
                    {i18n.language === 'he' ? 'פלטפורמת מסחר' : 'Trading platform'}
                  </p>
                </div>
              </div>
              <button 
                className="md:hidden text-slate-400"
                onClick={() => setSidebarOpen(false)}
                aria-label="סגור תפריט"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3 flex-1">
            {navigationItems.map((item) => (
              <Link
                key={item.url}
                to={item.url}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all
                  ${location.pathname === item.url 
                    ? 'bg-white/5 border border-white/10 text-white shadow-sm' 
                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${location.pathname === item.url ? 'text-emerald-300' : ''}`} />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={logout}
                className="text-slate-400 hover:text-red-400 transition-colors"
                aria-label="התנתק"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl">
              <span className="text-xs text-slate-300">
                {i18n.language === 'he' ? 'רקע בהיר' : 'Light background'}
              </span>
              <Switch checked={theme === 'light'} onCheckedChange={toggleTheme} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="md:hidden bg-[#0f1722]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} aria-label="פתח תפריט">
                  <Menu className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                  <span className="font-display bg-gradient-to-r from-emerald-200 via-white to-amber-200 bg-clip-text text-transparent">
                    StockPro
                  </span>
                </div>
              </div>
              <button className="relative" aria-label="התראות">
                <Bell className="w-5 h-5 text-slate-300" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full text-[10px] flex items-center justify-center text-black font-bold">
                  3
                </span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f1722]/95 backdrop-blur-xl border-t border-white/10">
            <div className="flex items-center justify-around py-2">
              {navigationItems.slice(0, 4).map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`flex flex-col items-center p-2 ${
                    location.pathname === item.url ? 'text-emerald-300' : 'text-slate-500'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.title}</span>
                </Link>
              ))}
            </div>
          </nav>
        </main>
      </div>
    );
  }
