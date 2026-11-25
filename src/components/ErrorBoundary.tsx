import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Đã xảy ra lỗi không mong muốn trong ứng dụng.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('EDU SMART ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          friendly = `Lỗi truy cập dữ liệu (${parsed.operationType || 'read'}): ${parsed.error}`;
        }
      } catch {
        // plain string message
      }

      return (
        <div className="min-h-screen bg-[#f5faff] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#e2eaf2] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 text-[#b91c1c] mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h1 className="text-lg font-bold">Không thể hiển thị nội dung</h1>
            </div>
            <p className="text-sm text-[#52677e] mb-5 break-words">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1677d2] text-white text-sm font-semibold hover:bg-[#105ca8] transition-colors"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
