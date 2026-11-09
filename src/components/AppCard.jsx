import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function AppCard({ app, onSelect }) {
  const isRisky = app.trustScore < 50;
  const isCaution = app.trustScore >= 50 && app.trustScore < 80;

  return (
    <div 
      onClick={() => onSelect(app)}
      className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition duration-150 rounded-2xl p-5 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* App Info & Score */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 text-2xl flex items-center justify-center">
              {app.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{app.name}</h3>
              <p className="text-xs text-slate-500">{app.category}</p>
            </div>
          </div>

          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
            isRisky ? 'bg-red-50 text-red-700 border-red-200' :
            isCaution ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {app.trustScore}% Safe
          </div>
        </div>

        {/* Permissions Tags */}
        <div className="mt-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Permissions:</div>
          <div className="flex flex-wrap gap-1.5">
            {app.permissions.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No sensitive access</span>
            ) : (
              app.permissions.map(p => (
                <span 
                  key={p.name}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium ${
                    p.status === 'restricted'
                      ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                      : p.risk === 'HIGH'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {p.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Status: <strong className={isRisky ? 'text-red-600' : isCaution ? 'text-amber-600' : 'text-emerald-600'}>{app.status}</strong></span>
        <span className="text-blue-600 font-semibold flex items-center gap-0.5">
          Manage <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}