  import { useState } from 'react';
  import { Link, useLocation } from 'react-router-dom';
  import { useAuth } from './context/AuthContext';
  import { 
    BarChart3, 
    TrendingUp, 
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
  { title: 'דשבורד', url: '/', icon: BarChart3 },
  { title: 'שוק המניות', url: '/Stocks', icon: TrendingUp },
  { title: 'טריידינג', url: '/trading', icon: Zap }, // <-- הוספנו
  { title: 'תיק השקעות', url: '/Portfolio', icon: Briefcase },
  { title: 'פרופיל', url: '/profile', icon: User },
];

    return (
      <div className="min-h-screen flex bg-gray-950 text-white" dir="rtl">
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
          w-64 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Logo */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    StockPro
                  </h2>
                  <p className="text-xs text-gray-500">פלטפורמת מסחר</p>
                </div>
              </div>
              <button 
                className="md:hidden text-gray-400"
                onClick={() => setSidebarOpen(false)}
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
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white' 
                    : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${location.pathname === item.url ? 'text-purple-400' : ''}`} />
                <span className="font-medium">{item.title}</span>
              </Link>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={logout}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="md:hidden bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 px-4 py-3 sticky top-0 z-30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)}>
                  <Menu className="w-6 h-6 text-white" />
                </button>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    StockPro
                  </span>
                </div>
              </div>
              <button className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
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
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800">
            <div className="flex items-center justify-around py-2">
              {navigationItems.slice(0, 4).map((item) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`flex flex-col items-center p-2 ${
                    location.pathname === item.url ? 'text-purple-400' : 'text-gray-500'
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