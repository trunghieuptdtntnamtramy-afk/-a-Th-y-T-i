import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel = 'Xác nhận thực hiện',
  cancelLabel = 'Hủy',
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#19324d]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md bg-white border border-[#e2eaf2] rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5 text-[#125d9e]">
            <ShieldAlert className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h3 id="confirm-dialog-title" className="text-base font-bold text-[#19324d]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            aria-label="Đóng hộp thoại xác nhận"
            className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#eaf6ff] hover:text-[#1677d2] transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-[#52677e] leading-relaxed">{description}</p>

        {details && details.length > 0 && (
          <ul className="mt-3 space-y-1.5 rounded-xl bg-[#f5faff] border border-[#e2eaf2] p-3 text-xs text-[#19324d]">
            {details.map((item, idx) => (
              <li key={idx} className="break-words">
                {item}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="px-4 py-2 rounded-xl border border-[#d7e2ed] bg-white text-sm font-semibold text-[#52677e] hover:bg-[#f5faff] transition-colors whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="px-4 py-2 rounded-xl bg-[#1677d2] text-sm font-semibold text-white hover:bg-[#105ca8] disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            {isBusy ? 'Đang thực hiện...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
