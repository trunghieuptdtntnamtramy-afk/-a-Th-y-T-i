import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  computeSurveyAverage,
  createClientId,
  sanitizeText,
  SCHEMA_LIMITS,
  type AccountRole,
  type AiSession,
  type FactCheckRecord,
  type FactVerdict,
  type SelfTestRecord,
  type StudyTask,
  type SurveyPhase,
  type SurveySubmission,
  type ThinkReflection,
  type UserAccountProfile,
} from '../utils/eduLogic';

function toMillis(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as Timestamp).toMillis === 'function') {
    return (ts as Timestamp).toMillis();
  }
  return Date.now();
}

export function subscribeUserCollections(
  uid: string,
  callbacks: {
    onTasks: (tasks: StudyTask[]) => void;
    onThinks: (thinks: ThinkReflection[]) => void;
    onAiSessions: (sessions: AiSession[]) => void;
    onFacts: (facts: FactCheckRecord[]) => void;
    onTests: (tests: SelfTestRecord[]) => void;
    onSurveys: (surveys: SurveySubmission[]) => void;
    onError: (err: Error) => void;
  }
): () => void {
  const unsubTasks = onSnapshot(
    query(collection(db, 'studyTasks'), where('userId', '==', uid), orderBy('createdAt', 'desc')),
    (snap) => {
      callbacks.onTasks(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            name: String(data.name),
            subject: String(data.subject),
            goal: String(data.goal),
            dueDate: String(data.dueDate),
            studySlot: String(data.studySlot),
            done: Boolean(data.done),
            createdAtMs: toMillis(data.createdAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'studyTasks');
      } catch (e) {
        callbacks.onError(e as Error);
      }
    }
  );

  const unsubThinks = onSnapshot(
    query(collection(db, 'thinkReflections'), where('userId', '==', uid), orderBy('createdAt', 'desc')),
    (snap) => {
      callbacks.onThinks(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            subject: String(data.subject),
            question: String(data.question),
            answer: String(data.answer),
            confidence: String(data.confidence),
            createdAtMs: toMillis(data.createdAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'thinkReflections');
      } catch (e) {
        callbacks.onError(e as Error);
      }
    }
  );

  const unsubAi = onSnapshot(
    query(collection(db, 'aiSessions'), where('userId', '==', uid), orderBy('createdAt', 'desc')),
    (snap) => {
      callbacks.onAiSessions(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            subject: String(data.subject),
            question: String(data.question),
            priorThinking: data.priorThinking ? String(data.priorThinking) : undefined,
            guidance: String(data.guidance),
            model: String(data.model),
            createdAtMs: toMillis(data.createdAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'aiSessions');
      } catch (e) {
        callbacks.onError(e as Error);
      }
    }
  );

  const unsubFacts = onSnapshot(
    query(collection(db, 'factChecks'), where('userId', '==', uid), orderBy('createdAt', 'desc')),
    (snap) => {
      callbacks.onFacts(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            content: String(data.content),
            source: String(data.source),
            conclusion: String(data.conclusion),
            verdict: (data.verdict as FactVerdict) || 'accurate',
            createdAtMs: toMillis(data.createdAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'factChecks');
      } catch (e) {
        callbacks.onError(e as Error);
      }
    }
  );

  const unsubTests = onSnapshot(
    query(collection(db, 'selfTests'), where('userId', '==', uid), orderBy('createdAt', 'desc')),
    (snap) => {
      callbacks.onTests(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            subject: String(data.subject),
            lesson: String(data.lesson),
            explain: String(data.explain),
            apply: String(data.apply),
            level: String(data.level),
            createdAtMs: toMillis(data.createdAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'selfTests');
      } catch (e) {
        callbacks.onError(e as Error);
      }
    }
  );

  const unsubSurveys = onSnapshot(
    query(collection(db, 'surveys'), where('userId', '==', uid), orderBy('createdAt', 'desc')),
    (snap) => {
      callbacks.onSurveys(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: String(data.userId),
            phase: (data.phase as SurveyPhase) || 'before',
            answers: Array.isArray(data.answers) ? data.answers.map(Number) : [],
            average: Number(data.average),
            createdAtMs: toMillis(data.createdAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'surveys');
      } catch (e) {
        callbacks.onError(e as Error);
      }
    }
  );

  return () => {
    unsubTasks();
    unsubThinks();
    unsubAi();
    unsubFacts();
    unsubTests();
    unsubSurveys();
  };
}

export async function createStudyTaskDoc(
  uid: string,
  input: { name: string; subject: string; goal: string; dueDate: string; studySlot: string }
): Promise<string> {
  const id = createClientId('task');
  const path = `studyTasks/${id}`;
  try {
    await setDoc(doc(db, 'studyTasks', id), {
      userId: uid,
      name: sanitizeText(input.name, SCHEMA_LIMITS.TASK_NAME_MAX),
      subject: sanitizeText(input.subject, SCHEMA_LIMITS.SUBJECT_MAX),
      goal: sanitizeText(input.goal, SCHEMA_LIMITS.TASK_GOAL_MAX),
      dueDate: input.dueDate.trim(),
      studySlot: sanitizeText(input.studySlot, SCHEMA_LIMITS.STUDY_SLOT_MAX),
      done: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleStudyTaskDoneDoc(taskId: string, done: boolean): Promise<void> {
  const path = `studyTasks/${taskId}`;
  try {
    await updateDoc(doc(db, 'studyTasks', taskId), {
      done,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudyTaskDoc(taskId: string): Promise<void> {
  const path = `studyTasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'studyTasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createThinkReflectionDoc(
  uid: string,
  input: { subject: string; question: string; answer: string; confidence: string }
): Promise<string> {
  const id = createClientId('think');
  const path = `thinkReflections/${id}`;
  try {
    await setDoc(doc(db, 'thinkReflections', id), {
      userId: uid,
      subject: sanitizeText(input.subject, SCHEMA_LIMITS.SUBJECT_MAX),
      question: sanitizeText(input.question, SCHEMA_LIMITS.THINK_QUESTION_MAX),
      answer: sanitizeText(input.answer, SCHEMA_LIMITS.THINK_ANSWER_MAX),
      confidence: sanitizeText(input.confidence, SCHEMA_LIMITS.CONFIDENCE_MAX),
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createAiSessionDoc(
  uid: string,
  input: {
    subject: string;
    question: string;
    priorThinking?: string;
    guidance: string;
    model: string;
  }
): Promise<string> {
  const id = createClientId('ai');
  const path = `aiSessions/${id}`;
  try {
    const payload: Record<string, unknown> = {
      userId: uid,
      subject: sanitizeText(input.subject, SCHEMA_LIMITS.SUBJECT_MAX),
      question: sanitizeText(input.question, SCHEMA_LIMITS.AI_QUESTION_MAX),
      guidance: sanitizeText(input.guidance, SCHEMA_LIMITS.AI_GUIDANCE_MAX),
      model: sanitizeText(input.model, 60),
      createdAt: serverTimestamp(),
    };
    if (input.priorThinking?.trim()) {
      payload.priorThinking = sanitizeText(input.priorThinking, SCHEMA_LIMITS.THINK_ANSWER_MAX);
    }
    await setDoc(doc(db, 'aiSessions', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createFactCheckDoc(
  uid: string,
  input: { content: string; source: string; conclusion: string; verdict: FactVerdict }
): Promise<string> {
  const id = createClientId('fact');
  const path = `factChecks/${id}`;
  try {
    await setDoc(doc(db, 'factChecks', id), {
      userId: uid,
      content: sanitizeText(input.content, SCHEMA_LIMITS.FACT_CONTENT_MAX),
      source: sanitizeText(input.source, SCHEMA_LIMITS.FACT_SOURCE_MAX),
      conclusion: sanitizeText(input.conclusion, SCHEMA_LIMITS.FACT_CONCLUSION_MAX),
      verdict: input.verdict,
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createSelfTestDoc(
  uid: string,
  input: { subject: string; lesson: string; explain: string; apply: string; level: string }
): Promise<string> {
  const id = createClientId('test');
  const path = `selfTests/${id}`;
  try {
    await setDoc(doc(db, 'selfTests', id), {
      userId: uid,
      subject: sanitizeText(input.subject, SCHEMA_LIMITS.SUBJECT_MAX),
      lesson: sanitizeText(input.lesson, SCHEMA_LIMITS.SELF_TEST_LESSON_MAX),
      explain: sanitizeText(input.explain, SCHEMA_LIMITS.SELF_TEST_TEXT_MAX),
      apply: sanitizeText(input.apply, SCHEMA_LIMITS.SELF_TEST_TEXT_MAX),
      level: sanitizeText(input.level, SCHEMA_LIMITS.SELF_TEST_LEVEL_MAX),
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createSurveyDoc(
  uid: string,
  input: { phase: SurveyPhase; answers: number[] }
): Promise<string> {
  const id = createClientId('survey');
  const path = `surveys/${id}`;
  const average = computeSurveyAverage(input.answers);
  try {
    await setDoc(doc(db, 'surveys', id), {
      userId: uid,
      phase: input.phase,
      answers: input.answers,
      average,
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function loadUserAccountProfile(uid: string): Promise<UserAccountProfile | null> {
  const publicRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'info');
  try {
    const [pubSnap, privSnap] = await Promise.all([getDoc(publicRef), getDoc(privateRef)]);
    if (!pubSnap.exists()) return null;
    const pub = pubSnap.data();
    const priv = privSnap.exists() ? privSnap.data() : {};
    return {
      uid,
      displayName: String(pub.displayName || ''),
      role: (pub.role as AccountRole) || 'student',
      requestedRole: (pub.requestedRole as AccountRole) || 'student',
      teacherApproved: Boolean(pub.teacherApproved),
      className: String(pub.className || ''),
      homeroom: String(pub.homeroom || ''),
      subjectTeacher: String(pub.subjectTeacher || ''),
      email: String(priv.email || ''),
      phone: String(priv.phone || ''),
      birthDate: String(priv.birthDate || ''),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function saveUserAccountProfile(
  uid: string,
  input: Omit<UserAccountProfile, 'uid' | 'role' | 'teacherApproved'>
): Promise<void> {
  const publicRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'info');
  try {
    const existingPublic = await getDoc(publicRef);
    const existingPrivate = await getDoc(privateRef);

    const cleanPublic = {
      displayName: sanitizeText(input.displayName || 'Học sinh EDU SMART', SCHEMA_LIMITS.DISPLAY_NAME_MAX),
      requestedRole: input.requestedRole,
      className: sanitizeText(input.className, SCHEMA_LIMITS.CLASS_NAME_MAX),
      homeroom: sanitizeText(input.homeroom, SCHEMA_LIMITS.CLASS_NAME_MAX),
      subjectTeacher: sanitizeText(input.subjectTeacher, SCHEMA_LIMITS.SUBJECT_TEACHER_MAX),
      updatedAt: serverTimestamp(),
    };

    if (!existingPublic.exists()) {
      await setDoc(publicRef, {
        uid,
        ...cleanPublic,
        role: 'student',
        teacherApproved: false,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(publicRef, cleanPublic);
    }

    const cleanPrivate = {
      email: sanitizeText(input.email, SCHEMA_LIMITS.EMAIL_MAX),
      phone: sanitizeText(input.phone, SCHEMA_LIMITS.PHONE_MAX),
      birthDate: sanitizeText(input.birthDate, SCHEMA_LIMITS.BIRTH_DATE_MAX),
      updatedAt: serverTimestamp(),
    };

    if (!existingPrivate.exists()) {
      await setDoc(privateRef, {
        uid,
        ...cleanPrivate,
      });
    } else {
      await updateDoc(privateRef, cleanPrivate);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}
