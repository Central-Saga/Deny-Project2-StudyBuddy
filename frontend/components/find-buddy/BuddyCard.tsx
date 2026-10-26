import type { BuddyDto } from '@/types/api';
import { Brain, Check, Clock3, Eye, Loader2, Unlink, UserPlus, X } from 'lucide-react';
import type { MatchingMode } from './utils';

export function BuddyCard({
  buddy,
  busy,
  onView,
  onConnect,
  onAccept,
  onReject,
  onRemove,
  matchingMode,
}: {
  buddy: BuddyDto;
  busy: boolean;
  onView: () => void;
  onConnect: () => void;
  onAccept: () => void;
  onReject: () => void;
  onRemove: () => void;
  matchingMode: MatchingMode;
}) {
  const initials = buddy.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join('')
    .toUpperCase();
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
              {buddy.profile?.avatar_url ? (
                <img
                  src={buddy.profile.avatar_url}
                  alt={`Foto profil ${buddy.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials || 'U'
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-800">{buddy.name}</h3>
              <p className="truncate text-[11px] text-slate-400">{buddy.email}</p>
            </div>
          </div>
          {matchingMode === 'none' ? (
            <span
              title="Lengkapi profil belajar agar skor Match dapat dihitung."
              className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500"
            >
              Lengkapi profil
            </span>
          ) : (
            <span
              title={
                matchingMode === 'profile'
                  ? 'Dihitung otomatis dari profil belajarmu.'
                  : 'Dihitung dari filter aktif dan profil belajarmu.'
              }
              className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700"
            >
              Match {buddy.match_score ?? 0}
            </span>
          )}
        </div>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
          {buddy.bio || 'Belum menambahkan bio singkat.'}
        </p>
        {(buddy.matched_subjects || []).length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase text-slate-400">Mata Kuliah Cocok</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {buddy.matched_subjects?.map((subject) => (
                <span
                  key={subject.id}
                  className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700"
                >
                  {subject.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(buddy.learning_styles || []).map((style) => (
            <span
              key={style}
              className="rounded-md bg-violet-50 px-2 py-1 text-[10px] font-medium text-violet-700"
            >
              {style}
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2 text-[10px]">
          {buddy.availability_match && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
              <Clock3 className="h-3 w-3" /> Jadwal cocok
            </span>
          )}
          {buddy.learning_style_match && (
            <span className="flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 font-semibold text-violet-700">
              <Brain className="h-3 w-3" /> Gaya cocok
            </span>
          )}
        </div>
      </div>
      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onView}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Eye className="h-3.5 w-3.5" /> Lihat Profil
        </button>
        {buddy.connection_status === 'pending' &&
        buddy.connection_direction === 'incoming' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onAccept}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Terima
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Tolak
            </button>
          </div>
        ) : buddy.connection_status === 'pending' ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Batalkan Permintaan
          </button>
        ) : buddy.is_connected ? (
          <button
            type="button"
            disabled={busy}
            onClick={onRemove}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
            Terhubung Ã‚Â· Putuskan
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onConnect}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-blue-400"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Ajak Belajar
          </button>
        )}
      </div>
    </article>
  );
}
