import React from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

export default function AlertToast({ alert, onBlock, onDismiss }) {
  if (!alert) return null;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-bounce-short">
      <div className="bg-white border-2 border-red-500 rounded-2xl p-4 shadow-2xl shadow-red-500/20 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
              Critical Privacy Alert
            </span>
            <button 
              onClick={onDismiss} 
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="text-sm font-bold text-slate-900 mt-0.5">
            {alert.appName}: Suspicious Access Detected
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {alert.message}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onBlock(alert.appId, alert.permissionName)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition"
            >
              Block {alert.permissionName} Access
            </button>
            <button
              onClick={onDismiss}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}