import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { initialApps } from './data/appsData';
import { fetchAppsData, updateAppPermission, resetAppsData, simulateApp, applyRecommendationFixes } from './services/api';
import Navbar from './components/Navbar';
import RiskSummary from './components/RiskSummary';
import AppCard from './components/AppCard';
import AppDetail from './components/AppDetail';
import AlertToast from './components/AlertToast';

export default function App() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeZone, setActiveZone] = useState('ALL');
  const [currentAlert, setCurrentAlert] = useState(null);

  // Initial load from backend (or fallback to local mock data)
  useEffect(() => {
    fetchAppsData().then((data) => {
      setApps(data || initialApps);
      setLoading(false);
    });
  }, []);

  // Calculate dynamic trust score and status based on active permissions
  const calculateAppHealth = (updatedPermissions) => {
    const allowedPerms = updatedPermissions.filter(p => p.status === 'allowed');
    const allowedRisky = allowedPerms.filter(p => p.risk === 'HIGH');

    // If user blocked every permission, app cannot access any data -> 100% Safe!
    if (allowedPerms.length === 0) {
      return { score: 100, status: 'Safe' };
    }

    // Dynamic heuristic calculation
    let score = 100 - (allowedRisky.length * 25) - ((allowedPerms.length - allowedRisky.length) * 5);
    score = Math.max(score, 20);

    let status = 'Safe';
    if (score < 50) status = 'Dangerous';
    else if (score < 80) status = 'Caution';

    return { score, status };
  };

  // Toggle permission with live dynamic score & status recalculation + API sync
  const handleTogglePermission = (appId, permName) => {
    const currentTarget = apps.find(a => a.id === appId);
    const existingPerm = currentTarget?.permissions.find(p => p.name === permName);
    const nextStatus = existingPerm?.status === 'allowed' ? 'restricted' : 'allowed';

    // Sync with backend API in background
    updateAppPermission(appId, permName, nextStatus);

    setApps(prev => prev.map(app => {
      if (app.id !== appId) return app;

      const updatedPermissions = app.permissions.map(p => {
        if (p.name !== permName) return p;
        return { ...p, status: nextStatus };
      });

      const { score, status } = calculateAppHealth(updatedPermissions);

      const updatedApp = {
        ...app,
        permissions: updatedPermissions,
        trustScore: score,
        status: status
      };

      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(updatedApp);
      }

      return updatedApp;
    }));
  };

  // Turn off risky permissions
  const handleFixRisky = async (appId) => {
    const result = await applyRecommendationFixes(appId);
    if (!result || !result.app) {
      setApps(prev => prev.map(app => {
        if (app.id !== appId) return app;
        const updated = app.permissions.map(p => ({
          ...p,
          status: p.risk === 'HIGH' ? 'restricted' : p.status
        }));

        const { score, status } = calculateAppHealth(updated);
        const updatedApp = { ...app, permissions: updated, trustScore: score, status };
        if (selectedApp && selectedApp.id === appId) setSelectedApp(updatedApp);
        return updatedApp;
      }));
      return;
    }

    const updatedApp = result.app;
    setApps(prev => prev.map(app => app.id === appId ? updatedApp : app));
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp(updatedApp);
    }
  };

  // Simulate secret contact read + Trigger Alert Banner
  const handleSimulate = async (appId) => {
    const result = await simulateApp(appId);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const target = apps.find(a => a.id === appId);

    if (result && result.app) {
      setApps(prev => prev.map(app => app.id === appId ? result.app : app));
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(result.app);
      }
      setCurrentAlert({
        appId,
        appName: result.alert?.appName || target?.name || 'App',
        permissionName: result.alert?.permissionName || 'Contacts',
        message: result.alert?.message || 'The app attempted to read 35 private phone numbers from your address book without active user consent.'
      });
      return;
    }

    setApps(prev => prev.map(app => {
      if (app.id !== appId) return app;
      const newScore = Math.max(app.trustScore - 30, 20);
      const updatedApp = {
        ...app,
        trustScore: newScore,
        status: 'Dangerous',
        timeline: [
          { time, event: 'Alert: App unexpectedly read your contacts in the background!', severity: 'HIGH' },
          ...app.timeline
        ]
      };

      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(updatedApp);
      }

      return updatedApp;
    }));

    setCurrentAlert({
      appId,
      appName: target?.name || 'App',
      permissionName: 'Contacts',
      message: 'The app attempted to read 35 private phone numbers from your address book without active user consent.'
    });
  };

  // Block from Toast
  const handleBlockFromToast = (appId, permName) => {
    handleTogglePermission(appId, permName);
    setCurrentAlert(null);
  };

  const riskyCount = apps.filter(a => a.trustScore < 50).length;
  const cautionCount = apps.filter(a => a.trustScore >= 50 && a.trustScore < 80).length;
  const safeCount = apps.filter(a => a.trustScore >= 80).length;

  const filteredApps = apps.filter(a => {
    const matches = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    a.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeZone === 'RISKY') return matches && a.trustScore < 50;
    if (activeZone === 'CAUTION') return matches && a.trustScore >= 50 && a.trustScore < 80;
    if (activeZone === 'SAFE') return matches && a.trustScore >= 80;
    return matches;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <AlertToast 
        alert={currentAlert}
        onBlock={handleBlockFromToast}
        onDismiss={() => setCurrentAlert(null)}
      />

      <Navbar onReset={async () => {
        await resetAppsData();
        const data = await fetchAppsData();
        setApps(data || initialApps);
        setSelectedApp(null);
        setCurrentAlert(null);
      }} />

      <main className="max-w-6xl mx-auto p-6 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Scanning device applications & permissions...</p>
          </div>
        ) : selectedApp ? (
          <AppDetail 
            app={selectedApp}
            onBack={() => setSelectedApp(null)}
            onTogglePermission={handleTogglePermission}
            onFixRisky={handleFixRisky}
            onSimulate={handleSimulate}
          />
        ) : (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Your Phone's Privacy Overview</h2>
              <p className="text-sm text-slate-500 mt-1">
                E.D.I.T.H. continuously monitors installed apps to make sure none of them misuse your private information or secretly track you.
              </p>
            </div>

            <RiskSummary 
              riskyCount={riskyCount}
              cautionCount={cautionCount}
              safeCount={safeCount}
              activeZone={activeZone}
              onSelectZone={setActiveZone}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search by app name or category..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-400 font-medium mr-1">Filter:</span>
                {[
                  { id: 'ALL', label: `All (${apps.length})` },
                  { id: 'RISKY', label: 'Risky' },
                  { id: 'CAUTION', label: 'Caution' },
                  { id: 'SAFE', label: 'Safe' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveZone(tab.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition ${
                      activeZone === tab.id
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApps.map(app => (
                <AppCard 
                  key={app.id} 
                  app={app} 
                  onSelect={setSelectedApp} 
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}