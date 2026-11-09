import React from 'react';
import { Shield, RotateCcw } from 'lucide-react';

export default function Navbar({ onReset }) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">E.D.I.T.H.</h1>
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                Privacy Assistant
              </span>
            </div>
            <p className="text-xs text-slate-500">Protecting your personal data, contacts & location</p>
          </div>
        </div>

        <button 
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-2 rounded-xl transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
        </button>
      </div>
    </header>
  );
}