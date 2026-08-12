import { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { getRouter } from './router';
import './index.css';

const router = getRouter();

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#08060F] text-white flex flex-col items-center justify-center p-6 text-center font-sans dir-rtl">
          <div className="max-w-md w-full bg-[#120F23] border border-red-500/30 rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400 mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h1 className="text-xl font-bold mb-2 text-white">تنبيه من متجر إندكس</h1>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              حدث خطأ غير متوقع أثناء تحميل الواجهة. يرجى إعادة تحميل الصفحة.
            </p>
            <div className="bg-black/40 rounded-xl p-3 mb-6 text-xs text-red-300 text-left dir-ltr overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#2F6BFF] hover:bg-[#2458D8] text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg cursor-pointer"
            >
              إعادة تحميل الصفحة 🔄
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);

