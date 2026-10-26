import type { ReactNode } from 'react';
import type { SimpleUser } from './types';

export function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClass,
  valueClass = '!text-slate-900',
}: {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
          <p className="mt-1 text-[11px] text-slate-400">{description}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

export function PersonBlock({
  label,
  user,
  fallback,
}: {
  label: string;
  user?: SimpleUser | null;
  fallback: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-700">
        {user?.name || fallback}
      </p>
      {user?.email && (
        <p className="mt-0.5 break-all text-[11px] text-slate-400">
          {user.email}
        </p>
      )}
    </div>
  );
}
