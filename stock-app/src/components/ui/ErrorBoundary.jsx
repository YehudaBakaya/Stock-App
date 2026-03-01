import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen app-bg flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-[0_24px_60px_rgba(0,0,0,0.45)] text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">משהו השתבש</h2>
              <p className="text-slate-400 text-sm">
                אירעה שגיאה בלתי צפויה. ניתן לנסות שוב.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-gradient-to-r from-emerald-400 to-emerald-300 text-slate-900 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                נסה שוב
              </button>
              <button
                onClick={() => { window.location.href = '/'; }}
                className="w-full border border-white/15 text-slate-200 font-bold py-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                חזור לדף הבית
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
