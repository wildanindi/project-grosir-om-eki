import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${
                        toast.type === 'error'
                            ? 'bg-rose-950/90 border-rose-700/60 text-rose-100'
                            : toast.type === 'warning'
                            ? 'bg-amber-950/90 border-amber-700/60 text-amber-100'
                            : toast.type === 'info'
                            ? 'bg-sky-950/90 border-sky-700/60 text-sky-100'
                            : 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100'
                    }`}
                >
                    <div className="mt-0.5 shrink-0">
                        {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                        {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                        {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
                        {(!toast.type || toast.type === 'success') && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="flex-1 text-sm font-medium leading-relaxed">
                        {toast.message}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-slate-400 hover:text-slate-200 transition-colors p-1 -mr-1 -mt-1 rounded-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
