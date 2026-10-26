import type { Dispatch, FormEvent, SetStateAction } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  X,
} from 'lucide-react';
import type { QuestionDraft, Quiz, QuizForm } from './types';
import { newQuestion } from './utils';

type QuizFormModalProps = {
  editingQuiz: Quiz | null;
  form: QuizForm;
  setForm: Dispatch<SetStateAction<QuizForm>>;
  subjects: { id: number; name: string }[];
  draftQuestions: QuestionDraft[];
  setDraftQuestions: Dispatch<SetStateAction<QuestionDraft[]>>;
  savingQuiz: boolean;
  setFormOpen: (open: boolean) => void;
  saveQuiz: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updateQuestion: (index: number, patch: Partial<QuestionDraft>) => void;
  updateOption: (
    questionIndex: number,
    optionIndex: number,
    patch: Partial<QuestionDraft['options'][number]>,
  ) => void;
  setCorrectOption: (questionIndex: number, optionIndex: number) => void;
  changeQuestionType: (index: number, type: QuestionDraft['question_type']) => void;
};

export default function QuizFormModal({
  editingQuiz,
  form,
  setForm,
  subjects,
  draftQuestions,
  setDraftQuestions,
  savingQuiz,
  setFormOpen,
  saveQuiz,
  updateQuestion,
  updateOption,
  setCorrectOption,
  changeQuestionType,
}: QuizFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
              {editingQuiz ? 'Manage Quiz' : 'Create Quiz'}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {editingQuiz ? 'Edit Kuis' : 'Buat Kuis Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={saveQuiz} className="space-y-5 p-5 sm:p-6">
          {editingQuiz && (editingQuiz.attempt_count ?? 0) > 0 && (
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">Soal dikunci karena kuis sudah pernah dikerjakan.</p>
                <p className="mt-1 text-xs leading-5">
                  Kamu masih bisa mengubah judul, mata kuliah, deskripsi, durasi, nilai lulus, dan batas percobaan.
                  Soal tidak diubah agar riwayat attempt dan jawaban tetap konsisten.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Judul kuis</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] placeholder:text-slate-400 outline-none focus:border-blue-400 focus:bg-white"
                placeholder="Contoh: Quiz Basis Data"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Mata kuliah</label>
              <select
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
              >
                <option value="">Umum</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Durasi (menit)</label>
              <input
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Maksimal percobaan
              </label>
              <select
                value={form.max_attempts}
                onChange={(e) => setForm({ ...form, max_attempts: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
              >
                <option value="1">1 kali</option>
                <option value="3">3 kali</option>
                <option value="unlimited">Tidak terbatas</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Nilai lulus (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.pass_score}
                onChange={(e) => setForm({ ...form, pass_score: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Deskripsi</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 [color-scheme:light] outline-none"
                placeholder="Opsional"
              />
            </div>
          </div>
          {(!editingQuiz || (editingQuiz.attempt_count ?? 0) === 0) && (
            <>
              <div className="space-y-4">
                {draftQuestions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-700">Pertanyaan {qIndex + 1}</p>
                      {draftQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftQuestions((current) =>
                              current.filter((_, i) => i !== qIndex),
                            )
                          }
                          className="text-[10px] font-bold text-red-500"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_100px]">
                      <textarea
                        required
                        rows={3}
                        value={question.question_text}
                        onChange={(e) =>
                          updateQuestion(qIndex, { question_text: e.target.value })
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 [color-scheme:light] placeholder:text-slate-400 outline-none"
                        placeholder="Tulis pertanyaan..."
                      />
                      <select
                        value={question.question_type}
                        onChange={(e) =>
                          changeQuestionType(
                            qIndex,
                            e.target.value as QuestionDraft['question_type'],
                          )
                        }
                        className="h-fit rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 [color-scheme:light]"
                      >
                        <option value="multiple_choice">Pilihan ganda</option>
                        <option value="true_false">Benar / Salah</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) =>
                          updateQuestion(qIndex, { points: Number(e.target.value) || 1 })
                        }
                        className="h-fit rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 [color-scheme:light]"
                      />
                    </div>
                    {question.question_type !== 'essay' && (
                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={option.is_correct}
                              onChange={() => setCorrectOption(qIndex, oIndex)}
                              className="accent-blue-600"
                            />
                            <input
                              required
                              value={option.option_text}
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, {
                                  option_text: e.target.value,
                                })
                              }
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 [color-scheme:light] placeholder:text-slate-400"
                              placeholder={`Opsi ${oIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDraftQuestions((current) => [...current, newQuestion()])}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Tambah pertanyaan
              </button>
            </>
          )}
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              disabled={savingQuiz}
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {savingQuiz ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {savingQuiz
                ? 'Menyimpan...'
                : editingQuiz
                  ? 'Simpan Perubahan'
                  : 'Publikasikan Kuis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
