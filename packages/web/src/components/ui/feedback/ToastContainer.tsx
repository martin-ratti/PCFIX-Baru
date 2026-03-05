import React, { useEffect, useState } from 'react';
import { useToastStore, type Toast, type ToastType } from '../../../stores/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const styles: Record<ToastType, string> = {
  success: 'bg-green-600/90 border-green-500/50 text-white shadow-green-900/20',
  error: 'bg-red-600/90 border-red-500/50 text-white shadow-red-900/20',
  info: 'bg-blue-600/90 border-blue-500/50 text-white shadow-blue-900/20',
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};


const ToastItem = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onRemove(toast.id);
      }, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md
        transition-all duration-300 transform
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}
        ${styles[toast.type]}
      `}
    >
      <div className="shrink-0">{icons[toast.type]}</div>
      <p className="text-sm font-medium flex-grow">{toast.message}</p>
      <button
        onClick={() => { setIsVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (

    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );
}