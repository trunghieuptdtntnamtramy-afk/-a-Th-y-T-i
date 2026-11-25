import React from 'react';
import { BarChart3 } from 'lucide-react';
import {
  computeProgressStats,
  computeSurveyComparison,
  type AiSession,
  type FactCheckRecord,
  type SelfTestRecord,
  type StudyTask,
  type SurveySubmission,
  type ThinkReflection,
} from '../utils/eduLogic';

interface StatsPageProps {
  tasks: StudyTask[];
  thinks: ThinkReflection[];
  aiSessions: AiSession[];
  facts: FactCheckRecord[];
  tests: SelfTestRecord[];
  surveys: SurveySubmission[];
  onGoSurvey: () => void;
}

export function StatsPage({
  tasks,
  thinks,
  aiSessions,
  facts,
  tests,
  surveys,
  onGoSurvey,
}: StatsPageProps) {
  const stats = computeProgressStats({
    tasks,
    thinks,
    aiSessions,
    facts,
    tests,
    surveys,
  });
  const comparison = computeSurveyComparison(surveys);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-[#13a887]">
          DỮ LIỆU HOẠT ĐỘNG THỰC TẾ
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#174b78]">Thống kê học tập</h1>
      </div>

      <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6">
        <h2 className="text-lg font-bold text-[#174b78] mb-4">Tổng quan hoạt động</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
            <div className="font-mono-num text-2xl font-extrabold text-[#1677d2]">
              {stats.surveyCount}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#64748b]">Lượt khảo sát</div>
          </div>
          <div className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
            <div className="font-mono-num text-2xl font-extrabold text-[#1677d2]">
              {stats.factCount}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#64748b]">Phiếu Fact Check</div>
          </div>
          <div className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
            <div className="font-mono-num text-2xl font-extrabold text-[#1677d2]">
              {stats.aiCount}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#64748b]">Lượt yêu cầu AI</div>
          </div>
          <div className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
            <div className="font-mono-num text-2xl font-extrabold text-[#13a887]">
              {stats.testCount}
            </div>
            <div className="mt-1 text-xs font-semibold text-[#64748b]">Bài tự kiểm tra</div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1677d2]" aria-hidden="true" />
            <h2 className="text-lg font-bold text-[#174b78]">Đánh giá trước và sau</h2>
          </div>
          <button
            type="button"
            onClick={onGoSurvey}
            className="px-3.5 py-2 rounded-xl bg-[#eaf6ff] text-[#1677d2] text-xs font-bold hover:bg-[#d8eeff] transition-colors"
          >
            Thực hiện thêm khảo sát
          </button>
        </div>

        {comparison.beforeAverage === null || comparison.afterAverage === null ? (
          <div className="rounded-xl border border-[#f4dfae] bg-[#fff8e8] p-4 text-sm text-[#795b1d]">
            {comparison.beforeCount === 0 && comparison.afterCount === 0
              ? 'Chưa có dữ liệu khảo sát. Cần ít nhất 1 lượt khảo sát Trước và 1 lượt khảo sát Sau để so sánh.'
              : `Hiện có ${comparison.beforeCount} lượt khảo sát Trước và ${comparison.afterCount} lượt khảo sát Sau. Cần đủ cả hai đợt để hiển thị bảng đối chiếu.`}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
                <div className="text-xs font-semibold text-[#64748b]">Trung bình Trước</div>
                <div className="mt-1 font-mono-num text-2xl font-extrabold text-[#19324d]">
                  {comparison.beforeAverage.toFixed(2)} / 5
                </div>
                <div className="text-xs text-[#64748b] font-mono-num">
                  {comparison.beforeCount} lượt
                </div>
              </div>
              <div className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
                <div className="text-xs font-semibold text-[#64748b]">Trung bình Sau</div>
                <div className="mt-1 font-mono-num text-2xl font-extrabold text-[#1677d2]">
                  {comparison.afterAverage.toFixed(2)} / 5
                </div>
                <div className="text-xs text-[#64748b] font-mono-num">
                  {comparison.afterCount} lượt
                </div>
              </div>
              <div className="rounded-xl border border-[#a7f3d0] p-4 bg-[#e6faf4]">
                <div className="text-xs font-semibold text-[#08775e]">Mức chênh lệch</div>
                <div className="mt-1 font-mono-num text-2xl font-extrabold text-[#08775e]">
                  {comparison.delta !== null && comparison.delta >= 0 ? '+' : ''}
                  {comparison.delta?.toFixed(2)}
                </div>
                <div className="text-xs text-[#08775e]">So với trước khi sử dụng</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#e2eaf2] text-xs font-bold text-[#64748b]">
                    <th className="py-2.5 pr-4">Tiêu chí khảo sát</th>
                    <th className="py-2.5 px-3 text-right">Trước</th>
                    <th className="py-2.5 px-3 text-right">Sau</th>
                    <th className="py-2.5 pl-3 text-right">Thay đổi</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.perItem.map((row) => (
                    <tr key={row.index} className="border-b border-[#eef4f9] hover:bg-[#f8fbff]">
                      <td className="py-3 pr-4 text-[#19324d]">
                        <span className="font-mono-num text-xs text-[#1677d2] mr-1.5">
                          {row.index + 1}.
                        </span>
                        {row.question}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-[#52677e]">
                        {row.beforeAvg?.toFixed(2) ?? '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-[#1677d2]">
                        {row.afterAvg?.toFixed(2) ?? '—'}
                      </td>
                      <td
                        className={`py-3 pl-3 text-right font-mono-num font-bold ${
                          (row.delta ?? 0) >= 0 ? 'text-[#08775e]' : 'text-[#b91c1c]'
                        }`}
                      >
                        {row.delta !== null ? `${row.delta >= 0 ? '+' : ''}${row.delta.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="text-xs text-[#64748b]">
          Số liệu đối chiếu chỉ được tổng hợp từ các lượt khảo sát thực tế đã ghi nhận; không sử dụng dữ liệu minh họa thay cho kết quả nghiên cứu.
        </p>
      </section>
    </div>
  );
}
