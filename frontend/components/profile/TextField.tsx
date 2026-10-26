import type { ReactNode } from 'react';
export default function TextField({
  label,
  value,
  onChange,
  icon,
  placeholder,
  disabled = false,
  required = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          type={type}
          required={required}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-200 py-2.5 pr-3 text-xs outline-none ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${
            disabled
              ? 'cursor-not-allowed bg-slate-100 text-slate-500'
              : 'bg-slate-50 text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
          }`}
        />
      </div>
    </div>
  );
}
