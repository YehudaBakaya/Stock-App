export default function Card({ children, gradient = 'none', className = '' }) {
  const gradients = {
    none: 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700',
    purple: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30',
    green: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30',
    red: 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500/30',
    blue: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30'
  };

  return (
    <div className={`rounded-2xl border backdrop-blur-sm p-6 ${gradients[gradient]} ${className}`}>
      {children}
    </div>
  );
}