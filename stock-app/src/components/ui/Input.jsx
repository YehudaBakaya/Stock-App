import { useId } from 'react';

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  icon: Icon,
  id,
  name,
  className = '',
  ...props
}) {
  const reactId = useId();
  const inputId = id || name || reactId;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="text-slate-300 text-sm mb-2 block">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        )}
        <input
          id={inputId}
          name={name || inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${Icon ? 'pr-11 pl-4' : 'px-4'}`}
          {...props}
        />
      </div>
    </div>
  );
}
