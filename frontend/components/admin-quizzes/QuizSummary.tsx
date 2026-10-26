import {
  CheckCircle2,
  CircleOff,
  FileQuestion,
  ShieldAlert,
} from 'lucide-react';
import { SummaryCard } from './QuizCards';

interface QuizSummaryProps {
  summary: {
    total: number;
    published: number;
    unpublished: number;
    adminDisabled: number;
  };
}

export default function QuizSummary({ summary }: QuizSummaryProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Total Quiz"
        value={summary.total}
        icon={
          <FileQuestion className="h-5 w-5" />
        }
        iconClass="bg-violet-50 text-violet-600"
      />

      <SummaryCard
        label="Published"
        value={summary.published}
        icon={
          <CheckCircle2 className="h-5 w-5" />
        }
        iconClass="bg-emerald-50 text-emerald-600"
      />

      <SummaryCard
        label="Unpublished"
        value={
          summary.unpublished
        }
        icon={
          <CircleOff className="h-5 w-5" />
        }
        iconClass="bg-slate-100 text-slate-600"
      />

      <SummaryCard
        label="Admin Disabled"
        value={
          summary.adminDisabled
        }
        icon={
          <ShieldAlert className="h-5 w-5" />
        }
        iconClass="bg-red-50 text-red-600"
      />
    </section>
  );
}
