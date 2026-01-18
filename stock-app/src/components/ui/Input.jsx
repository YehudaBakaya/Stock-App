export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="text-slate-300 text-sm mb-2 block">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white focus:border-emerald-400 focus:outline-none transition-colors ${Icon ? 'pr-11 pl-4' : 'px-4'}`}
          {...props}
        />
      </div>
    </div>
  );
}
