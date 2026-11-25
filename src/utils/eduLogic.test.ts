import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeProgressStats,
  computeSurveyAverage,
  computeSurveyComparison,
  createClientId,
  SCHEMA_LIMITS,
  SURVEY_ITEMS,
  validateFactCheckInput,
  validateSelfTestInput,
  validateStudyTaskInput,
  validateSurveyAnswers,
  validateThinkInput,
} from './eduLogic';

test('validateStudyTaskInput rejects missing fields and invalid dates', () => {
  assert.ok(
    validateStudyTaskInput({
      name: '',
      subject: 'Toán học',
      goal: 'Ôn tập',
      dueDate: '2026-11-30',
      studySlot: 'Giờ tự học buổi tối',
    })
  );
  assert.ok(
    validateStudyTaskInput({
      name: 'Làm bài tập',
      subject: 'Toán học',
      goal: 'Hoàn thành 5 câu',
      dueDate: '30/11/2026',
      studySlot: 'Giờ tự học buổi tối',
    })
  );
  assert.equal(
    validateStudyTaskInput({
      name: 'Ôn tập chương 2',
      subject: 'Lịch sử',
      goal: 'Nắm mốc thời gian chính',
      dueDate: '2026-11-30',
      studySlot: 'Giờ tự học buổi tối',
    }),
    null
  );
});

test('validateThinkInput, validateFactCheckInput, and validateSelfTestInput enforce required fields', () => {
  assert.ok(
    validateThinkInput({
      subject: 'Vật lí',
      question: 'Câu hỏi',
      answer: '   ',
      confidence: 'Rất tự tin',
    })
  );
  assert.equal(
    validateThinkInput({
      subject: 'Vật lí',
      question: 'Câu hỏi',
      answer: 'Em nghĩ định luật bảo toàn năng lượng áp dụng cho hệ kín.',
      confidence: 'Tương đối tự tin',
    }),
    null
  );

  assert.ok(validateFactCheckInput({ content: 'A', source: '', conclusion: 'C' }));
  assert.equal(
    validateFactCheckInput({
      content: 'Chiến thắng Điện Biên Phủ năm 1954',
      source: 'SGK Lịch sử 12, trang 140',
      conclusion: 'Chính xác hoàn toàn theo SGK.',
    }),
    null
  );

  assert.ok(
    validateSelfTestInput({
      subject: 'Hóa học',
      lesson: '',
      explain: 'Giải thích',
      apply: 'Ứng dụng',
      level: 'Đã hiểu rõ',
    })
  );
  assert.equal(
    validateSelfTestInput({
      subject: 'Hóa học',
      lesson: 'Este - Lipit',
      explain: 'Este tạo thành khi axit cacboxylic tác dụng với ancol.',
      apply: 'Giải thích quá trình xà phòng hóa.',
      level: 'Đã hiểu rõ',
    }),
    null
  );
});

test('validateSurveyAnswers and computeSurveyAverage calculate exact Likert means', () => {
  assert.ok(validateSurveyAnswers([1, 2, 3, 4, 5, 6, 4]));
  assert.ok(validateSurveyAnswers([1, 2, 3, null, 4, 5, 5]));
  assert.equal(validateSurveyAnswers([3, 4, 4, 5, 3, 4, 5]), null);
  assert.equal(computeSurveyAverage([3, 4, 4, 5, 3, 4, 5]), 4);
  assert.equal(SURVEY_ITEMS.length, 7);
});

test('computeProgressStats and computeSurveyComparison compute accurate counts and deltas', () => {
  const stats = computeProgressStats({
    tasks: [
      { id: '1', userId: 'u1', name: 'T1', subject: 'Toán học', goal: 'G1', dueDate: '2026-11-26', studySlot: 'Tối', done: true },
      { id: '2', userId: 'u1', name: 'T2', subject: 'Ngữ văn', goal: 'G2', dueDate: '2026-11-27', studySlot: 'Tối', done: false },
      { id: '3', userId: 'u1', name: 'T3', subject: 'Tiếng Anh', goal: 'G3', dueDate: '2026-11-28', studySlot: 'Chiều', done: true },
    ],
    thinks: [{ id: 'th1', userId: 'u1', subject: 'Toán học', question: 'Q', answer: 'A', confidence: 'Tự tin' }],
    aiSessions: [],
    facts: [],
    tests: [],
    surveys: [],
  });

  assert.equal(stats.totalTasks, 3);
  assert.equal(stats.completedTasks, 2);
  assert.equal(stats.completionPercent, 67);
  assert.equal(stats.thinkCount, 1);

  const comparison = computeSurveyComparison([
    { id: 's1', userId: 'u1', phase: 'before', answers: [2, 2, 2, 2, 2, 2, 2], average: 2 },
    { id: 's2', userId: 'u1', phase: 'after', answers: [4, 4, 4, 4, 4, 4, 4], average: 4 },
  ]);
  assert.equal(comparison.beforeAverage, 2);
  assert.equal(comparison.afterAverage, 4);
  assert.equal(comparison.delta, 2);
  assert.equal(comparison.perItem.length, 7);
  assert.equal(comparison.perItem[0].delta, 2);
});

test('createClientId produces valid Firestore path IDs matching regex', () => {
  const id = createClientId('task');
  assert.match(id, SCHEMA_LIMITS.ID_PATTERN);
  assert.ok(id.length <= SCHEMA_LIMITS.ID_MAX);
});
