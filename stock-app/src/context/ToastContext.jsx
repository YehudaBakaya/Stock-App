import { createContext, useContext, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

const TOAST_DURATION = 4000;

const typeStyles = {
  success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
  error: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
};

const barStyles = {
  success: 'bg-emerald-400',
  error: 'bg-rose-400',
  info: 'bg-blue-400',
};

function Toast({ toast, onRemove }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
      setProgress(pct);
      if (pct > 0) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative overflow-hidden w-72 px-4 py-3 rounded-xl text-sm border shadow-lg cursor-pointer ${typeStyles[toast.type] || typeStyles.info}`}
      onClick={() => onRemove(toast.id)}
    >
      <div className="flex items-start gap-2">
        <span className="flex-1">{toast.message}</span>
        <X className="w-4 h-4 opacity-60 shrink-0 mt-0.5" />
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-white/10 w-full">
        <div
          className={`h-full transition-none ${barStyles[toast.type] || barStyles.info}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION);
  };

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
