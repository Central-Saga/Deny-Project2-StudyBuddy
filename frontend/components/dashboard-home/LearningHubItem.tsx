import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LearningHubItem({
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
      className="group flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-700">
          {title}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          {description}
        </p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
    </Link>
  );
}
