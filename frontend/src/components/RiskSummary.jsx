import React from 'react';
import { AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';

export default function RiskSummary({ riskyCount, cautionCount, safeCount, activeZone, onSelectZone }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div 
        onClick={() => onSelectZone(activeZone === 'RISKY' ? 'ALL' : 'RISKY')}
        className={`p-5 rounded-2xl border cursor-pointer transition ${
          activeZone === 'RISKY' 
            ? 'bg-red-50 border-red-400 ring-2 ring-red-400 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-red-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Needs Attention</span>
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="text-3xl font-extrabold text-red-600 mt-2">{riskyCount} Apps</div>
        <p className="text-xs text-slate-500 mt-1">Apps reading data without clear reasons.</p>
      </div>

      <div 
        onClick={() => onSelectZone(activeZone === 'CAUTION' ? 'ALL' : 'CAUTION')}
        className={`p-5 rounded-2xl border cursor-pointer transition ${
          activeZone === 'CAUTION' 
            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Review Recommended</span>
          <HelpCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="text-3xl font-extrabold text-amber-600 mt-2">{cautionCount} Apps</div>
        <p className="text-xs text-slate-500 mt-1">Apps asking for slightly unusual access.</p>
      </div>

      <div 
        onClick={() => onSelectZone(activeZone === 'SAFE' ? 'ALL' : 'SAFE')}
        className={`p-5 rounded-2xl border cursor-pointer transition ${
          activeZone === 'SAFE' 
            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Safe & Normal</span>
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="text-3xl font-extrabold text-emerald-600 mt-2">{safeCount} Apps</div>
        <p className="text-xs text-slate-500 mt-1">Well-behaved apps with no red flags.</p>
      </div>
    </div>
  );
}