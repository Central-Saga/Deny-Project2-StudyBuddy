"use client";

import {
  Loader2,
  Star,
  X,
} from "lucide-react";
import type { TutoringController } from "@/hooks/tutoring/useTutoringPage";

export default function ReviewModal({ ctrl }: { ctrl: TutoringController }) {
  const {
    saving,
    reviewRequest,
    setReviewRequest,
    reviewForm,
    setReviewForm,
    submitReview,
  } = ctrl;

  if (!reviewRequest) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
                  Review Tutor
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Nilai sesi dengan {reviewRequest.tutor_name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setReviewRequest(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitReview} className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setReviewForm((previous) => ({
                          ...previous,
                          rating,
                        }))
                      }
                      aria-label={`${rating} bintang`}
                      className="rounded-xl p-1.5 transition hover:bg-amber-50"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          rating <= reviewForm.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  {reviewForm.rating} dari 5 bintang
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Komentar <span className="font-normal text-slate-400">(opsional)</span>
                </label>
                <textarea
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(event) =>
                    setReviewForm((previous) => ({
                      ...previous,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Penjelasan mudah dipahami dan membantu."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
                {saving ? "Mengirim..." : "Kirim Review"}
              </button>
            </form>
          </div>
        </div>
  );
}
