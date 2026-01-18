export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  className = '',
  type = 'button'
}) {
  const baseStyles = 'font-bold rounded-xl transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1016]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-400 to-emerald-300 hover:opacity-90 text-slate-900 shadow-lg shadow-emerald-500/20',
    secondary: 'bg-gradient-to-r from-amber-300 to-amber-200 hover:opacity-90 text-slate-900 shadow-lg shadow-amber-500/20',
    outline: 'border border-white/15 text-slate-200 hover:bg-white/5',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
    danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:opacity-90 text-white'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
