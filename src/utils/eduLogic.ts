export const SUBJECTS = [
  'Toán học',
  'Ngữ văn',
  'Tiếng Anh',
  'Lịch sử',
  'Địa lí',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Tin học',
  'Công nghệ',
  'Giáo dục kinh tế và pháp luật',
  'Giáo dục quốc phòng và an ninh',
  'Giáo dục thể chất',
  'Hoạt động trải nghiệm, hướng nghiệp',
  'Chuyên đề học tập',
] as const;

export const STUDY_SLOTS = [
  'Giờ tự học buổi tối',
  'Giờ tự học buổi chiều',
  'Thời gian cá nhân phù hợp',
] as const;

export const THINK_PROMPTS = [
  'Vì sao cần xây dựng kế hoạch tự học phù hợp với mục tiêu?',
  'Theo em, làm thế nào để kiểm chứng một thông tin do AI cung cấp?',
  'Khi gặp một vấn đề khó, em thường lựa chọn cách giải quyết nào?',
  'Em hãy trình bày một kiến thức đã học bằng cách hiểu của mình.',
] as const;

export const CONFIDENCE_LEVELS = [
  'Rất tự tin',
  'Tương đối tự tin',
  'Chưa chắc chắn',
  'Cần được gợi ý thêm',
] as const;

export const SELF_TEST_LEVELS = [
  'Đã hiểu rõ',
  'Hiểu phần lớn nội dung',
  'Còn một số nội dung chưa hiểu',
  'Cần ôn tập lại',
] as const;

export const SURVEY_ITEMS = [
  'Em có thường tự đặt mục tiêu học tập trước khi bắt đầu học không?',
  'Em có lập kế hoạch và sắp xếp thời gian tự học phù hợp không?',
  'Khi gặp bài khó, em có tự suy nghĩ trước khi tìm lời giải không?',
  'Em có thể giải thích kiến thức bằng ngôn ngữ của bản thân không?',
  'Em có thường sử dụng AI để hỗ trợ học tập không?',
  'Em có kiểm tra nguồn và đối chiếu câu trả lời AI với sách giáo khoa không?',
  'Em có thể vận dụng kiến thức đã học vào tình huống mới không?',
] as const;

export const LIKERT_LABELS = [
  '1 – Chưa bao giờ',
  '2 – Hiếm khi',
  '3 – Thỉnh thoảng',
  '4 – Thường xuyên',
  '5 – Luôn luôn',
] as const;

// Schema constants synchronized with firebase-blueprint.json & firestore.rules
export const SCHEMA_LIMITS = {
  ID_MAX: 128,
  ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  DATE_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  DISPLAY_NAME_MAX: 100,
  CLASS_NAME_MAX: 40,
  SUBJECT_TEACHER_MAX: 80,
  EMAIL_MAX: 160,
  PHONE_MAX: 25,
  BIRTH_DATE_MAX: 20,
  TASK_NAME_MAX: 200,
  TASK_GOAL_MAX: 300,
  SUBJECT_MAX: 80,
  STUDY_SLOT_MAX: 80,
  THINK_QUESTION_MAX: 400,
  THINK_ANSWER_MAX: 3000,
  CONFIDENCE_MAX: 60,
  AI_QUESTION_MAX: 2000,
  AI_GUIDANCE_MAX: 8000,
  FACT_CONTENT_MAX: 3000,
  FACT_SOURCE_MAX: 1000,
  FACT_CONCLUSION_MAX: 2000,
  SELF_TEST_LESSON_MAX: 200,
  SELF_TEST_TEXT_MAX: 3000,
  SELF_TEST_LEVEL_MAX: 80,
} as const;

export type SurveyPhase = 'before' | 'after';
export type FactVerdict = 'accurate' | 'needs_revision' | 'inaccurate';
export type AccountRole = 'student' | 'teacher';

export interface StudyTask {
  id: string;
  userId: string;
  name: string;
  subject: string;
  goal: string;
  dueDate: string;
  studySlot: string;
  done: boolean;
  createdAtMs?: number;
}

export interface ThinkReflection {
  id: string;
  userId: string;
  subject: string;
  question: string;
  answer: string;
  confidence: string;
  createdAtMs?: number;
}

export interface AiSession {
  id: string;
  userId: string;
  subject: string;
  question: string;
  priorThinking?: string;
  guidance: string;
  model: string;
  createdAtMs?: number;
}

export interface FactCheckRecord {
  id: string;
  userId: string;
  content: string;
  source: string;
  conclusion: string;
  verdict: FactVerdict;
  createdAtMs?: number;
}

export interface SelfTestRecord {
  id: string;
  userId: string;
  subject: string;
  lesson: string;
  explain: string;
  apply: string;
  level: string;
  createdAtMs?: number;
}

export interface SurveySubmission {
  id: string;
  userId: string;
  phase: SurveyPhase;
  answers: number[];
  average: number;
  createdAtMs?: number;
}

export interface UserAccountProfile {
  uid: string;
  displayName: string;
  role: AccountRole;
  requestedRole: AccountRole;
  teacherApproved: boolean;
  className: string;
  homeroom: string;
  subjectTeacher: string;
  email: string;
  phone: string;
  birthDate: string;
}

export interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  thinkCount: number;
  aiCount: number;
  factCount: number;
  testCount: number;
  surveyCount: number;
}

export interface SurveyComparison {
  beforeCount: number;
  afterCount: number;
  beforeAverage: number | null;
  afterAverage: number | null;
  delta: number | null;
  perItem: Array<{
    index: number;
    question: string;
    beforeAvg: number | null;
    afterAvg: number | null;
    delta: number | null;
  }>;
}

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function validateStudyTaskInput(input: {
  name: string;
  subject: string;
  goal: string;
  dueDate: string;
  studySlot: string;
}): string | null {
  const name = input.name.trim();
  const goal = input.goal.trim();
  const dueDate = input.dueDate.trim();
  if (!name) return 'Vui lòng nhập tên nhiệm vụ học tập.';
  if (name.length > SCHEMA_LIMITS.TASK_NAME_MAX) {
    return `Tên nhiệm vụ tối đa ${SCHEMA_LIMITS.TASK_NAME_MAX} ký tự.`;
  }
  if (!goal) return 'Vui lòng nhập mục tiêu học tập.';
  if (goal.length > SCHEMA_LIMITS.TASK_GOAL_MAX) {
    return `Mục tiêu tối đa ${SCHEMA_LIMITS.TASK_GOAL_MAX} ký tự.`;
  }
  if (!SCHEMA_LIMITS.DATE_PATTERN.test(dueDate)) {
    return 'Vui lòng chọn hạn hoàn thành hợp lệ (YYYY-MM-DD).';
  }
  if (!input.subject.trim() || !input.studySlot.trim()) {
    return 'Vui lòng chọn môn học và khung giờ tự học.';
  }
  return null;
}

export function validateThinkInput(input: {
  subject: string;
  question: string;
  answer: string;
  confidence: string;
}): string | null {
  const answer = input.answer.trim();
  if (!answer) return 'Em hãy nhập suy nghĩ ban đầu trước khi lưu.';
  if (answer.length > SCHEMA_LIMITS.THINK_ANSWER_MAX) {
    return `Suy nghĩ ban đầu tối đa ${SCHEMA_LIMITS.THINK_ANSWER_MAX} ký tự.`;
  }
  if (!input.subject.trim() || !input.question.trim() || !input.confidence.trim()) {
    return 'Vui lòng chọn đầy đủ môn học, câu hỏi và mức độ tự tin.';
  }
  return null;
}

export function validateFactCheckInput(input: {
  content: string;
  source: string;
  conclusion: string;
}): string | null {
  if (!input.content.trim() || !input.source.trim() || !input.conclusion.trim()) {
    return 'Vui lòng điền đầy đủ nội dung, nguồn đối chiếu và kết luận.';
  }
  if (input.content.trim().length > SCHEMA_LIMITS.FACT_CONTENT_MAX) {
    return `Nội dung kiểm chứng tối đa ${SCHEMA_LIMITS.FACT_CONTENT_MAX} ký tự.`;
  }
  if (input.source.trim().length > SCHEMA_LIMITS.FACT_SOURCE_MAX) {
    return `Nguồn đối chiếu tối đa ${SCHEMA_LIMITS.FACT_SOURCE_MAX} ký tự.`;
  }
  if (input.conclusion.trim().length > SCHEMA_LIMITS.FACT_CONCLUSION_MAX) {
    return `Kết luận tối đa ${SCHEMA_LIMITS.FACT_CONCLUSION_MAX} ký tự.`;
  }
  return null;
}

export function validateSelfTestInput(input: {
  subject: string;
  lesson: string;
  explain: string;
  apply: string;
  level: string;
}): string | null {
  if (!input.lesson.trim()) return 'Vui lòng nhập tên bài học.';
  if (!input.explain.trim() || !input.apply.trim()) {
    return 'Vui lòng giải thích kiến thức và nêu tình huống vận dụng.';
  }
  if (input.lesson.trim().length > SCHEMA_LIMITS.SELF_TEST_LESSON_MAX) {
    return `Tên bài học tối đa ${SCHEMA_LIMITS.SELF_TEST_LESSON_MAX} ký tự.`;
  }
  if (
    input.explain.trim().length > SCHEMA_LIMITS.SELF_TEST_TEXT_MAX ||
    input.apply.trim().length > SCHEMA_LIMITS.SELF_TEST_TEXT_MAX
  ) {
    return `Nội dung tự kiểm tra tối đa ${SCHEMA_LIMITS.SELF_TEST_TEXT_MAX} ký tự.`;
  }
  return null;
}

export function validateSurveyAnswers(answers: Array<number | null>): string | null {
  if (answers.length !== SURVEY_ITEMS.length) {
    return `Vui lòng trả lời đủ ${SURVEY_ITEMS.length} câu hỏi khảo sát.`;
  }
  for (let i = 0; i < answers.length; i++) {
    const val = answers[i];
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5) {
      return `Vui lòng chọn mức độ từ 1 đến 5 cho câu hỏi số ${i + 1}.`;
    }
  }
  return null;
}

export function computeSurveyAverage(answers: number[]): number {
  if (!answers.length) return 0;
  const total = answers.reduce((sum, score) => sum + score, 0);
  return Number((total / answers.length).toFixed(2));
}

export function computeProgressStats(params: {
  tasks: StudyTask[];
  thinks: ThinkReflection[];
  aiSessions: AiSession[];
  facts: FactCheckRecord[];
  tests: SelfTestRecord[];
  surveys: SurveySubmission[];
}): ProgressStats {
  const totalTasks = params.tasks.length;
  const completedTasks = params.tasks.filter((t) => t.done).length;
  const completionPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    completedTasks,
    completionPercent,
    thinkCount: params.thinks.length,
    aiCount: params.aiSessions.length,
    factCount: params.facts.length,
    testCount: params.tests.length,
    surveyCount: params.surveys.length,
  };
}

export function computeSurveyComparison(surveys: SurveySubmission[]): SurveyComparison {
  const before = surveys.filter((s) => s.phase === 'before');
  const after = surveys.filter((s) => s.phase === 'after');

  const avg = (list: SurveySubmission[]): number | null => {
    if (!list.length) return null;
    const sum = list.reduce((acc, item) => acc + item.average, 0);
    return Number((sum / list.length).toFixed(2));
  };

  const beforeAverage = avg(before);
  const afterAverage = avg(after);
  const delta =
    beforeAverage !== null && afterAverage !== null
      ? Number((afterAverage - beforeAverage).toFixed(2))
      : null;

  const perItem = SURVEY_ITEMS.map((question, index) => {
    const itemAvg = (list: SurveySubmission[]): number | null => {
      if (!list.length) return null;
      const sum = list.reduce((acc, s) => acc + (s.answers[index] ?? 0), 0);
      return Number((sum / list.length).toFixed(2));
    };
    const beforeAvg = itemAvg(before);
    const afterAvg = itemAvg(after);
    const itemDelta =
      beforeAvg !== null && afterAvg !== null ? Number((afterAvg - beforeAvg).toFixed(2)) : null;

    return {
      index,
      question,
      beforeAvg,
      afterAvg,
      delta: itemDelta,
    };
  });

  return {
    beforeCount: before.length,
    afterCount: after.length,
    beforeAverage,
    afterAverage,
    delta,
    perItem,
  };
}

export function createClientId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '');
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `${cleanPrefix}_${timePart}_${randomPart}`;
}
