import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Lightbulb,
  Loader2,
  SearchCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CONFIDENCE_LEVELS,
  SELF_TEST_LEVELS,
  STUDY_SLOTS,
  SUBJECTS,
  THINK_PROMPTS,
  validateFactCheckInput,
  validateSelfTestInput,
  validateStudyTaskInput,
  validateThinkInput,
  type AiSession,
  type FactCheckRecord,
  type FactVerdict,
  type SelfTestRecord,
  type StudyTask,
  type ThinkReflection,
} from '../utils/eduLogic';
import type { StudyStepId } from './HomePage';

interface StudyWorkspacePageProps {
  activeStep: StudyStepId;
  onChangeStep: (step: StudyStepId) => void;
  tasks: StudyTask[];
  thinks: ThinkReflection[];
  aiSessions: AiSession[];
  facts: FactCheckRecord[];
  tests: SelfTestRecord[];
  onAddTask: (input: {
    name: string;
    subject: string;
    goal: string;
    dueDate: string;
    studySlot: string;
  }) => Promise<void>;
  onToggleTask: (taskId: string, done: boolean) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSaveThink: (input: {
    subject: string;
    question: string;
    answer: string;
    confidence: string;
  }) => Promise<void>;
  onSaveAiSession: (input: {
    subject: string;
    question: string;
    priorThinking?: string;
    guidance: string;
    model: string;
  }) => Promise<void>;
  onSaveFactCheck: (input: {
    content: string;
    source: string;
    conclusion: string;
    verdict: FactVerdict;
  }) => Promise<void>;
  onSaveSelfTest: (input: {
    subject: string;
    lesson: string;
    explain: string;
    apply: string;
    level: string;
  }) => Promise<void>;
}

const STEPS: Array<{
  id: StudyStepId;
  num: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'plan', num: '01', title: 'Study Plan', icon: CalendarClock },
  { id: 'think', num: '02', title: 'Think First', icon: Lightbulb },
  { id: 'coach', num: '03', title: 'AI Coach', icon: Sparkles },
  { id: 'fact', num: '04', title: 'Fact Check', icon: SearchCheck },
  { id: 'test', num: '05', title: 'Self Test', icon: ClipboardCheck },
];

export function StudyWorkspacePage({
  activeStep,
  onChangeStep,
  tasks,
  thinks,
  aiSessions,
  facts,
  tests,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSaveThink,
  onSaveAiSession,
  onSaveFactCheck,
  onSaveSelfTest,
}: StudyWorkspacePageProps) {
  // Step 1: Study Plan
  const [taskName, setTaskName] = useState('');
  const [taskSubject, setTaskSubject] = useState<string>(SUBJECTS[0]);
  const [taskGoal, setTaskGoal] = useState('');
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taskSlot, setTaskSlot] = useState<string>(STUDY_SLOTS[0]);
  const [taskFeedback, setTaskFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [taskBusy, setTaskBusy] = useState(false);

  // Step 2: Think First
  const [thinkSubject, setThinkSubject] = useState<string>(SUBJECTS[0]);
  const [thinkQuestion, setThinkQuestion] = useState<string>(THINK_PROMPTS[0]);
  const [thinkAnswer, setThinkAnswer] = useState('');
  const [thinkConfidence, setThinkConfidence] = useState<string>(CONFIDENCE_LEVELS[0]);
  const [thinkFeedback, setThinkFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [thinkBusy, setThinkBusy] = useState(false);

  // Step 3: AI Coach
  const [aiSubject, setAiSubject] = useState<string>(SUBJECTS[0]);
  const [aiMode, setAiMode] = useState<'hint' | 'outline' | 'check_reasoning'>('hint');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiPriorThinking, setAiPriorThinking] = useState('');
  const [aiFeedback, setAiFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [latestGuidance, setLatestGuidance] = useState<string | null>(null);

  // Step 4: Fact Check
  const [factContent, setFactContent] = useState('');
  const [factSource, setFactSource] = useState('');
  const [factConclusion, setFactConclusion] = useState('');
  const [factVerdict, setFactVerdict] = useState<FactVerdict>('accurate');
  const [factFeedback, setFactFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [factBusy, setFactBusy] = useState(false);

  // Step 5: Self Test
  const [testSubject, setTestSubject] = useState<string>(SUBJECTS[0]);
  const [testLesson, setTestLesson] = useState('');
  const [testExplain, setTestExplain] = useState('');
  const [testApply, setTestApply] = useState('');
  const [testLevel, setTestLevel] = useState<string>(SELF_TEST_LEVELS[0]);
  const [testFeedback, setTestFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [testBusy, setTestBusy] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFeedback(null);
    const err = validateStudyTaskInput({
      name: taskName,
      subject: taskSubject,
      goal: taskGoal,
      dueDate: taskDate,
      studySlot: taskSlot,
    });
    if (err) {
      setTaskFeedback({ type: 'error', text: err });
      return;
    }
    setTaskBusy(true);
    try {
      await onAddTask({
        name: taskName,
        subject: taskSubject,
        goal: taskGoal,
        dueDate: taskDate,
        studySlot: taskSlot,
      });
      setTaskName('');
      setTaskGoal('');
      setTaskFeedback({ type: 'success', text: 'Đã thêm nhiệm vụ mới vào kế hoạch tự học.' });
    } catch (error) {
      setTaskFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể thêm nhiệm vụ.',
      });
    } finally {
      setTaskBusy(false);
    }
  };

  const handleSaveThink = async (e: React.FormEvent) => {
    e.preventDefault();
    setThinkFeedback(null);
    const err = validateThinkInput({
      subject: thinkSubject,
      question: thinkQuestion,
      answer: thinkAnswer,
      confidence: thinkConfidence,
    });
    if (err) {
      setThinkFeedback({ type: 'error', text: err });
      return;
    }
    setThinkBusy(true);
    try {
      await onSaveThink({
        subject: thinkSubject,
        question: thinkQuestion,
        answer: thinkAnswer,
        confidence: thinkConfidence,
      });
      setAiSubject(thinkSubject);
      setAiPriorThinking(thinkAnswer.trim());
      setThinkAnswer('');
      setThinkFeedback({
        type: 'success',
        text: 'Đã ghi nhận suy nghĩ ban đầu. Hệ thống đánh giá cao quá trình tự lập luận trước khi dùng AI.',
      });
    } catch (error) {
      setThinkFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể lưu suy nghĩ ban đầu.',
      });
    } finally {
      setThinkBusy(false);
    }
  };

  const handleAskAiCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiFeedback(null);
    if (!aiQuestion.trim()) {
      setAiFeedback({ type: 'error', text: 'Vui lòng nhập nội dung câu hỏi cần gợi mở.' });
      return;
    }
    setAiBusy(true);
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: aiSubject,
          question: aiQuestion.trim(),
          priorThinking: aiPriorThinking.trim(),
          mode: aiMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'AI Coach tạm thời chưa phản hồi.');
      }

      setLatestGuidance(data.guidance);
      await onSaveAiSession({
        subject: aiSubject,
        question: aiQuestion.trim(),
        priorThinking: aiPriorThinking.trim() || undefined,
        guidance: data.guidance,
        model: data.model || 'gemini-4-hydrogen',
      });
      setAiFeedback({
        type: 'success',
        text: 'AI Coach đã tạo gợi mở từng bước. Hãy đối chiếu với sách giáo khoa ở bước Fact Check.',
      });
    } catch (error) {
      setAiFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể kết nối AI Coach.',
      });
    } finally {
      setAiBusy(false);
    }
  };

  const handleSaveFact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFactFeedback(null);
    const err = validateFactCheckInput({
      content: factContent,
      source: factSource,
      conclusion: factConclusion,
    });
    if (err) {
      setFactFeedback({ type: 'error', text: err });
      return;
    }
    setFactBusy(true);
    try {
      await onSaveFactCheck({
        content: factContent,
        source: factSource,
        conclusion: factConclusion,
        verdict: factVerdict,
      });
      setFactContent('');
      setFactSource('');
      setFactConclusion('');
      setFactFeedback({ type: 'success', text: 'Đã lưu phiếu kiểm chứng thông tin.' });
    } catch (error) {
      setFactFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể lưu phiếu kiểm chứng.',
      });
    } finally {
      setFactBusy(false);
    }
  };

  const handleSaveSelfTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestFeedback(null);
    const err = validateSelfTestInput({
      subject: testSubject,
      lesson: testLesson,
      explain: testExplain,
      apply: testApply,
      level: testLevel,
    });
    if (err) {
      setTestFeedback({ type: 'error', text: err });
      return;
    }
    setTestBusy(true);
    try {
      await onSaveSelfTest({
        subject: testSubject,
        lesson: testLesson,
        explain: testExplain,
        apply: testApply,
        level: testLevel,
      });
      setTestLesson('');
      setTestExplain('');
      setTestApply('');
      setTestFeedback({ type: 'success', text: 'Đã hoàn thành và lưu bài tự kiểm tra kiến thức.' });
    } catch (error) {
      setTestFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể lưu bài tự kiểm tra.',
      });
    } finally {
      setTestBusy(false);
    }
  };

  const renderFeedback = (fb: { type: 'error' | 'success'; text: string } | null) => {
    if (!fb) return null;
    if (fb.type === 'error') {
      return (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-sm text-[#991b1b]"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{fb.text}</span>
        </div>
      );
    }
    return (
      <div
        aria-live="polite"
        className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#a7f3d0] bg-[#e6faf4] p-3.5 text-sm text-[#08775e]"
      >
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span>{fb.text}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-[#13a887]">
            KHÔNG GIAN HỌC TẬP 5 BƯỚC
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#174b78]">
            Thực hành tự học có hướng dẫn
          </h1>
        </div>

        {/* Step Navigation Segmented Control */}
        <div
          role="tablist"
          aria-label="Các bước học tập"
          className="flex flex-wrap gap-1.5 bg-white border border-[#e2eaf2] p-1.5 rounded-2xl"
        >
          {STEPS.map((s) => {
            const Icon = s.icon;
            const active = activeStep === s.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeStep(s.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap ${
                  active
                    ? 'bg-[#1677d2] text-white'
                    : 'text-[#52677e] hover:bg-[#eaf6ff] hover:text-[#1677d2]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="font-mono-num">{s.num}.</span>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 01. STUDY PLAN */}
      {activeStep === 'plan' && (
        <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#174b78]">01. STUDY PLAN – Lập kế hoạch học tập</h2>
              <p className="text-sm text-[#64748b] mt-1">
                Chia nhỏ nhiệm vụ và gắn với khung giờ tự học nội trú để dễ hoàn thành.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeStep('think')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1677d2] hover:text-[#105ca8] whitespace-nowrap"
            >
              Bước tiếp: Think First
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-name" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Nhiệm vụ học tập
                </label>
                <input
                  id="task-name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Ví dụ: Ôn tập bài 5 Lịch sử"
                  className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                />
              </div>

              <div>
                <label htmlFor="task-subject" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Môn học
                </label>
                <select
                  id="task-subject"
                  value={taskSubject}
                  onChange={(e) => setTaskSubject(e.target.value)}
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                >
                  {SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="task-goal" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Mục tiêu cần đạt
                </label>
                <input
                  id="task-goal"
                  value={taskGoal}
                  onChange={(e) => setTaskGoal(e.target.value)}
                  placeholder="Ví dụ: Nắm vững kiến thức trọng tâm và vẽ sơ đồ tư duy"
                  className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                />
              </div>

              <div>
                <label htmlFor="task-date" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Hạn hoàn thành
                </label>
                <input
                  id="task-date"
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="task-slot" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Thời gian dự kiến trong giờ tự học
              </label>
              <select
                id="task-slot"
                value={taskSlot}
                onChange={(e) => setTaskSlot(e.target.value)}
                className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              >
                {STUDY_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={taskBusy}
              className="px-5 py-2.5 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 transition-colors"
            >
              {taskBusy ? 'Đang thêm...' : 'Thêm nhiệm vụ'}
            </button>
          </form>

          {renderFeedback(taskFeedback)}

          <div className="mt-7 pt-6 border-t border-[#e2eaf2]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#19324d]">
                Danh sách nhiệm vụ ({tasks.length})
              </h3>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-[#64748b]">
                Chưa có nhiệm vụ nào. Hãy thêm nhiệm vụ đầu tiên cho giờ tự học hôm nay.
              </p>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-xl border border-[#e2eaf2] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbfdff]"
                  >
                    <div className="space-y-1 min-w-0">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={(e) => onToggleTask(task.id, e.target.checked)}
                          className="mt-1 w-4 h-4 accent-[#13a887]"
                        />
                        <span
                          className={`text-sm font-bold ${
                            task.done ? 'line-through text-[#64748b]' : 'text-[#19324d]'
                          }`}
                        >
                          {task.name}
                        </span>
                      </label>
                      <p className="text-xs text-[#64748b] pl-6">
                        {task.subject} · Hạn: <span className="font-mono-num">{task.dueDate}</span> · {task.studySlot}
                      </p>
                      <p className="text-xs text-[#52677e] pl-6">Mục tiêu: {task.goal}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      aria-label={`Xóa nhiệm vụ '${task.name}'`}
                      className="self-end sm:self-center inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#b91c1c] hover:bg-[#fef2f2] transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* 02. THINK FIRST */}
      {activeStep === 'think' && (
        <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#174b78]">
                02. THINK FIRST – Tư duy trước khi sử dụng AI
              </h2>
              <p className="text-sm text-[#64748b] mt-1">
                Diễn đạt cách hiểu và hướng giải quyết của riêng em trước khi nhờ AI gợi mở.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeStep('coach')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1677d2] hover:text-[#105ca8] whitespace-nowrap"
            >
              Bước tiếp: AI Coach
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSaveThink} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="think-subject" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Chọn môn học
                </label>
                <select
                  id="think-subject"
                  value={thinkSubject}
                  onChange={(e) => setThinkSubject(e.target.value)}
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                >
                  {SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="think-confidence" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Mức độ tự tin
                </label>
                <select
                  id="think-confidence"
                  value={thinkConfidence}
                  onChange={(e) => setThinkConfidence(e.target.value)}
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                >
                  {CONFIDENCE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="think-prompt" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Câu hỏi gợi ý
              </label>
              <select
                id="think-prompt"
                value={thinkQuestion}
                onChange={(e) => setThinkQuestion(e.target.value)}
                className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              >
                {THINK_PROMPTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="think-answer" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Suy nghĩ và lập luận ban đầu của em
              </label>
              <textarea
                id="think-answer"
                rows={4}
                value={thinkAnswer}
                onChange={(e) => setThinkAnswer(e.target.value)}
                placeholder="Hãy trình bày suy nghĩ, giả thuyết hoặc bước giải dự kiến của em trước khi hỏi AI..."
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <button
              type="submit"
              disabled={thinkBusy}
              className="px-5 py-2.5 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 transition-colors"
            >
              {thinkBusy ? 'Đang lưu...' : 'Lưu suy nghĩ ban đầu'}
            </button>
          </form>

          {renderFeedback(thinkFeedback)}

          {thinks.length > 0 && (
            <div className="mt-7 pt-6 border-t border-[#e2eaf2] space-y-3">
              <h3 className="text-base font-bold text-[#19324d]">
                Nhật ký Think First gần đây ({thinks.length})
              </h3>
              {thinks.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748b]">
                    <span>
                      {item.subject} · Mức tự tin: {item.confidence}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAiSubject(item.subject);
                        setAiPriorThinking(item.answer);
                        onChangeStep('coach');
                      }}
                      className="font-bold text-[#1677d2] hover:underline"
                    >
                      Đưa sang AI Coach →
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs font-bold text-[#19324d]">{item.question}</p>
                  <p className="mt-1 text-sm text-[#52677e] whitespace-pre-wrap">{item.answer}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 03. AI COACH */}
      {activeStep === 'coach' && (
        <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#174b78]">
                03. AI COACH – Trợ lý AI gợi mở tư duy
              </h2>
              <p className="text-sm text-[#64748b] mt-1">
                AI Coach gợi mở từng bước và đặt câu hỏi dẫn dắt, không làm thay hoặc đưa ngay đáp án chép sẵn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeStep('fact')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1677d2] hover:text-[#105ca8] whitespace-nowrap"
            >
              Bước tiếp: Fact Check
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleAskAiCoach} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ai-subject" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Môn học
                </label>
                <select
                  id="ai-subject"
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                >
                  {SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ai-mode" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Chế độ hỗ trợ
                </label>
                <select
                  id="ai-mode"
                  value={aiMode}
                  onChange={(e) =>
                    setAiMode(e.target.value as 'hint' | 'outline' | 'check_reasoning')
                  }
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                >
                  <option value="hint">Gợi mở từng bước</option>
                  <option value="outline">Gợi ý dàn ý tư duy</option>
                  <option value="check_reasoning">Phản biện lập luận Think First</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="ai-prior" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Suy nghĩ ban đầu của em (tùy chọn – lấy từ Think First)
              </label>
              <textarea
                id="ai-prior"
                rows={2}
                value={aiPriorThinking}
                onChange={(e) => setAiPriorThinking(e.target.value)}
                placeholder="Tóm tắt cách em đã thử tiếp cận vấn đề..."
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <div>
              <label htmlFor="ai-question" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Nội dung em cần hỗ trợ
              </label>
              <textarea
                id="ai-question"
                rows={4}
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Nhập câu hỏi, đề bài hoặc khái niệm em đang gặp khó khăn..."
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <button
              type="submit"
              disabled={aiBusy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 transition-colors"
            >
              {aiBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Đang phân tích gợi mở...
                </>
              ) : (
                'Yêu cầu gợi mở'
              )}
            </button>
          </form>

          {renderFeedback(aiFeedback)}

          {latestGuidance && (
            <div className="mt-5 rounded-2xl border border-[#cce0f4] bg-[#f5faff] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-[#125d9e]">Gợi mở từ AI Coach</h3>
                <button
                  type="button"
                  onClick={() => {
                    setFactContent(latestGuidance);
                    onChangeStep('fact');
                  }}
                  className="text-xs font-bold text-[#1677d2] hover:underline"
                >
                  Đem đi kiểm chứng (Fact Check) →
                </button>
              </div>
              <div className="text-sm text-[#19324d] whitespace-pre-wrap leading-relaxed">
                {latestGuidance}
              </div>
            </div>
          )}

          {aiSessions.length > 0 && (
            <div className="mt-7 pt-6 border-t border-[#e2eaf2] space-y-3">
              <h3 className="text-base font-bold text-[#19324d]">
                Lịch sử phiên gợi mở ({aiSessions.length})
              </h3>
              {aiSessions.slice(0, 3).map((sess) => (
                <div key={sess.id} className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
                  <p className="text-xs text-[#64748b]">
                    {sess.subject} · Mô hình: {sess.model}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#19324d]">{sess.question}</p>
                  <p className="mt-1.5 text-sm text-[#52677e] whitespace-pre-wrap line-clamp-4">
                    {sess.guidance}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 04. FACT CHECK */}
      {activeStep === 'fact' && (
        <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#174b78]">
                04. FACT CHECK – Kiểm chứng thông tin
              </h2>
              <p className="text-sm text-[#64748b] mt-1">
                Đối chiếu câu trả lời của AI với sách giáo khoa, vở ghi và nguồn học thuật tin cậy.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onChangeStep('test')}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1677d2] hover:text-[#105ca8] whitespace-nowrap"
            >
              Bước tiếp: Self Test
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSaveFact} className="space-y-4">
            <div>
              <label htmlFor="fact-content" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Thông tin hoặc câu trả lời AI cần kiểm chứng
              </label>
              <textarea
                id="fact-content"
                rows={3}
                value={factContent}
                onChange={(e) => setFactContent(e.target.value)}
                placeholder="Dán nội dung hoặc nhận định cần kiểm chứng..."
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fact-source" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Nguồn đối chiếu (SGK, tài liệu, trang, đường dẫn)
                </label>
                <input
                  id="fact-source"
                  value={factSource}
                  onChange={(e) => setFactSource(e.target.value)}
                  placeholder="Ví dụ: SGK Ngữ văn 11 Tập 1, trang 42"
                  className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                />
              </div>

              <div>
                <label htmlFor="fact-verdict" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Kết quả đối chiếu
                </label>
                <select
                  id="fact-verdict"
                  value={factVerdict}
                  onChange={(e) => setFactVerdict(e.target.value as FactVerdict)}
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                >
                  <option value="accurate">Chính xác theo nguồn đối chiếu</option>
                  <option value="needs_revision">Đúng một phần, cần bổ sung/chỉnh sửa</option>
                  <option value="inaccurate">Chưa chính xác / cần loại bỏ</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="fact-conclusion" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Nhận xét và kết luận của em
              </label>
              <textarea
                id="fact-conclusion"
                rows={3}
                value={factConclusion}
                onChange={(e) => setFactConclusion(e.target.value)}
                placeholder="Nội dung nào chính xác? Nội dung nào cần sửa lại? Vì sao?"
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <button
              type="submit"
              disabled={factBusy}
              className="px-5 py-2.5 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 transition-colors"
            >
              {factBusy ? 'Đang lưu...' : 'Lưu phiếu kiểm chứng'}
            </button>
          </form>

          {renderFeedback(factFeedback)}

          {facts.length > 0 && (
            <div className="mt-7 pt-6 border-t border-[#e2eaf2] space-y-3">
              <h3 className="text-base font-bold text-[#19324d]">
                Phiếu kiểm chứng đã lưu ({facts.length})
              </h3>
              {facts.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
                  <p className="text-xs text-[#64748b]">
                    Nguồn: {item.source} · Đánh giá:{' '}
                    {item.verdict === 'accurate'
                      ? 'Chính xác'
                      : item.verdict === 'needs_revision'
                        ? 'Cần chỉnh sửa'
                        : 'Chưa chính xác'}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#19324d]">{item.conclusion}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 05. SELF TEST */}
      {activeStep === 'test' && (
        <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#174b78]">
              05. SELF TEST – Tự kiểm tra kiến thức
            </h2>
            <p className="text-sm text-[#64748b] mt-1">
              Trình bày lại kiến thức bằng ngôn ngữ của chính em và nêu ví dụ vận dụng thực tế.
            </p>
          </div>

          <form onSubmit={handleSaveSelfTest} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="test-subject" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Môn học
                </label>
                <select
                  id="test-subject"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                >
                  {SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="test-lesson" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Nội dung bài học
                </label>
                <input
                  id="test-lesson"
                  value={testLesson}
                  onChange={(e) => setTestLesson(e.target.value)}
                  placeholder="Nhập tên bài học hoặc chuyên đề"
                  className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="test-explain" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Em hãy giải thích kiến thức bằng ngôn ngữ của mình
              </label>
              <textarea
                id="test-explain"
                rows={4}
                value={testExplain}
                onChange={(e) => setTestExplain(e.target.value)}
                placeholder="Trình bày bản chất kiến thức theo cách hiểu của em..."
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <div>
              <label htmlFor="test-apply" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Em có thể vận dụng kiến thức vào tình huống mới nào?
              </label>
              <textarea
                id="test-apply"
                rows={3}
                value={testApply}
                onChange={(e) => setTestApply(e.target.value)}
                placeholder="Nêu ví dụ bài toán mới hoặc tình huống thực tiễn..."
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <div>
              <label htmlFor="test-level" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Tự đánh giá mức độ hiểu bài
              </label>
              <select
                id="test-level"
                value={testLevel}
                onChange={(e) => setTestLevel(e.target.value)}
                className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              >
                {SELF_TEST_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={testBusy}
              className="px-5 py-2.5 rounded-xl bg-[#13a887] text-white text-sm font-bold hover:bg-[#0e8a6f] disabled:opacity-60 transition-colors"
            >
              {testBusy ? 'Đang lưu...' : 'Hoàn thành tự kiểm tra'}
            </button>
          </form>

          {renderFeedback(testFeedback)}

          {tests.length > 0 && (
            <div className="mt-7 pt-6 border-t border-[#e2eaf2] space-y-3">
              <h3 className="text-base font-bold text-[#19324d]">
                Bài tự kiểm tra gần đây ({tests.length})
              </h3>
              {tests.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl border border-[#e2eaf2] p-4 bg-[#fbfdff]">
                  <p className="text-xs text-[#64748b]">
                    {item.subject} · {item.lesson} · Tự đánh giá: {item.level}
                  </p>
                  <p className="mt-1 text-sm text-[#19324d]">{item.explain}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
