export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  className = '',
  type = 'button'
}) {
  const baseStyles = 'font-bold rounded-xl transition-all flex items-center justify-center';
  
  const variants = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white',
    secondary: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 text-white',
    outline: 'border border-gray-700 text-gray-300 hover:bg-gray-800',
    ghost: 'text-gray-400 hover:text-white hover:bg-gray-800',
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