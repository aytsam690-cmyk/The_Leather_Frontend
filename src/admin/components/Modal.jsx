import { useEffect } from 'react';
import { X } from 'lucide-react';

const SIZES = { sm: '400px', md: '560px', lg: '720px', xl: '900px' };

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        style={{ animation: 'fadeIn 0.15s ease' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="relative bg-white rounded-sm shadow-2xl flex flex-col overflow-hidden z-10"
        style={{ width: '100%', maxWidth: SIZES[size], maxHeight: '90vh', animation: 'scaleIn 0.18s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E8E4] shrink-0">
          <h3 className="font-bold text-[#111111] text-base">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm flex items-center justify-center hover:bg-[#F8F8F6] transition-all text-[#6B6B6B]"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {/* Footer slot */}
        {footer && <div className="border-t border-[#E8E8E4] px-5 py-4 shrink-0 bg-[#F8F8F6]">{footer}</div>}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
      `}</style>
    </div>
  );
}
