import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function AttentionItem({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  tone:
    | 'red'
    | 'amber'
    | 'blue'
    | 'slate';
}) {
  const toneClasses = {
    red: 'bg-red-50 text-red-600',
    amber:
      'bg-amber-50 text-amber-600',
    blue:
      'bg-blue-50 text-blue-600',
    slate:
      'bg-slate-100 text-slate-600',
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/50"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-700">
          {label}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          Perlu perhatian admin
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-slate-900">
          {value}
        </span>

        <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
      </div>
    </Link>
  );
}

export function QuickAction({
  href,
  title,
  description,
  icon,
  iconClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-slate-50/40 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>

      <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
        Buka halaman
        <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
