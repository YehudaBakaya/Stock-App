export default function CardHeader({ children, className = '' }) {
  return (
    <div className={`border-b border-gray-700/50 p-4 ${className}`}>
      {children}
    </div>
  );
}
