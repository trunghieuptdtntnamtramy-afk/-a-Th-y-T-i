import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import {
  computeSurveyAverage,
  LIKERT_LABELS,
  SURVEY_ITEMS,
  validateSurveyAnswers,
  type SurveyPhase,
} from '../utils/eduLogic';

interface SurveyPageProps {
  onSubmitSurvey: (phase: SurveyPhase, answers: number[]) => Promise<void>;
  onNavigateStats: () => void;
}

export function SurveyPage({ onSubmitSurvey, onNavigateStats }: SurveyPageProps) {
  const [phase, setPhase] = useState<SurveyPhase>('before');
  const [answers, setAnswers] = useState<Array<number | null>>(
    Array.from({ length: SURVEY_ITEMS.length }, () => null)
  );
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = answers.filter((v) => v !== null).length;

  const handleSelect = (qIndex: number, value: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = value;
      return next;
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validationError = validateSurveyAnswers(answers);
    if (validationError) {
      setError(validationError);
      return;
    }

    const numericAnswers = answers as number[];
    setSubmitting(true);
    try {
      await onSubmitSurvey(phase, numericAnswers);
      const avg = computeSurveyAverage(numericAnswers);
      setSuccessMsg(
        `Đã lưu khảo sát (${phase === 'before' ? 'Trước khi sử dụng' : 'Sau khi sử dụng'}) với điểm trung bình ${avg.toFixed(2)}/5.`
      );
      setAnswers(Array.from({ length: SURVEY_ITEMS.length }, () => null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu khảo sát.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-[#e2eaf2] rounded-2xl p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-extrabold tracking-widest text-[#13a887]">
          ĐÁNH GIÁ NĂNG LỰC TỰ HỌC
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#174b78]">
          Khảo sát trước và sau khi sử dụng EDU SMART
        </h1>
        <p className="mt-1.5 text-sm text-[#52677e]">
          Hãy chọn mức độ phù hợp nhất với thói quen học tập thực tế của em. Không có câu trả lời đúng hoặc sai.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="survey-phase" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Đợt khảo sát
              </label>
              <select
                id="survey-phase"
                value={phase}
                onChange={(e) => setPhase(e.target.value as SurveyPhase)}
                className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm text-[#19324d] focus:outline-none focus:border-[#1677d2]"
              >
                <option value="before">Trước khi sử dụng EDU SMART</option>
                <option value="after">Sau khi sử dụng EDU SMART</option>
              </select>
            </div>
            <div className="text-sm text-[#52677e] sm:text-right font-mono-num">
              Tiến độ trả lời: {answeredCount}/{SURVEY_ITEMS.length} câu
            </div>
          </div>

          <div className="space-y-4">
            {SURVEY_ITEMS.map((question, qIndex) => (
              <fieldset
                key={qIndex}
                className="rounded-2xl border border-[#e2eaf2] p-4 sm:p-5 bg-[#fbfdff]"
              >
                <legend className="px-1 text-sm font-bold text-[#19324d]">
                  <span className="font-mono-num text-[#1677d2] mr-1.5">{qIndex + 1}.</span>
                  {question}
                </legend>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {LIKERT_LABELS.map((choice, idx) => {
                    const score = idx + 1;
                    const checked = answers[qIndex] === score;
                    return (
                      <label
                        key={score}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs sm:text-sm cursor-pointer transition-colors ${
                          checked
                            ? 'bg-[#eaf6ff] border-[#1677d2] text-[#105ca8] font-semibold'
                            : 'bg-white border-[#e2eaf2] text-[#52677e] hover:border-[#b7d6f2]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`survey-${qIndex}`}
                          value={score}
                          checked={checked}
                          onChange={() => handleSelect(qIndex, score)}
                          className="accent-[#1677d2]"
                        />
                        <span>{choice}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-sm text-[#991b1b]"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              aria-live="polite"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#a7f3d0] bg-[#e6faf4] p-4 text-sm text-[#08775e]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{successMsg}</span>
              </div>
              <button
                type="button"
                onClick={onNavigateStats}
                className="text-xs font-bold underline underline-offset-4 hover:text-[#065f46] whitespace-nowrap"
              >
                Xem thống kê so sánh →
              </button>
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Đang lưu khảo sát...' : 'Gửi khảo sát'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
