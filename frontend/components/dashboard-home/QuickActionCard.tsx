import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function QuickActionCard({
  href,
  title,
  description,
  icon,
  iconClass,
  hoverClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
  hoverClass: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${hoverClass}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-slate-800">
          {title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
          {description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
    </Link>
  );
}
