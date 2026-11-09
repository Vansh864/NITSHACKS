import React from 'react';
import { 
  ArrowLeft, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play 
} from 'lucide-react';

export default function AppDetail({ 
  app, 
  onBack, 
  onTogglePermission, 
  onFixRisky, 
  onSimulate 
}) {
  const isRisky = app.trustScore < 50;
  const isCaution = app.trustScore >= 50 && app.trustScore < 80;

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to All Apps
      </button>

      {/* App Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-3xl flex items-center justify-center shadow-inner">
            {app.icon}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900">{app.name}</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                isRisky ? 'bg-red-50 text-red-700 border-red-200' :
                isCaution ? 'bg-amber-50 text-amber-800 border-amber-200' :
                'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {app.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{app.category} • Installed {app.installDate}</p>
          </div>
        </div>

        {/* Trust Score Card */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Privacy Safety Score</div>
            <div className={`text-3xl font-extrabold mt-0.5 ${
              isRisky ? 'text-red-600' :
              isCaution ? 'text-amber-600' :
              'text-emerald-600'
            }`}>
              {app.trustScore} <span className="text-base font-normal text-slate-400">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plain Explanation Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Why does this app have this score?</h4>
          <p className="text-sm text-blue-800 mt-1 leading-relaxed">{app.plainExplanation}</p>
        </div>
      </div>

      {/* Permissions & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Permissions This App Uses</h3>
              <p className="text-xs text-slate-500">Turn off any permission you do not trust</p>
            </div>
            {app.permissions.some(p => p.risk === 'HIGH' && p.status === 'allowed') && (
              <button 
                onClick={() => onFixRisky(app.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
              >
                Turn Off Risky Permissions
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {app.permissions.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">This app does not ask for any sensitive permissions.</p>
            ) : (
              app.permissions.map(perm => (
                <div key={perm.name} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{perm.name}</div>
                    <div className="text-xs text-slate-500">{perm.purpose}</div>
                  </div>

                  <button
                    onClick={() => onTogglePermission(app.id, perm.name)}
                    className={`text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                      perm.status === 'allowed'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {perm.status === 'allowed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Allowed
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" /> Blocked
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Recent App Activity</h3>
                <p className="text-xs text-slate-500">Every time the app checked your data</p>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
              {app.timeline.map((entry, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    entry.severity === 'HIGH' ? 'bg-red-500' :
                    entry.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div>
                    <p className="text-xs font-medium text-slate-800">{entry.event}</p>
                    <span className="text-[11px] text-slate-400">{entry.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">For Testing / Presentation:</span>
              <button
                onClick={() => onSimulate(app.id)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5" /> Simulate Secret Contact Read
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}