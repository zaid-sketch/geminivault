import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 flex flex-col gap-2 max-w-md pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl transition-all duration-200 ${
              isSuccess
                ? 'bg-[#141417] border-emerald-500/50 text-emerald-300 shadow-emerald-950/20'
                : isError
                ? 'bg-[#141417] border-rose-500/50 text-rose-300 shadow-rose-950/20'
                : 'bg-[#141417] border-[#27272A] text-white shadow-black/40'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 text-sm">
              <p className="font-semibold text-white">{toast.message}</p>
              {toast.details && (
                <p className="mt-0.5 text-xs text-[#A1A1AA]">{toast.details}</p>
              )}
            </div>

            <button
              id={`dismiss-toast-${toast.id}`}
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 text-[#71717A] hover:text-white rounded-md transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
