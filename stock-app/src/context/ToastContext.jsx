import { createContext, useContext, useState } from 'react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

function Toasts({ items, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {items.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl text-sm border shadow-lg cursor-pointer ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
          }`}
          onClick={() => onRemove(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <Toasts items={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
