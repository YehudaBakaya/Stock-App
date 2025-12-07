export default function CardTitle({ children, className = '' }) {
  return <h2 className={`text-lg font-bold ${className}`}>{children}</h2>;
}
