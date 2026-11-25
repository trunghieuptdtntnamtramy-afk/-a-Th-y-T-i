import React from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Lightbulb,
  LineChart,
  SearchCheck,
  Sparkles,
} from 'lucide-react';
import type { AppPageId } from './Navbar';

export type StudyStepId = 'plan' | 'think' | 'coach' | 'fact' | 'test';

interface HomePageProps {
  onNavigate: (page: AppPageId) => void;
  onOpenStudyStep: (step: StudyStepId) => void;
}

const MODULES: Array<{
  num: string;
  title: string;
  desc: string;
  step?: StudyStepId;
  page?: AppPageId;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    num: '01',
    title: 'STUDY PLAN',
    desc: 'Lập nhiệm vụ, xác định mục tiêu và điều chỉnh kế hoạch học tập phù hợp lịch nội trú.',
    step: 'plan',
    icon: CalendarClock,
  },
  {
    num: '02',
    title: 'THINK FIRST',
    desc: 'Trình bày suy nghĩ, lập luận và mức độ tự tin trước khi sử dụng trí tuệ nhân tạo.',
    step: 'think',
    icon: Lightbulb,
  },
  {
    num: '03',
    title: 'AI COACH',
    desc: 'Trợ lý AI gợi mở, đặt câu hỏi dẫn dắt và hướng dẫn học sinh tư duy từng bước.',
    step: 'coach',
    icon: Sparkles,
  },
  {
    num: '04',
    title: 'FACT CHECK',
    desc: 'Kiểm tra nguồn, đối chiếu sách giáo khoa và đánh giá độ chính xác của câu trả lời AI.',
    step: 'fact',
    icon: SearchCheck,
  },
  {
    num: '05',
    title: 'SELF TEST',
    desc: 'Tự kiểm tra kiến thức, diễn đạt bằng ngôn ngữ bản thân và liên hệ tình huống vận dụng.',
    step: 'test',
    icon: ClipboardCheck,
  },
  {
    num: '06',
    title: 'THEO DÕI TIẾN ĐỘ',
    desc: 'Ghi nhận hoạt động tự học theo thời gian và đối chiếu năng lực trước – sau khi học.',
    page: 'progress',
    icon: LineChart,
  },
];

const CYCLE_STEPS: Array<{ step: StudyStepId; num: string; label: string; note: string }> = [
  { step: 'plan', num: '01', label: 'Lập kế hoạch', note: 'Xác định mục tiêu & giờ tự học' },
  { step: 'think', num: '02', label: 'Tự suy nghĩ', note: 'Ghi lại lập luận ban đầu' },
  { step: 'coach', num: '03', label: 'Gợi mở từ AI', note: 'Nhận câu hỏi dẫn dắt từng bước' },
  { step: 'fact', num: '04', label: 'Kiểm chứng', note: 'Đối chiếu SGK & nguồn tin cậy' },
  { step: 'test', num: '05', label: 'Tự kiểm tra', note: 'Giải thích & vận dụng thực tế' },
];

export function HomePage({ onNavigate, onOpenStudyStep }: HomePageProps) {
  return (
    <div className="space-y-10">
      {/* Institutional Quote & School Identity */}
      <section className="rounded-2xl bg-white border border-[#e2eaf2] overflow-hidden">
        <div className="bg-[#e8f5ff] px-5 py-2.5 text-center text-xs sm:text-sm italic text-[#245b88]">
          “Trong cách học phải lấy tự học làm cốt. Học ở trường, trong sách vở, học lẫn nhau và học dân” – Chủ tịch Hồ Chí Minh.
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-xs font-bold tracking-wider text-[#155e9b]">
            SỞ GIÁO DỤC VÀ ĐÀO TẠO THÀNH PHỐ ĐÀ NẴNG
          </p>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#123e68] mt-1">
            TRƯỜNG PTDTNT THPT QUẢNG NAM
          </h2>
        </div>
      </section>

      {/* Hero Split */}
      <section className="rounded-3xl bg-gradient-to-br from-[#e5f4ff] via-[#eff9ff] to-[#e4fbf4] border border-[#d7e8f7] p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-extrabold tracking-widest text-[#13a887]">
                HỆ SINH THÁI HỌC TẬP THÔNG MINH
              </p>
              <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold text-[#125d9e] leading-[1.15]">
                Học tập chủ động.
                <br />
                Tư duy độc lập.
              </h1>
              <p className="mt-4 text-base text-[#506b83] max-w-2xl leading-relaxed">
                EDU SMART đồng hành cùng học sinh nội trú trong việc xây dựng thói quen tự học có kế hoạch, rèn luyện tư duy phản biện và sử dụng trí tuệ nhân tạo một cách có trách nhiệm.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('study')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] transition-colors whitespace-nowrap"
              >
                Bắt đầu học tập
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('survey')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#cce0f4] text-[#1677d2] text-sm font-bold hover:bg-[#eaf6ff] transition-colors whitespace-nowrap"
              >
                Thực hiện khảo sát
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-[#dce9f5] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#eef4f9]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#eaf6ff] text-[#1677d2] flex items-center justify-center">
                  <BookOpenCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#123e68]">Chu trình tự học 5 bước</h2>
                  <p className="text-xs text-[#64748b]">Học có kế hoạch · Nghĩ trước · Kiểm chứng</p>
                </div>
              </div>
            </div>

            <ol className="mt-4 space-y-2.5">
              {CYCLE_STEPS.map((item) => (
                <li key={item.step}>
                  <button
                    type="button"
                    onClick={() => onOpenStudyStep(item.step)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl border border-[#eef4f9] hover:border-[#b9daf7] hover:bg-[#f5faff] transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono-num text-xs font-bold text-[#1677d2] shrink-0">
                        {item.num}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#19324d] truncate">
                          {item.label}
                        </div>
                        <div className="text-xs text-[#64748b] truncate">{item.note}</div>
                      </div>
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-[#94a3b8] group-hover:text-[#1677d2] shrink-0 transition-colors"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 05 Modules + Progress */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-[#174b78]">05 phân hệ học tập cốt lõi</h2>
            <p className="text-sm text-[#64748b] mt-1">
              Chọn một phân hệ bên dưới để mở trực tiếp không gian thực hành tương ứng.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.num}
                type="button"
                onClick={() => {
                  if (mod.step) onOpenStudyStep(mod.step);
                  else if (mod.page) onNavigate(mod.page);
                }}
                className="text-left bg-white border border-[#e2eaf2] rounded-2xl p-5 hover:border-[#9ec8ee] hover:shadow-sm transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="font-mono-num text-xs font-bold text-[#13a887]">
                      PHÂN HỆ {mod.num}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#eaf6ff] text-[#1677d2] flex items-center justify-center">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#205c8d]">{mod.title}</h3>
                  <p className="mt-1.5 text-sm text-[#64748b] leading-relaxed">{mod.desc}</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1677d2]">
                  <span>Mở phân hệ</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Pedagogical Principle Banner */}
      <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#13a887] mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-[#174b78]">Quy trình học tập thông minh</h3>
            <p className="text-sm text-[#52677e] mt-1">
              01. Lập kế hoạch → 02. Tự suy nghĩ → 03. Nhận gợi mở từ AI → 04. Kiểm chứng → 05. Tự kiểm tra.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('workspace')}
          className="px-4 py-2.5 rounded-xl bg-[#eaf6ff] text-[#1677d2] text-sm font-bold hover:bg-[#d8eeff] transition-colors whitespace-nowrap shrink-0"
        >
          Kết nối Google Workspace
        </button>
      </section>
    </div>
  );
}
