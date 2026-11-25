import React from 'react';
import { ArrowRight, CheckCircle2, Cloud } from 'lucide-react';
import {
  computeProgressStats,
  type AiSession,
  type FactCheckRecord,
  type SelfTestRecord,
  type StudyTask,
  type SurveySubmission,
  type ThinkReflection,
} from '../utils/eduLogic';
import type { AppPageId } from './Navbar';

interface ProgressPageProps {
  isAuthenticated: boolean;
  tasks: StudyTask[];
  thinks: ThinkReflection[];
  aiSessions: AiSession[];
  facts: FactCheckRecord[];
  tests: SelfTestRecord[];
  surveys: SurveySubmission[];
  onToggleTask: (taskId: string, done: boolean) => Promise<void>;
  onNavigate: (page: AppPageId) => void;
}

export function ProgressPage({
  isAuthenticated,
  tasks,
  thinks,
  aiSessions,
  facts,
  tests,
  surveys,
  onToggleTask,
  onNavigate,
}: ProgressPageProps) {
  const stats = computeProgressStats({
    tasks,
    thinks,
    aiSessions,
    facts,
    tests,
    surveys,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-[#13a887]">
            NHẬT KÝ TỰ HỌC CÁ NHÂN
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#174b78]">Tiến độ học tập cá nhân</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#52677e]">
          <Cloud className="w-4 h-4 text-[#1677d2]" aria-hidden="true" />
          <span>
            {isAuthenticated
              ? 'Đã đồng bộ dữ liệu trên tài khoản Google của bạn'
              : 'Đang lưu tạm trong phiên hiện tại · Đăng nhập để đồng bộ dài hạn'}
          </span>
        </div>
      </div>

      {/* 4-column KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e2eaf2] rounded-2xl p-5">
          <div className="font-mono-num text-3xl font-extrabold text-[#1677d2]">
            {stats.totalTasks}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#64748b]">Nhiệm vụ đã tạo</div>
        </div>
        <div className="bg-white border border-[#e2eaf2] rounded-2xl p-5">
          <div className="font-mono-num text-3xl font-extrabold text-[#13a887]">
            {stats.completedTasks}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#64748b]">Nhiệm vụ hoàn thành</div>
        </div>
        <div className="bg-white border border-[#e2eaf2] rounded-2xl p-5">
          <div className="font-mono-num text-3xl font-extrabold text-[#1677d2]">
            {stats.thinkCount}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#64748b]">Lượt Think First</div>
        </div>
        <div className="bg-white border border-[#e2eaf2] rounded-2xl p-5">
          <div className="font-mono-num text-3xl font-extrabold text-[#1677d2]">
            {stats.testCount}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#64748b]">Bài Self Test</div>
        </div>
      </div>

      {/* Completion Bar */}
      <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[#174b78]">Tỷ lệ hoàn thành nhiệm vụ</h2>
          <span className="font-mono-num text-sm font-bold text-[#1677d2]">
            {stats.completionPercent}% hoàn thành
          </span>
        </div>
        <div
          className="mt-3 h-3 rounded-full bg-[#e9f0f6] overflow-hidden"
          role="progressbar"
          aria-valuenow={stats.completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1677d2] to-[#13a887] transition-all duration-300"
            style={{ width: `${stats.completionPercent}%` }}
          />
        </div>
      </section>

      {/* Tasks + Recent Reflections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-[#174b78]">Nhiệm vụ Study Plan</h2>
            <button
              type="button"
              onClick={() => onNavigate('study')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1677d2] hover:underline"
            >
              Thêm nhiệm vụ
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#cbd5e1] p-6 text-center">
              <p className="text-sm text-[#64748b]">Chưa có nhiệm vụ nào được ghi nhận.</p>
              <button
                type="button"
                onClick={() => onNavigate('study')}
                className="mt-3 px-4 py-2 rounded-xl bg-[#eaf6ff] text-[#1677d2] text-xs font-bold hover:bg-[#d8eeff]"
              >
                Tạo nhiệm vụ đầu tiên
              </button>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-[#e2eaf2] p-3.5 flex items-start gap-3"
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(e) => onToggleTask(task.id, e.target.checked)}
                    aria-label={`Đánh dấu hoàn thành '${task.name}'`}
                    className="mt-1 w-4 h-4 accent-[#13a887]"
                  />
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-bold ${
                        task.done ? 'line-through text-[#64748b]' : 'text-[#19324d]'
                      }`}
                    >
                      {task.name}
                    </div>
                    <div className="text-xs text-[#64748b]">
                      {task.subject} · Hạn {task.dueDate} · {task.studySlot}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[#174b78] mb-4">Hồ sơ rèn luyện gần đây</h2>
          {thinks.length === 0 && facts.length === 0 && tests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#cbd5e1] p-6 text-center">
              <p className="text-sm text-[#64748b]">
                Các lượt Think First, Fact Check và Self Test của em sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {thinks.slice(0, 2).map((t) => (
                <div key={t.id} className="rounded-xl border border-[#e2eaf2] p-3.5">
                  <div className="text-xs font-bold text-[#1677d2]">
                    THINK FIRST · {t.subject}
                  </div>
                  <div className="mt-1 text-sm text-[#19324d] line-clamp-2">{t.answer}</div>
                </div>
              ))}
              {facts.slice(0, 2).map((f) => (
                <div key={f.id} className="rounded-xl border border-[#e2eaf2] p-3.5">
                  <div className="text-xs font-bold text-[#13a887]">
                    FACT CHECK · {f.source}
                  </div>
                  <div className="mt-1 text-sm text-[#19324d] line-clamp-2">{f.conclusion}</div>
                </div>
              ))}
              {tests.slice(0, 2).map((st) => (
                <div key={st.id} className="rounded-xl border border-[#e2eaf2] p-3.5 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#13a887] mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <div className="text-xs font-bold text-[#174b78]">
                      SELF TEST · {st.subject} · {st.lesson}
                    </div>
                    <div className="mt-0.5 text-xs text-[#64748b]">{st.level}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
