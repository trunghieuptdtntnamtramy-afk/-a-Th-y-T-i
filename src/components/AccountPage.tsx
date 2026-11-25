import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, LogOut, ShieldCheck } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { AccountRole, UserAccountProfile } from '../utils/eduLogic';
import { GoogleSignInButton } from './GoogleSignInButton';

interface AccountPageProps {
  user: User | null;
  profile: UserAccountProfile | null;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSaveProfile: (input: Omit<UserAccountProfile, 'uid' | 'role' | 'teacherApproved'>) => Promise<void>;
}

export function AccountPage({
  user,
  profile,
  onGoogleSignIn,
  onSignOut,
  onSaveProfile,
}: AccountPageProps) {
  const [requestedRole, setRequestedRole] = useState<AccountRole>('student');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [className, setClassName] = useState('');
  const [homeroom, setHomeroom] = useState('');
  const [subjectTeacher, setSubjectTeacher] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [signingIn, setSigningIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setRequestedRole(profile.requestedRole);
      setDisplayName(profile.displayName);
      setBirthDate(profile.birthDate);
      setClassName(profile.className);
      setHomeroom(profile.homeroom);
      setSubjectTeacher(profile.subjectTeacher);
      setPhone(profile.phone);
      setEmail(profile.email || user?.email || '');
    } else if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const handleLogin = async () => {
    setSigningIn(true);
    setFeedback(null);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Đăng nhập Google thất bại.',
      });
    } finally {
      setSigningIn(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!user) {
      setFeedback({
        type: 'error',
        text: 'Vui lòng đăng nhập bằng Google trước khi lưu hồ sơ tài khoản vào hệ thống.',
      });
      return;
    }

    if (!displayName.trim()) {
      setFeedback({ type: 'error', text: 'Vui lòng nhập họ và tên.' });
      return;
    }

    setSaving(true);
    try {
      await onSaveProfile({
        displayName: displayName.trim(),
        requestedRole,
        className: className.trim(),
        homeroom: homeroom.trim(),
        subjectTeacher: subjectTeacher.trim(),
        phone: phone.trim(),
        birthDate: birthDate.trim(),
        email: email.trim() || user.email || '',
      });
      setFeedback({
        type: 'success',
        text:
          requestedRole === 'teacher' && !profile?.teacherApproved
            ? 'Đã lưu hồ sơ. Yêu cầu vai trò Giáo viên đã được ghi nhận và đang chờ quản trị viên nhà trường phê duyệt.'
            : 'Đã lưu hồ sơ tài khoản lên hệ thống.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Không thể lưu hồ sơ tài khoản.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-extrabold tracking-widest text-[#13a887]">
          XÁC THỰC & HỒ SƠ HỌC TẬP
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#174b78]">Tài khoản EDU SMART</h1>
      </div>

      {/* Sign-In Card */}
      <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {user ? (
          <>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-[#08775e]">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Đã đăng nhập qua Google</span>
              </div>
              <div className="text-base font-bold text-[#19324d]">
                {profile?.displayName || user.displayName || 'Thành viên EDU SMART'}
              </div>
              <div className="text-xs text-[#64748b]">
                {user.email} · Vai trò hiệu lực:{' '}
                {profile?.role === 'teacher' && profile.teacherApproved
                  ? 'Giáo viên (đã duyệt)'
                  : 'Học sinh'}
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#d7e2ed] text-sm font-semibold text-[#52677e] hover:bg-[#f5faff] self-start sm:self-center"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-base font-bold text-[#19324d]">Đăng nhập bằng tài khoản Google</h2>
              <p className="text-sm text-[#64748b] mt-1">
                Đồng bộ kế hoạch học tập, nhật ký Think First, Fact Check, Self Test và kết quả khảo sát giữa các thiết bị.
              </p>
            </div>
            <div className="shrink-0">
              <GoogleSignInButton
                label={signingIn ? 'Đang đăng nhập...' : 'Sign in with Google'}
                disabled={signingIn}
                onClick={handleLogin}
              />
            </div>
          </>
        )}
      </section>

      {/* Profile Form */}
      <section className="bg-white border border-[#e2eaf2] rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[#174b78] mb-4">Thông tin hồ sơ cá nhân</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="acc-role" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Loại tài khoản
              </label>
              <select
                id="acc-role"
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as AccountRole)}
                className="w-full rounded-xl border border-[#d7e2ed] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              >
                <option value="student">Học sinh</option>
                <option value="teacher">Giáo viên (cần phê duyệt)</option>
              </select>
            </div>

            <div>
              <label htmlFor="acc-name" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Họ và tên
              </label>
              <input
                id="acc-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <div>
              <label htmlFor="acc-birth" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Ngày tháng năm sinh
              </label>
              <input
                id="acc-birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            {requestedRole === 'student' ? (
              <div>
                <label htmlFor="acc-class" className="block text-sm font-bold text-[#19324d] mb-1.5">
                  Lớp
                </label>
                <input
                  id="acc-class"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: 12/3"
                  className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="acc-homeroom" className="block text-sm font-bold text-[#19324d] mb-1.5">
                    Lớp chủ nhiệm
                  </label>
                  <input
                    id="acc-homeroom"
                    value={homeroom}
                    onChange={(e) => setHomeroom(e.target.value)}
                    placeholder="Ví dụ: 11/1"
                    className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                  />
                </div>
                <div>
                  <label htmlFor="acc-subject" className="block text-sm font-bold text-[#19324d] mb-1.5">
                    Bộ môn giảng dạy
                  </label>
                  <input
                    id="acc-subject"
                    value={subjectTeacher}
                    onChange={(e) => setSubjectTeacher(e.target.value)}
                    placeholder="Ví dụ: Lịch sử"
                    className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="acc-phone" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Số điện thoại
              </label>
              <input
                id="acc-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại liên hệ"
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>

            <div>
              <label htmlFor="acc-email" className="block text-sm font-bold text-[#19324d] mb-1.5">
                Gmail
              </label>
              <input
                id="acc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full rounded-xl border border-[#d7e2ed] px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#1677d2]"
              />
            </div>
          </div>

          {feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
                feedback.type === 'error'
                  ? 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]'
                  : 'border-[#a7f3d0] bg-[#e6faf4] text-[#08775e]'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#64748b]">
              Tài khoản giáo viên cần được quản trị viên nhà trường phê duyệt. Vai trò quản trị viên không được tự đăng ký.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#1677d2] text-white text-sm font-bold hover:bg-[#105ca8] disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {saving ? 'Đang lưu...' : 'Lưu hồ sơ tài khoản'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
