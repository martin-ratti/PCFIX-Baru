import React, { useEffect, useState } from 'react';
import { useToastStore, type Toast, type ToastType } from '../../../stores/toastStore';

const styles: Record<ToastType, string> = {
  
  success: 'bg-green-600/80 border-green-500/50 text-white shadow-green-900/20',
  error:   'bg-red-600/80 border-red-500/50 text-white shadow-red-900/20',
  info:    'bg-blue-600/80 border-blue-500/50 text-white shadow-blue-900/20',
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  error:   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>,
  info:    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>,
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
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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