import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export type AppPageId =
  | 'home'
  | 'survey'
  | 'study'
  | 'progress'
  | 'stats'
  | 'workspace'
  | 'account';

interface NavbarProps {
  activePage: AppPageId;
  userLabel: string | null;
  onNavigate: (page: AppPageId) => void;
}

const NAV_ITEMS: Array<{ id: AppPageId; label: string }> = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'survey', label: 'Khảo sát' },
  { id: 'study', label: 'Học tập' },
  { id: 'progress', label: 'Tiến độ' },
  { id: 'stats', label: 'Thống kê' },
  { id: 'workspace', label: 'Workspace' },
];

export function Navbar({ activePage, userLabel, onNavigate }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelect = (page: AppPageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#e2eaf2]">
      <div className="max-w-[1200px] mx-auto px-5 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="text-xl font-extrabold tracking-wide text-[#1677d2] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1677d2] rounded-md"
        >
          EDU SMART
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm font-semibold whitespace-nowrap shrink-0 py-1 border-b-2 focus-visible:outline-2 focus-visible:outline-[#1677d2] focus-visible:outline-offset-4 rounded-sm ${
                  isActive
                    ? 'text-[#1677d2] border-[#1677d2]'
                    : 'text-[#52677e] border-transparent hover:text-[#19324d] hover:border-[#cbd5e1]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelect('account')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 max-w-[180px] truncate transition-colors duration-150 ${
              activePage === 'account'
                ? 'bg-[#105ca8] text-white'
                : 'bg-[#1677d2] text-white hover:bg-[#105ca8]'
            }`}
          >
            {userLabel || 'Tài khoản'}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-xl text-[#52677e] hover:bg-[#eaf6ff] hover:text-[#1677d2] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Menu di động"
          className="md:hidden border-t border-[#e2eaf2] bg-white px-5 py-3 flex flex-wrap gap-2"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
                  isActive
                    ? 'bg-[#eaf6ff] text-[#1677d2]'
                    : 'text-[#52677e] hover:bg-[#f5faff]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
