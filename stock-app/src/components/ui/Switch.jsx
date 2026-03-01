export default function Switch({ checked, onCheckedChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-300
        ${checked ? "bg-emerald-500" : "bg-slate-600"}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 rounded-full bg-white
          transform transition-transform duration-300
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}
