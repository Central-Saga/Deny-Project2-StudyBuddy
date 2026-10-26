"use client";

import {
  Loader2,
  Star,
  X,
} from "lucide-react";
import type { TutoringController } from "@/hooks/tutoring/useTutoringPage";

export default function TutorReviewsModal({ ctrl }: { ctrl: TutoringController }) {
  const {
    reviewListTutor,
    setReviewListTutor,
    reviewList,
    reviewListLoading,
  } = ctrl;

  if (!reviewListTutor) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
                  Review Tutor
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {reviewListTutor.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {reviewListTutor.rating_avg.toFixed(1)} / 5 ·{" "}
                  {reviewListTutor.reviews_count} review
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReviewListTutor(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 p-5">
              {reviewListLoading ? (
                <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-500" />
                  Memuat review...
                </div>
              ) : reviewList.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">
                  Belum ada review yang dapat ditampilkan.
                </div>
              ) : (
                reviewList.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-100 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {review.student?.name || "Mahasiswa"}
                        </p>
                        {review.created_at && (
                          <p className="mt-1 text-[10px] text-slate-400">
                            {new Date(review.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      {review.comment || "Tidak ada komentar."}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
  );
}
