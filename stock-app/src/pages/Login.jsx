import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg flex items-center justify-center p-4" dir="rtl">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl float-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl float-slow" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-black font-display bg-gradient-to-r from-emerald-200 via-white to-amber-200 bg-clip-text text-transparent">
            StockPro
          </h1>
          <p className="text-slate-400 mt-2">התחבר לחשבון שלך</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-center text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-gray-300 text-sm mb-2 block">אימייל</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-11 pl-4 py-3 text-white focus:border-emerald-400 focus:outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-2 block">סיסמה</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-11 pl-11 py-3 text-white focus:border-emerald-400 focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-400 to-emerald-300 text-slate-900 font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'התחבר'
            )}
          </button>

          <p className="text-center text-slate-400">
            אין לך חשבון?{' '}
            <Link to="/register" className="text-emerald-300 hover:text-emerald-200 font-medium">
              הירשם עכשיו
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
