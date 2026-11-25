import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithFirebaseGoogle,
  signOutFirebase,
  subscribeAuthState,
} from './lib/firebase';
import {
  createAiSessionDoc,
  createFactCheckDoc,
  createSelfTestDoc,
  createStudyTaskDoc,
  createSurveyDoc,
  createThinkReflectionDoc,
  deleteStudyTaskDoc,
  loadUserAccountProfile,
  saveUserAccountProfile,
  subscribeUserCollections,
  toggleStudyTaskDoneDoc,
} from './lib/firestoreStore';
import {
  computeSurveyAverage,
  createClientId,
  type AiSession,
  type FactCheckRecord,
  type FactVerdict,
  type SelfTestRecord,
  type StudyTask,
  type SurveyPhase,
  type SurveySubmission,
  type ThinkReflection,
  type UserAccountProfile,
} from './utils/eduLogic';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar, type AppPageId } from './components/Navbar';
import { HomePage, type StudyStepId } from './components/HomePage';
import { SurveyPage } from './components/SurveyPage';
import { StudyWorkspacePage } from './components/StudyWorkspacePage';
import { ProgressPage } from './components/ProgressPage';
import { StatsPage } from './components/StatsPage';
import { WorkspaceHubPage } from './components/WorkspaceHubPage';
import { AccountPage } from './components/AccountPage';

function AppContent() {
  const [activePage, setActivePage] = useState<AppPageId>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' ? 'study' : 'home';
  });
  const [studyStep, setStudyStep] = useState<StudyStepId>('plan');

  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserAccountProfile | null>(null);
  const [firestoreError, setFirestoreError] = useState<Error | null>(null);

  // Study data (synced from Firestore when signed in, local state in guest mode)
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [thinks, setThinks] = useState<ThinkReflection[]>([]);
  const [aiSessions, setAiSessions] = useState<AiSession[]>([]);
  const [facts, setFacts] = useState<FactCheckRecord[]>([]);
  const [tests, setTests] = useState<SelfTestRecord[]>([]);
  const [surveys, setSurveys] = useState<SurveySubmission[]>([]);

  if (firestoreError) {
    throw firestoreError;
  }

  useEffect(() => {
    const unsub = subscribeAuthState((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setProfile(null);
      return;
    }

    let cancelled = false;
    loadUserAccountProfile(user.uid)
      .then((loaded) => {
        if (!cancelled) setProfile(loaded);
      })
      .catch((err) => {
        if (!cancelled) setFirestoreError(err as Error);
      });

    const unsubCollections = subscribeUserCollections(user.uid, {
      onTasks: setTasks,
      onThinks: setThinks,
      onAiSessions: setAiSessions,
      onFacts: setFacts,
      onTests: setTests,
      onSurveys: setSurveys,
      onError: (err) => setFirestoreError(err),
    });

    return () => {
      cancelled = true;
      unsubCollections();
    };
  }, [authReady, user]);

  const navigateTo = (page: AppPageId) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openStudyStep = (step: StudyStepId) => {
    setStudyStep(step);
    navigateTo('study');
  };

  const handleAddTask = async (input: {
    name: string;
    subject: string;
    goal: string;
    dueDate: string;
    studySlot: string;
  }) => {
    if (user) {
      await createStudyTaskDoc(user.uid, input);
      return;
    }
    setTasks((prev) => [
      {
        id: createClientId('task'),
        userId: 'guest',
        ...input,
        done: false,
        createdAtMs: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleToggleTask = async (taskId: string, done: boolean) => {
    if (user) {
      await toggleStudyTaskDoneDoc(taskId, done);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done } : t)));
  };

  const handleDeleteTask = async (taskId: string) => {
    if (user) {
      await deleteStudyTaskDoc(taskId);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleSaveThink = async (input: {
    subject: string;
    question: string;
    answer: string;
    confidence: string;
  }) => {
    if (user) {
      await createThinkReflectionDoc(user.uid, input);
      return;
    }
    setThinks((prev) => [
      {
        id: createClientId('think'),
        userId: 'guest',
        ...input,
        createdAtMs: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleSaveAiSession = async (input: {
    subject: string;
    question: string;
    priorThinking?: string;
    guidance: string;
    model: string;
  }) => {
    if (user) {
      await createAiSessionDoc(user.uid, input);
      return;
    }
    setAiSessions((prev) => [
      {
        id: createClientId('ai'),
        userId: 'guest',
        ...input,
        createdAtMs: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleSaveFactCheck = async (input: {
    content: string;
    source: string;
    conclusion: string;
    verdict: FactVerdict;
  }) => {
    if (user) {
      await createFactCheckDoc(user.uid, input);
      return;
    }
    setFacts((prev) => [
      {
        id: createClientId('fact'),
        userId: 'guest',
        ...input,
        createdAtMs: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleSaveSelfTest = async (input: {
    subject: string;
    lesson: string;
    explain: string;
    apply: string;
    level: string;
  }) => {
    if (user) {
      await createSelfTestDoc(user.uid, input);
      return;
    }
    setTests((prev) => [
      {
        id: createClientId('test'),
        userId: 'guest',
        ...input,
        createdAtMs: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleSubmitSurvey = async (phase: SurveyPhase, answers: number[]) => {
    if (user) {
      await createSurveyDoc(user.uid, { phase, answers });
      return;
    }
    setSurveys((prev) => [
      {
        id: createClientId('survey'),
        userId: 'guest',
        phase,
        answers,
        average: computeSurveyAverage(answers),
        createdAtMs: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleSignOut = async () => {
    await signOutFirebase();
    setProfile(null);
    setTasks([]);
    setThinks([]);
    setAiSessions([]);
    setFacts([]);
    setTests([]);
    setSurveys([]);
  };

  const handleSaveProfile = async (
    input: Omit<UserAccountProfile, 'uid' | 'role' | 'teacherApproved'>
  ) => {
    if (!user) return;
    await saveUserAccountProfile(user.uid, input);
    const updated = await loadUserAccountProfile(user.uid);
    setProfile(updated);
  };

  const userLabel = user
    ? profile?.displayName || user.displayName || 'Tài khoản'
    : 'Tài khoản';

  return (
    <div className="min-h-screen flex flex-col bg-[#f5faff] text-[#19324d]">
      <Navbar activePage={activePage} userLabel={userLabel} onNavigate={navigateTo} />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 py-7 sm:py-9">
        {activePage === 'home' && (
          <HomePage onNavigate={navigateTo} onOpenStudyStep={openStudyStep} />
        )}

        {activePage === 'survey' && (
          <SurveyPage
            onSubmitSurvey={handleSubmitSurvey}
            onNavigateStats={() => navigateTo('stats')}
          />
        )}

        {activePage === 'study' && (
          <StudyWorkspacePage
            activeStep={studyStep}
            onChangeStep={setStudyStep}
            tasks={tasks}
            thinks={thinks}
            aiSessions={aiSessions}
            facts={facts}
            tests={tests}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onSaveThink={handleSaveThink}
            onSaveAiSession={handleSaveAiSession}
            onSaveFactCheck={handleSaveFactCheck}
            onSaveSelfTest={handleSaveSelfTest}
          />
        )}

        {activePage === 'progress' && (
          <ProgressPage
            isAuthenticated={Boolean(user)}
            tasks={tasks}
            thinks={thinks}
            aiSessions={aiSessions}
            facts={facts}
            tests={tests}
            surveys={surveys}
            onToggleTask={handleToggleTask}
            onNavigate={navigateTo}
          />
        )}

        {activePage === 'stats' && (
          <StatsPage
            tasks={tasks}
            thinks={thinks}
            aiSessions={aiSessions}
            facts={facts}
            tests={tests}
            surveys={surveys}
            onGoSurvey={() => navigateTo('survey')}
          />
        )}

        {activePage === 'workspace' && (
          <WorkspaceHubPage tasks={tasks} thinks={thinks} surveys={surveys} />
        )}

        {activePage === 'account' && (
          <AccountPage
            user={user}
            profile={profile}
            onGoogleSignIn={async () => {
              await signInWithFirebaseGoogle();
            }}
            onSignOut={handleSignOut}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </main>

      <footer className="bg-white border-t border-[#e2eaf2] px-5 py-6 text-center text-xs text-[#64748b]">
        <div className="font-bold text-[#19324d]">
          EDU SMART – Học tập chủ động · Tư duy độc lập · Sử dụng AI có trách nhiệm
        </div>
        <div className="mt-1">Trường PTDTNT THPT Quảng Nam</div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
