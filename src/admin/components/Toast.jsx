import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const TYPES = {
  success: { icon: CheckCircle,    border: '#10b981', bg: '#f0fdf4', text: '#065f46', iconColor: '#10b981' },
  error:   { icon: XCircle,        border: '#ef4444', bg: '#fef2f2', text: '#7f1d1d', iconColor: '#ef4444' },
  warning: { icon: AlertTriangle,  border: '#C9A96E', bg: '#fffbeb', text: '#78350f', iconColor: '#C9A96E' },
  info:    { icon: Info,           border: '#3b82f6', bg: '#eff6ff', text: '#1e3a5f', iconColor: '#3b82f6' },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  const cfg = TYPES[type] || TYPES.success;
  const Icon = cfg.icon;

  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-sm shadow-xl min-w-[260px] max-w-[360px] border-l-4"
      style={{ background: cfg.bg, borderLeftColor: cfg.border, animation: 'slideIn 0.25s ease', color: cfg.text }}
    >
      <Icon size={18} style={{ color: cfg.iconColor, marginTop: 1, shrink: 0 }} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="text-current opacity-50 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden" style={{ background: `${cfg.border}30` }}>
        <div className="h-full" style={{ background: cfg.border, animation: 'shrink 3s linear forwards' }} />
      </div>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(60px) } to { opacity:1; transform:translateX(0) } }
        @keyframes shrink  { from { width:100% } to { width:0% } }
      `}</style>
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-[300] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="relative">
          <Toast message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}

// ─── useAdminToast hook ───────────────────────────────────────────────────────
export function useAdminToast() {
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));
  const ToastUI = () => <ToastContainer toasts={toasts} removeToast={removeToast} />;
  return { showToast, ToastUI };
}
