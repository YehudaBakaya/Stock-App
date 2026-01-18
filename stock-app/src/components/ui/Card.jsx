  export default function Card({ children, gradient = 'none', className = '' }) {
    const gradients = {
      none: 'bg-white/5 border-white/10',
      purple: 'bg-gradient-to-br from-emerald-500/15 to-amber-500/10 border-emerald-500/20',
      green: 'bg-gradient-to-br from-emerald-500/15 to-emerald-400/10 border-emerald-500/20',
      red: 'bg-gradient-to-br from-red-500/15 to-rose-500/10 border-red-500/20',
      blue: 'bg-gradient-to-br from-sky-500/15 to-cyan-500/10 border-sky-500/20'
    };

    return (
      <div className={`rounded-2xl border backdrop-blur-sm p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)] ${gradients[gradient]} ${className}`}>
        {children}
      </div>
    );
  }
