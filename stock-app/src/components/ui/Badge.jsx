export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-white/10 text-slate-200',
    secondary: 'bg-white/5 text-slate-300',
    success: 'bg-green-500/20 text-green-400',
    danger: 'bg-red-500/20 text-red-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-emerald-500/20 text-emerald-300'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
