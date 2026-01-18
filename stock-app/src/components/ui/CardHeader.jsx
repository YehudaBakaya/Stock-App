export default function CardHeader({ children, className = '' }) {
  return (
    <div className={`border-b border-white/10 p-4 ${className}`}>
      {children}
    </div>
  );
}
