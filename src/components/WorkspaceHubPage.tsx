import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Presentation,
  Send,
  Users,
  Video,
  ClipboardList,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  getWorkspaceAccessToken,
  initWorkspaceAuth,
  WORKSPACE_PROJECT_ID,
  workspaceGoogleSignIn,
  workspaceLogout,
} from '../lib/workspaceAuth';
import {
  createMeetStudyRoom,
  createStudyNoteDoc,
  exportProgressToSheet,
  getFormSummary,
  getSlideDeckSummary,
  listChatSpaces,
  listDriveFiles,
  listGoogleContacts,
  listRecentGmail,
  postChatMessage,
  readSpreadsheetPreview,
  sendGmailReport,
  type ChatSpaceItem,
  type ContactPerson,
  type DriveFileItem,
  type FormSummary,
  type GmailMessageSummary,
  type SlideDeckSummary,
} from '../lib/workspaceApi';
import type { StudyTask, SurveySubmission, ThinkReflection } from '../utils/eduLogic';
import { ConfirmDialog } from './ConfirmDialog';
import { GoogleSignInButton } from './GoogleSignInButton';

type WorkspaceTab = 'docs' | 'sheets_forms' | 'comms';

interface PendingConfirm {
  title: string;
  description: string;
  details: string[];
  confirmLabel: string;
  action: () => Promise<void>;
}

interface WorkspaceHubPageProps {
  tasks: StudyTask[];
  thinks: ThinkReflection[];
  surveys: SurveySubmission[];
}

export function WorkspaceHubPage({ tasks, thinks, surveys }: WorkspaceHubPageProps) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [wsUser, setWsUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('docs');

  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  // Drive, Docs, Slides
  const [driveQuery, setDriveQuery] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [docTitle, setDocTitle] = useState('Nhật ký tự học EDU SMART');
  const [createdDocUrl, setCreatedDocUrl] = useState<string | null>(null);
  const [slideId, setSlideId] = useState('');
  const [slideSummary, setSlideSummary] = useState<SlideDeckSummary | null>(null);

  // Sheets & Forms
  const [sheetTitle, setSheetTitle] = useState('Bảng theo dõi EDU SMART');
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [readSheetId, setReadSheetId] = useState('');
  const [sheetPreview, setSheetPreview] = useState<{
    title: string;
    sheetName: string;
    rows: string[][];
  } | null>(null);
  const [formId, setFormId] = useState('');
  const [formSummary, setFormSummary] = useState<FormSummary | null>(null);

  // Gmail, Chat, Meet, Contacts
  const [gmailMessages, setGmailMessages] = useState<GmailMessageSummary[]>([]);
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('Báo cáo tiến độ tự học EDU SMART');
  const [mailBody, setMailBody] = useState('');
  const [contacts, setContacts] = useState<ContactPerson[]>([]);
  const [chatSpaces, setChatSpaces] = useState<ChatSpaceItem[]>([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [chatText, setChatText] = useState('');
  const [meetRoom, setMeetRoom] = useState<{ meetingUri: string; meetingCode: string } | null>(null);

  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (user) => {
        setWsUser(user);
        setNeedsAuth(false);
      },
      () => {
        setWsUser(null);
        setNeedsAuth(true);
      }
    );
    return unsub;
  }, []);

  const requireToken = async (): Promise<string | null> => {
    const token = await getWorkspaceAccessToken();
    if (!token) {
      setNeedsAuth(true);
      setStatusMsg({
        type: 'error',
        text: 'Vui lòng nhấn Sign in with Google để cấp quyền truy cập Google Workspace trong phiên này.',
      });
      return null;
    }
    return token;
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMsg(null);
    try {
      const result = await workspaceGoogleSignIn();
      if (result) {
        setWsUser(result.user);
        setNeedsAuth(false);
        setStatusMsg({
          type: 'success',
          text: `Đã kết nối Google Workspace với tài khoản ${result.user.email || ''}.`,
        });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Đăng nhập Google Workspace thất bại.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await workspaceLogout();
    setWsUser(null);
    setNeedsAuth(true);
    setDriveFiles([]);
    setGmailMessages([]);
    setContacts([]);
    setChatSpaces([]);
  };

  const runReadAction = async (key: string, fn: (token: string) => Promise<void>) => {
    const token = await requireToken();
    if (!token) return;
    setBusyAction(key);
    setStatusMsg(null);
    try {
      await fn(token);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Thao tác Workspace gặp lỗi.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const executeConfirm = async () => {
    if (!pendingConfirm) return;
    setConfirmBusy(true);
    setStatusMsg(null);
    try {
      await pendingConfirm.action();
      setPendingConfirm(null);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Không thể hoàn tất thao tác.',
      });
      setPendingConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  };

  const buildStudyNoteText = () => {
    const lines = [
      'EDU SMART - TRƯỜNG PTDTNT THPT QUẢNG NAM',
      `Ngày tổng hợp: ${new Date().toLocaleDateString('vi-VN')}`,
      '',
      `1. KẾ HOẠCH HỌC TẬP (${tasks.length} nhiệm vụ):`,
      ...tasks.map(
        (t, i) =>
          `${i + 1}. [${t.done ? 'Hoàn thành' : 'Đang làm'}] ${t.name} (${t.subject}) - Mục tiêu: ${t.goal}`
      ),
      '',
      `2. SUY NGHĨ BAN ĐẦU - THINK FIRST (${thinks.length} lượt):`,
      ...thinks.slice(0, 5).map(
        (th, i) => `${i + 1}. ${th.subject} (${th.confidence}): ${th.answer}`
      ),
    ];
    return lines.join('\n');
  };

  const handleRequestCreateDoc = async () => {
    const token = await requireToken();
    if (!token) return;
    const finalTitle = docTitle.trim() || 'Nhật ký tự học EDU SMART';
    setPendingConfirm({
      title: 'Tạo tài liệu Google Docs mới?',
      description:
        'Hệ thống sẽ tạo một tệp Google Docs mới trong Google Drive của bạn chứa kế hoạch học tập và nhật ký Think First.',
      details: [`Tên tài liệu: ${finalTitle}`, `Số nhiệm vụ: ${tasks.length}`, `Số lượt Think First: ${thinks.length}`],
      confirmLabel: 'Tạo Google Docs',
      action: async () => {
        const created = await createStudyNoteDoc(token, finalTitle, buildStudyNoteText());
        setCreatedDocUrl(created.url);
        setStatusMsg({ type: 'success', text: `Đã tạo Google Docs "${finalTitle}".` });
      },
    });
  };

  const handleRequestExportSheet = async () => {
    const token = await requireToken();
    if (!token) return;
    const finalTitle = sheetTitle.trim() || 'Bảng theo dõi EDU SMART';
    const rows: string[][] = [
      ['Loại', 'Môn học / Đợt', 'Nội dung', 'Trạng thái / Điểm TB', 'Thời hạn / Ghi chú'],
      ...tasks.map((t) => [
        'Study Plan',
        t.subject,
        t.name,
        t.done ? 'Hoàn thành' : 'Chưa xong',
        `${t.dueDate} (${t.studySlot})`,
      ]),
      ...surveys.map((s) => [
        'Khảo sát',
        s.phase === 'before' ? 'Trước sử dụng' : 'Sau sử dụng',
        `7 tiêu chí tự học`,
        `${s.average}/5`,
        s.answers.join(', '),
      ]),
    ];

    setPendingConfirm({
      title: 'Xuất bảng tính Google Sheets mới?',
      description:
        'Hệ thống sẽ tạo một bảng tính Google Sheets mới và ghi toàn bộ nhiệm vụ Study Plan cùng kết quả khảo sát hiện tại.',
      details: [`Tên bảng tính: ${finalTitle}`, `Tổng số dòng dữ liệu: ${rows.length - 1}`],
      confirmLabel: 'Xuất Google Sheets',
      action: async () => {
        const res = await exportProgressToSheet(token, finalTitle, rows);
        setCreatedSheetUrl(res.spreadsheetUrl);
        setReadSheetId(res.spreadsheetId);
        setStatusMsg({ type: 'success', text: `Đã xuất dữ liệu ra Google Sheets "${finalTitle}".` });
      },
    });
  };

  const handleRequestSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await requireToken();
    if (!token) return;
    if (!mailTo.trim() || !mailSubject.trim() || !mailBody.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Vui lòng điền đủ người nhận, tiêu đề và nội dung email.',
      });
      return;
    }

    setPendingConfirm({
      title: 'Xác nhận gửi email qua Gmail?',
      description: 'Email sẽ được gửi trực tiếp từ tài khoản Gmail của bạn đến người nhận dưới đây.',
      details: [`Người nhận: ${mailTo.trim()}`, `Tiêu đề: ${mailSubject.trim()}`],
      confirmLabel: 'Gửi Gmail',
      action: async () => {
        await sendGmailReport(token, mailTo.trim(), mailSubject.trim(), mailBody.trim());
        setMailBody('');
        setStatusMsg({ type: 'success', text: `Đã gửi email tới ${mailTo.trim()}.` });
      },
    });
  };

  const handleRequestSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await requireToken();
    if (!token) return;
    if (!selectedSpace.trim() || !chatText.trim()) {
      setStatusMsg({
        type: 'error',
        text: 'Vui lòng chọn không gian Google Chat và nhập nội dung tin nhắn.',
      });
      return;
    }

    setPendingConfirm({
      title: 'Gửi tin nhắn lên Google Chat?',
      description: 'Tin nhắn sau sẽ được đăng lên không gian Google Chat đã chọn bằng tài khoản của bạn.',
      details: [`Không gian: ${selectedSpace}`, `Nội dung: ${chatText.trim().slice(0, 120)}`],
      confirmLabel: 'Gửi tin nhắn',
      action: async () => {
        await postChatMessage(token, selectedSpace, chatText.trim());
        setChatText('');
        setStatusMsg({ type: 'success', text: 'Đã gửi tin nhắn lên Google Chat.' });
      },
    });
  };

  const handleRequestCreateMeet = async () => {
    const token = await requireToken();
    if (!token) return;
    setPendingConfirm({
      title: 'Tạo phòng học nhóm Google Meet?',
      description: 'Hệ thống sẽ tạo một phòng họp Google Meet mới dưới tài khoản của bạn.',
      details: ['Mục đích: Thảo luận nhóm / Hướng dẫn tự học EDU SMART'],
      confirmLabel: 'Tạo phòng Google Meet',
      action: async () => {
        const room = await createMeetStudyRoom(token);
        setMeetRoom(room);
        setStatusMsg({ type: 'success', text: `Đã tạo phòng Google Meet (${room.meetingCode}).` });
      },
    });
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        title={pendingConfirm?.title || ''}
        description={pendingConfirm?.description || ''}
        details={pendingConfirm?.details}
        confirmLabel={pendingConfirm?.confirmLabel}
        isBusy={confirmBusy}
        onConfirm={executeConfirm}
        onCancel={() => setPendingConfirm(null)}
      />

      <div className="bg-white border border-[#e2eaf2] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-[#13a887]">
            TÍCH HỢP GOOGLE WORKSPACE
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#174b78]">
            Trung tâm học liệu & cộng tác Workspace
          </h1>
          <p className="mt-1 text-sm text-[#64748b]">
            Kết nối Drive, Docs, Sheets, Slides, Forms, Gmail, Chat, Meet và Contacts phục vụ tự học và trao đổi với giáo viên.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {needsAuth ? (
            <GoogleSignInButton
              label={isLoggingIn ? 'Đang kết nối...' : 'Sign in with Google'}
              disabled={isLoggingIn}
              onClick={handleLogin}
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-[#08775e]">Workspace đã kết nối</div>
                <div className="text-xs text-[#64748b] truncate max-w-[200px]">
                  {wsUser?.email || 'Tài khoản Google'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#d7e2ed] text-xs font-bold text-[#52677e] hover:bg-[#f5faff]"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Ngắt kết nối
              </button>
            </div>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          role={statusMsg.type === 'error' ? 'alert' : 'status'}
          className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm ${
            statusMsg.type === 'error'
              ? 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]'
              : 'border-[#a7f3d0] bg-[#e6faf4] text-[#08775e]'
          }`}
        >
          {statusMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Workspace Tool Tabs */}
      <div className="flex flex-wrap gap-2 bg-white border border-[#e2eaf2] p-1.5 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('docs')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
            activeTab === 'docs'
              ? 'bg-[#1677d2] text-white'
              : 'text-[#52677e] hover:bg-[#eaf6ff] hover:text-[#1677d2]'
          }`}
        >
          Drive · Docs · Slides
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sheets_forms')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
            activeTab === 'sheets_forms'
              ? 'bg-[#1677d2] text-white'
              : 'text-[#52677e] hover:bg-[#eaf6ff] hover:text-[#1677d2]'
          }`}
        >
          Sheets · Forms
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('comms')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
            activeTab === 'comms'
              ? 'bg-[#1677d2] text-white'
              : 'text-[#52677e] hover:bg-[#eaf6ff] hover:text-[#1677d2]'
          }`}
        >
          Gmail · Chat · Meet · Contacts
        </button>
      </div>

      {/* TAB 1: DRIVE, DOCS, SLIDES */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drive Browser */}
          <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#174b78]">
              <FolderOpen className="w-5 h-5" aria-hidden="true" />
              <h2 className="text-lg font-bold">Google Drive – Học liệu của tôi</h2>
            </div>
            <div className="flex gap-2">
              <input
                value={driveQuery}
                onChange={(e) => setDriveQuery(e.target.value)}
                placeholder="Tìm theo tên tệp trên Drive..."
                aria-label="Từ khóa tìm tệp Google Drive"
                className="flex-1 rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
              />
              <button
                type="button"
                disabled={busyAction === 'drive'}
                onClick={() =>
                  runReadAction('drive', async (token) => {
                    const files = await listDriveFiles(token, driveQuery);
                    setDriveFiles(files);
                  })
                }
                className="px-4 py-2 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 whitespace-nowrap"
              >
                {busyAction === 'drive' ? 'Đang tải...' : 'Tải danh sách'}
              </button>
            </div>

            {driveFiles.length === 0 ? (
              <p className="text-xs text-[#64748b]">
                Nhấn &ldquo;Tải danh sách&rdquo; để duyệt tệp tài liệu, bài giảng trong Google Drive của bạn.
              </p>
            ) : (
              <ul className="space-y-2 max-h-72 overflow-y-auto">
                {driveFiles.map((file) => (
                  <li
                    key={file.id}
                    className="rounded-xl border border-[#e2eaf2] p-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#19324d] truncate">{file.name}</div>
                      <div className="text-xs text-[#64748b] font-mono-num truncate">
                        ID: {file.id}
                      </div>
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#1677d2] hover:underline shrink-0"
                      >
                        Mở
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Docs & Slides */}
          <div className="space-y-6">
            <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#174b78]">
                <FileText className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-lg font-bold">Google Docs – Lưu nhật ký tự học</h2>
              </div>
              <p className="text-xs text-[#64748b]">
                Xuất toàn bộ kế hoạch Study Plan và suy nghĩ Think First thành một tài liệu Google Docs.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  aria-label="Tiêu đề tài liệu Google Docs"
                  className="flex-1 rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
                />
                <button
                  type="button"
                  onClick={handleRequestCreateDoc}
                  className="px-4 py-2 rounded-xl bg-[#13a887] text-white text-sm font-bold hover:bg-[#0e8a6f] whitespace-nowrap"
                >
                  Tạo Google Docs
                </button>
              </div>
              {createdDocUrl && (
                <a
                  href={createdDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1677d2] hover:underline"
                >
                  Mở tài liệu vừa tạo trong Google Docs
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </section>

            <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#174b78]">
                <Presentation className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-lg font-bold">Google Slides – Đọc nhanh bài giảng</h2>
              </div>
              <div className="flex gap-2">
                <input
                  value={slideId}
                  onChange={(e) => setSlideId(e.target.value)}
                  placeholder="Dán Presentation ID của Google Slides..."
                  aria-label="Presentation ID của Google Slides"
                  className="flex-1 rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
                />
                <button
                  type="button"
                  disabled={busyAction === 'slides'}
                  onClick={() =>
                    runReadAction('slides', async (token) => {
                      if (!slideId.trim()) throw new Error('Vui lòng nhập Presentation ID.');
                      const summary = await getSlideDeckSummary(token, slideId);
                      setSlideSummary(summary);
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 whitespace-nowrap"
                >
                  {busyAction === 'slides' ? 'Đang đọc...' : 'Đọc Slides'}
                </button>
              </div>
              {slideSummary && (
                <div className="rounded-xl border border-[#e2eaf2] bg-[#fbfdff] p-3.5 text-xs space-y-1.5">
                  <div className="font-bold text-[#19324d]">
                    {slideSummary.title} ({slideSummary.slideCount} trang chiếu)
                  </div>
                  {slideSummary.snippets.map((sn, idx) => (
                    <p key={idx} className="text-[#52677e]">
                      {sn}
                    </p>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: SHEETS & FORMS */}
      {activeTab === 'sheets_forms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#174b78]">
              <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
              <h2 className="text-lg font-bold">Google Sheets – Xuất & đọc bảng theo dõi</h2>
            </div>

            <div className="space-y-2">
              <label htmlFor="sheet-title" className="block text-xs font-bold text-[#19324d]">
                Tạo bảng tính mới từ Study Plan & Khảo sát
              </label>
              <div className="flex gap-2">
                <input
                  id="sheet-title"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  className="flex-1 rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
                />
                <button
                  type="button"
                  onClick={handleRequestExportSheet}
                  className="px-4 py-2 rounded-xl bg-[#13a887] text-white text-sm font-bold hover:bg-[#0e8a6f] whitespace-nowrap"
                >
                  Xuất Sheets
                </button>
              </div>
              {createdSheetUrl && (
                <a
                  href={createdSheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1677d2] hover:underline"
                >
                  Mở Google Sheets vừa xuất
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="pt-4 border-t border-[#e2eaf2] space-y-2">
              <label htmlFor="read-sheet-id" className="block text-xs font-bold text-[#19324d]">
                Đọc dữ liệu từ Spreadsheet ID bất kỳ
              </label>
              <div className="flex gap-2">
                <input
                  id="read-sheet-id"
                  value={readSheetId}
                  onChange={(e) => setReadSheetId(e.target.value)}
                  placeholder="Dán Spreadsheet ID..."
                  className="flex-1 rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
                />
                <button
                  type="button"
                  disabled={busyAction === 'sheets'}
                  onClick={() =>
                    runReadAction('sheets', async (token) => {
                      if (!readSheetId.trim()) throw new Error('Vui lòng nhập Spreadsheet ID.');
                      const preview = await readSpreadsheetPreview(token, readSheetId);
                      setSheetPreview(preview);
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 whitespace-nowrap"
                >
                  {busyAction === 'sheets' ? 'Đang đọc...' : 'Xem trước'}
                </button>
              </div>

              {sheetPreview && (
                <div className="mt-3 rounded-xl border border-[#e2eaf2] p-3 bg-[#fbfdff] overflow-x-auto">
                  <div className="text-xs font-bold text-[#19324d] mb-2">
                    {sheetPreview.title} · Tab: {sheetPreview.sheetName}
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {sheetPreview.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-[#eef4f9]">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="py-1.5 pr-3 text-[#52677e]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#174b78]">
              <ClipboardList className="w-5 h-5" aria-hidden="true" />
              <h2 className="text-lg font-bold">Google Forms – Tra cứu biểu mẫu lớp học</h2>
            </div>
            <p className="text-xs text-[#64748b]">
              Nhập Form ID để xem tiêu đề, số lượng câu hỏi và tổng số lượt phản hồi đã nộp.
            </p>
            <div className="flex gap-2">
              <input
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="Dán Form ID của Google Forms..."
                aria-label="Google Form ID"
                className="flex-1 rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
              />
              <button
                type="button"
                disabled={busyAction === 'forms'}
                onClick={() =>
                  runReadAction('forms', async (token) => {
                    if (!formId.trim()) throw new Error('Vui lòng nhập Form ID.');
                    const info = await getFormSummary(token, formId);
                    setFormSummary(info);
                  })
                }
                className="px-4 py-2 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 whitespace-nowrap"
              >
                {busyAction === 'forms' ? 'Đang tải...' : 'Kiểm tra Form'}
              </button>
            </div>

            {formSummary && (
              <div className="rounded-xl border border-[#e2eaf2] bg-[#fbfdff] p-4 space-y-2 text-sm">
                <div className="font-bold text-[#19324d]">{formSummary.title}</div>
                {formSummary.description && (
                  <p className="text-xs text-[#52677e]">{formSummary.description}</p>
                )}
                <div className="text-xs text-[#64748b] font-mono-num">
                  Số mục: {formSummary.questionCount} · Số phản hồi: {formSummary.responseCount}
                </div>
                {formSummary.responderUri && (
                  <a
                    href={formSummary.responderUri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1677d2] hover:underline"
                  >
                    Mở biểu mẫu điền trực tiếp
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: GMAIL, CHAT, MEET, CONTACTS */}
      {activeTab === 'comms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gmail + Contacts */}
          <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#174b78]">
                <Mail className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-lg font-bold">Gmail & Contacts</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busyAction === 'contacts'}
                  onClick={() =>
                    runReadAction('contacts', async (token) => {
                      const list = await listGoogleContacts(token);
                      setContacts(list);
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#eaf6ff] text-[#1677d2] text-xs font-bold hover:bg-[#d8eeff]"
                >
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  {busyAction === 'contacts' ? 'Đang tải...' : 'Tải Danh bạ'}
                </button>
                <button
                  type="button"
                  disabled={busyAction === 'gmail'}
                  onClick={() =>
                    runReadAction('gmail', async (token) => {
                      const msgs = await listRecentGmail(token);
                      setGmailMessages(msgs);
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#1677d2] text-white text-xs font-bold hover:bg-[#105ca8]"
                >
                  {busyAction === 'gmail' ? 'Đang tải...' : 'Đọc hộp thư'}
                </button>
              </div>
            </div>

            {contacts.length > 0 && (
              <div>
                <label htmlFor="contact-picker" className="block text-xs font-bold text-[#64748b] mb-1">
                  Chọn nhanh người nhận từ Google Contacts ({contacts.length})
                </label>
                <select
                  id="contact-picker"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setMailTo(e.target.value);
                  }}
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3 py-2 text-xs"
                >
                  <option value="">-- Chọn liên hệ để điền vào ô Người nhận --</option>
                  {contacts.map((c) => (
                    <option key={c.resourceName} value={c.email}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleRequestSendGmail} className="space-y-3 pt-2 border-t border-[#eef4f9]">
              <input
                type="email"
                value={mailTo}
                onChange={(e) => setMailTo(e.target.value)}
                placeholder="Email giáo viên hoặc bạn học..."
                aria-label="Email người nhận"
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
              />
              <input
                value={mailSubject}
                onChange={(e) => setMailSubject(e.target.value)}
                placeholder="Tiêu đề email"
                aria-label="Tiêu đề email"
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
              />
              <textarea
                rows={3}
                value={mailBody}
                onChange={(e) => setMailBody(e.target.value)}
                placeholder="Nội dung báo cáo tiến độ học tập..."
                aria-label="Nội dung email"
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMailBody(buildStudyNoteText())}
                  className="text-xs font-bold text-[#1677d2] hover:underline"
                >
                  Chèn tóm tắt tiến độ hiện tại
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8]"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  Gửi email
                </button>
              </div>
            </form>

            {gmailMessages.length > 0 && (
              <div className="pt-3 border-t border-[#e2eaf2] space-y-2 max-h-56 overflow-y-auto">
                <div className="text-xs font-bold text-[#64748b]">Thư gần đây</div>
                {gmailMessages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-[#e2eaf2] p-3 text-xs">
                    <div className="font-bold text-[#19324d] truncate">{m.subject}</div>
                    <div className="text-[#64748b] truncate">{m.from}</div>
                    <p className="mt-1 text-[#52677e] line-clamp-2">{m.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Meet & Chat */}
          <div className="space-y-6">
            <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#174b78]">
                <Video className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-lg font-bold">Google Meet – Phòng học nhóm</h2>
              </div>
              <p className="text-xs text-[#64748b]">
                Khởi tạo nhanh phòng họp Google Meet để trao đổi bài tập nhóm hoặc hỏi đáp trực tuyến với thầy cô.
              </p>
              <button
                type="button"
                onClick={handleRequestCreateMeet}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#13a887] text-white text-sm font-bold hover:bg-[#0e8a6f]"
              >
                <Video className="w-4 h-4" aria-hidden="true" />
                Tạo phòng Google Meet
              </button>
              {meetRoom && (
                <div className="rounded-xl border border-[#a7f3d0] bg-[#e6faf4] p-3.5 text-sm">
                  <div className="font-bold text-[#08775e]">
                    Mã phòng: <span className="font-mono-num">{meetRoom.meetingCode}</span>
                  </div>
                  <a
                    href={meetRoom.meetingUri}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#1677d2] hover:underline"
                  >
                    Tham gia phòng học ngay
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              )}
            </section>

            <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#174b78]">
                  <MessageSquare className="w-5 h-5" aria-hidden="true" />
                  <h2 className="text-lg font-bold">Google Chat</h2>
                </div>
                <button
                  type="button"
                  disabled={busyAction === 'chat'}
                  onClick={() =>
                    runReadAction('chat', async (token) => {
                      const spaces = await listChatSpaces(token);
                      setChatSpaces(spaces);
                      if (spaces[0]?.name) setSelectedSpace(spaces[0].name);
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#eaf6ff] text-[#1677d2] text-xs font-bold hover:bg-[#d8eeff]"
                >
                  {busyAction === 'chat' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    'Tải không gian Chat'
                  )}
                </button>
              </div>
              <p className="text-xs text-[#64748b]">
                Hỗ trợ tài khoản Google Workspace của nhà trường (cần cấu hình Chat App trên Google Cloud Console project{' '}
                <span className="font-mono-num">{WORKSPACE_PROJECT_ID}</span>).
              </p>

              <form onSubmit={handleRequestSendChat} className="space-y-2.5">
                <select
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  aria-label="Chọn không gian Google Chat"
                  className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2 text-sm"
                >
                  <option value="">-- Chọn không gian Google Chat --</option>
                  {chatSpaces.map((sp) => (
                    <option key={sp.name} value={sp.name}>
                      {sp.displayName || sp.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    placeholder="Nhập tin nhắn chia sẻ tiến độ..."
                    aria-label="Tin nhắn Google Chat"
                    className="flex-1 rounded-xl border border-[#d7e2ed] px-3.5 py-2 text-sm focus:outline-none focus:border-[#1677d2]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] whitespace-nowrap"
                  >
                    Gửi
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
