import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { initialApps } from './schema.js';

const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'edith.db');
const jsonStatePath = path.join(dataDir, 'edith.json');

let db = null;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function createSqliteDb() {
  ensureDataDir();
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE IF NOT EXISTS apps (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        icon TEXT,
        install_date TEXT,
        installed_at TEXT,
        trust_score INTEGER,
        status TEXT,
        plain_explanation TEXT,
        last_updated TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT,
        name TEXT,
        status TEXT,
        risk TEXT,
        purpose TEXT,
        created_at TEXT,
        FOREIGN KEY(app_id) REFERENCES apps(id)
      );

      CREATE TABLE IF NOT EXISTS access_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT,
        resource TEXT,
        purpose TEXT,
        background INTEGER,
        item_count INTEGER,
        count INTEGER,
        outcome TEXT,
        timestamp TEXT,
        reason TEXT,
        suspicious INTEGER,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT,
        type TEXT,
        severity TEXT,
        message TEXT,
        evidence TEXT,
        created_at TEXT,
        status TEXT,
        app_name TEXT
      );

      CREATE TABLE IF NOT EXISTS permission_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT,
        permission_name TEXT,
        old_status TEXT,
        new_status TEXT,
        changed_by TEXT,
        reason TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS trust_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT,
        score INTEGER,
        status TEXT,
        breakdown TEXT,
        timestamp TEXT
      );

      CREATE TABLE IF NOT EXISTS recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id TEXT,
        permission_name TEXT,
        suggested_action TEXT,
        reason TEXT,
        priority INTEGER,
        created_at TEXT,
        status TEXT
      );
    `);
    return true;
  } catch (error) {
    console.warn('SQLite unavailable, falling back to JSON store', error.message);
    db = null;
    return false;
  }
}

export function getDb() {
  if (db) return db;
  return null;
}

export function initDatabase() {
  const ok = createSqliteDb();
  if (!ok) {
    if (!fs.existsSync(jsonStatePath)) {
      fs.writeFileSync(jsonStatePath, JSON.stringify({ apps: [], permissions: [], accessEvents: [], alerts: [], permissionHistory: [], trustHistory: [], recommendations: [] }, null, 2));
    }
  }
  return { sqlite: !!db, json: !db };
}

function getJsonState() {
  if (!fs.existsSync(jsonStatePath)) {
    fs.writeFileSync(jsonStatePath, JSON.stringify({ apps: [], permissions: [], accessEvents: [], alerts: [], permissionHistory: [], trustHistory: [], recommendations: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(jsonStatePath, 'utf8'));
}

function saveJsonState(state) {
  fs.writeFileSync(jsonStatePath, JSON.stringify(state, null, 2));
}

function serializeApp(app, permissions = [], accessEvents = [], recommendations = []) {
  const timeline = [...accessEvents]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 7)
    .map((event) => ({
      time: new Date(event.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      event: `${event.outcome === 'blocked' ? 'Blocked' : 'Access'}: ${event.resource} (${event.reason || event.purpose || 'requested access'})`,
      severity: event.outcome === 'blocked' ? 'HIGH' : event.suspicious ? 'MEDIUM' : 'LOW',
      timestamp: event.timestamp,
    }));

  return {
    id: app.id,
    name: app.name,
    category: app.category,
    icon: app.icon,
    trustScore: app.trust_score ?? app.trustScore ?? 0,
    status: app.status,
    installDate: app.install_date ?? app.installDate,
    installedAt: app.installed_at ?? app.installedAt,
    lastUpdated: app.last_updated ?? app.lastUpdated ?? app.created_at ?? new Date().toISOString(),
    permissions: (permissions || []).map((perm) => ({
      name: perm.name,
      status: perm.status,
      risk: perm.risk,
      purpose: perm.purpose,
    })),
    timeline,
    plainExplanation: app.plain_explanation ?? app.plainExplanation,
    recommendations: recommendations.map((reco) => ({
      permissionName: reco.permission_name ?? reco.permissionName,
      suggestedAction: reco.suggested_action ?? reco.suggestedAction,
      reason: reco.reason,
      priority: reco.priority,
    })),
  };
}

export function seedDatabase(appsSeed) {
  if (db) {
    db.exec('DELETE FROM recommendations; DELETE FROM permission_history; DELETE FROM trust_history; DELETE FROM access_events; DELETE FROM alerts; DELETE FROM permissions; DELETE FROM apps;');
    const appInsert = db.prepare(`INSERT INTO apps (id, name, category, icon, install_date, installed_at, trust_score, status, plain_explanation, last_updated, created_at) VALUES (@id, @name, @category, @icon, @installDate, @installedAt, @trustScore, @status, @plainExplanation, @lastUpdated, @createdAt)`);
    const permInsert = db.prepare(`INSERT INTO permissions (app_id, name, status, risk, purpose, created_at) VALUES (@appId, @name, @status, @risk, @purpose, @createdAt)`);
    const tx = db.transaction((seed) => {
      for (const app of seed) {
        appInsert.run({
          id: app.id,
          name: app.name,
          category: app.category,
          icon: app.icon,
          installDate: app.installDate,
          installedAt: app.installedAt || new Date().toISOString(),
          trustScore: app.trustScore,
          status: app.status,
          plainExplanation: app.plainExplanation,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });

        if (Array.isArray(app.permissions)) {
          for (const permission of app.permissions) {
            permInsert.run({
              appId: app.id,
              name: permission.name,
              status: permission.status,
              risk: permission.risk,
              purpose: permission.purpose,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });
    tx(appsSeed);
    return true;
  }

  const state = getJsonState();
  state.apps = appsSeed.map((app) => ({
    ...app,
    install_date: app.installDate,
    installed_at: app.installedAt || new Date().toISOString(),
    trust_score: app.trustScore,
    status: app.status,
    plain_explanation: app.plainExplanation,
    last_updated: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }));
  state.permissions = [];
  state.accessEvents = [];
  state.alerts = [];
  state.permissionHistory = [];
  state.trustHistory = [];
  state.recommendations = [];

  for (const app of state.apps) {
    for (const permission of app.permissions || []) {
      state.permissions.push({
        app_id: app.id,
        name: permission.name,
        status: permission.status,
        risk: permission.risk,
        purpose: permission.purpose,
        created_at: new Date().toISOString(),
      });
    }
  }

  saveJsonState(state);
  return true;
}

export function getAllApps() {
  if (db) {
    const apps = db.prepare('SELECT * FROM apps ORDER BY name').all();
    return apps.map((app) => {
      const permissions = db.prepare('SELECT * FROM permissions WHERE app_id = ? ORDER BY name').all(app.id);
      const recentEvents = db.prepare('SELECT * FROM access_events WHERE app_id = ? ORDER BY timestamp DESC LIMIT 10').all(app.id);
      const recommendations = db.prepare('SELECT * FROM recommendations WHERE app_id = ? ORDER BY priority DESC, created_at DESC').all(app.id);
      return serializeApp(app, permissions, recentEvents, recommendations);
    });
  }

  const state = getJsonState();
  return state.apps.map((app) => {
    const permissions = state.permissions.filter((perm) => perm.app_id === app.id);
    const recentEvents = state.accessEvents.filter((event) => event.app_id === app.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    const recommendations = state.recommendations.filter((rec) => rec.app_id === app.id);
    return serializeApp(app, permissions, recentEvents, recommendations);
  });
}

export function getAppById(id) {
  if (db) {
    const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(id);
    if (!app) return null;
    const permissions = db.prepare('SELECT * FROM permissions WHERE app_id = ? ORDER BY name').all(id);
    const accessEvents = db.prepare('SELECT * FROM access_events WHERE app_id = ? ORDER BY timestamp DESC').all(id);
    const recommendations = db.prepare('SELECT * FROM recommendations WHERE app_id = ? ORDER BY priority DESC, created_at DESC').all(id);
    const alerts = db.prepare('SELECT * FROM alerts WHERE app_id = ? AND status != ? ORDER BY created_at DESC').all(id, 'resolved');
    return { ...serializeApp(app, permissions, accessEvents, recommendations), openAlerts: alerts, appRecord: app };
  }

  const state = getJsonState();
  const app = state.apps.find((entry) => entry.id === id);
  if (!app) return null;
  const permissions = state.permissions.filter((perm) => perm.app_id === id);
  const accessEvents = state.accessEvents.filter((event) => event.app_id === id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recommendations = state.recommendations.filter((rec) => rec.app_id === id);
  const alerts = state.alerts.filter((alert) => alert.app_id === id && alert.status !== 'resolved');
  return { ...serializeApp(app, permissions, accessEvents, recommendations), openAlerts: alerts, appRecord: app };
}

export function upsertPermission(appId, permissionName, status, changedBy = 'user') {
  if (db) {
    const existing = db.prepare('SELECT * FROM permissions WHERE app_id = ? AND name = ?').get(appId, permissionName);
    if (!existing) {
      db.prepare(`INSERT INTO permissions (app_id, name, status, risk, purpose, created_at) VALUES (?, ?, ?, 'MEDIUM', 'Requested access', ?)`).run(appId, permissionName, status, new Date().toISOString());
    } else {
      db.prepare('UPDATE permissions SET status = ?, purpose = COALESCE(purpose, ?) WHERE app_id = ? AND name = ?').run(status, existing.purpose || 'Updated access', appId, permissionName);
    }

    db.prepare('INSERT INTO permission_history (app_id, permission_name, old_status, new_status, changed_by, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(existing?.status || 'unknown', status, changedBy, existing?.status || 'unknown', status, `Permission set by ${changedBy}`, new Date().toISOString());
    return true;
  }

  const state = getJsonState();
  const permission = state.permissions.find((entry) => entry.app_id === appId && entry.name === permissionName);
  if (!permission) {
    state.permissions.push({ app_id: appId, name: permissionName, status, risk: 'MEDIUM', purpose: 'App requested access', created_at: new Date().toISOString() });
  } else {
    permission.status = status;
  }
  state.permissionHistory.push({
    app_id: appId,
    permission_name: permissionName,
    old_status: permission?.status ?? 'unknown',
    new_status: status,
    changed_by: changedBy,
    reason: `Permission set by ${changedBy}`,
    timestamp: new Date().toISOString(),
  });
  saveJsonState(state);
  return true;
}

export function createAccessEvent({ appId, resource, purpose, background, itemCount, count, outcome = 'granted', reason = '', suspicious = 0 }) {
  const entry = {
    app_id: appId,
    resource,
    purpose,
    background: background ? 1 : 0,
    item_count: itemCount || 0,
    count: count || 1,
    outcome,
    reason,
    suspicious: suspicious ? 1 : 0,
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  if (db) {
    const stmt = db.prepare(`INSERT INTO access_events (app_id, resource, purpose, background, item_count, count, outcome, reason, suspicious, timestamp, created_at) VALUES (@app_id, @resource, @purpose, @background, @item_count, @count, @outcome, @reason, @suspicious, @timestamp, @created_at)`);
    stmt.run(entry);
    return entry;
  }

  const state = getJsonState();
  state.accessEvents.push(entry);
  saveJsonState(state);
  return entry;
}

export function listAlerts(filters = {}) {
  if (db) {
    let sql = 'SELECT * FROM alerts WHERE 1 = 1';
    const params = [];
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.severity) {
      sql += ' AND severity = ?';
      params.push(filters.severity);
    }
    if (filters.appId) {
      sql += ' AND app_id = ?';
      params.push(filters.appId);
    }
    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params);
  }

  const state = getJsonState();
  return state.alerts
    .filter((alert) => (!filters.status || alert.status === filters.status)
      && (!filters.severity || alert.severity === filters.severity)
      && (!filters.appId || alert.app_id === filters.appId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function createAlert({ appId, type, severity, message, evidence = {}, status = 'open', appName = '' }) {
  const alert = {
    app_id: appId,
    type,
    severity,
    message,
    evidence: JSON.stringify(evidence),
    created_at: new Date().toISOString(),
    status,
    app_name: appName,
  };

  if (db) {
    const stmt = db.prepare(`INSERT INTO alerts (app_id, type, severity, message, evidence, created_at, status, app_name) VALUES (@app_id, @type, @severity, @message, @evidence, @created_at, @status, @app_name)`);
    const result = stmt.run(alert);
    return { ...alert, id: Number(result.lastInsertRowid) };
  }

  const state = getJsonState();
  const nextId = state.alerts.length ? Math.max(...state.alerts.map((item) => item.id || 0)) + 1 : 1;
  const record = { ...alert, id: nextId };
  state.alerts.push(record);
  saveJsonState(state);
  return record;
}

export function updateAlertStatus(id, status) {
  if (db) {
    db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run(status, id);
    return { id, status };
  }
  const state = getJsonState();
  const target = state.alerts.find((alert) => alert.id === Number(id));
  if (target) target.status = status;
  saveJsonState(state);
  return { id, status };
}

export function getAllHistory({ appId, type, severity, startDate, endDate, limit = 50, offset = 0 }) {
  if (db) {
    const rows = [];
    const eventRows = db.prepare(`SELECT id, app_id, resource as item, purpose as detail, 'access' as type, outcome as severity, timestamp, created_at FROM access_events WHERE (? IS NULL OR app_id = ?) AND (? IS NULL OR outcome = ?) AND (? IS NULL OR timestamp >= ?) AND (? IS NULL OR timestamp <= ?) ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(
      appId ?? null,
      appId ?? null,
      severity ?? null,
      severity ?? null,
      startDate ?? null,
      startDate ?? null,
      endDate ?? null,
      endDate ?? null,
      limit,
      offset,
    );
    for (const row of eventRows) rows.push({ ...row, category: 'access' });

    const alertRows = db.prepare(`SELECT id, app_id, type as item, message as detail, 'alert' as type, severity, created_at as timestamp, created_at FROM alerts WHERE (? IS NULL OR app_id = ?) AND (? IS NULL OR severity = ?) AND (? IS NULL OR created_at >= ?) AND (? IS NULL OR created_at <= ?) ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(
      appId ?? null,
      appId ?? null,
      severity ?? null,
      severity ?? null,
      startDate ?? null,
      startDate ?? null,
      endDate ?? null,
      endDate ?? null,
      limit,
      offset,
    );
    for (const row of alertRows) rows.push({ ...row, category: 'alert' });

    const permissionRows = db.prepare(`SELECT id, app_id, permission_name as item, CONCAT(old_status, ' -> ', new_status) as detail, 'permission' as type, 'MEDIUM' as severity, timestamp, timestamp as created_at FROM permission_history WHERE (? IS NULL OR app_id = ?) AND (? IS NULL OR timestamp >= ?) AND (? IS NULL OR timestamp <= ?) ORDER BY timestamp DESC LIMIT ? OFFSET ?`).all(
      appId ?? null,
      appId ?? null,
      startDate ?? null,
      startDate ?? null,
      endDate ?? null,
      endDate ?? null,
      limit,
      offset,
    );
    for (const row of permissionRows) rows.push({ ...row, category: 'permission' });

    return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  const state = getJsonState();
  const combined = [
    ...state.accessEvents.map((entry) => ({ ...entry, type: 'access', category: 'access', detail: entry.purpose, severity: entry.outcome === 'blocked' ? 'HIGH' : entry.suspicious ? 'MEDIUM' : 'LOW' })),
    ...state.alerts.map((entry) => ({ ...entry, type: 'alert', category: 'alert', detail: entry.message, severity: entry.severity, timestamp: entry.created_at, created_at: entry.created_at })),
    ...state.permissionHistory.map((entry) => ({ ...entry, type: 'permission', category: 'permission', detail: `${entry.old_status} -> ${entry.new_status}`, severity: 'MEDIUM', timestamp: entry.timestamp, created_at: entry.timestamp })),
  ];
  return combined.filter((entry) => (!appId || entry.app_id === appId) && (!type || entry.type === type) && (!severity || entry.severity === severity) && (!startDate || new Date(entry.timestamp) >= new Date(startDate)) && (!endDate || new Date(entry.timestamp) <= new Date(endDate))).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(Number(offset), Number(offset) + Number(limit));
}

export function getSummary() {
  if (db) {
    const apps = db.prepare('SELECT * FROM apps').all();
    const totalOpenAlerts = db.prepare('SELECT COUNT(*) as total FROM alerts WHERE status = ?').get('open').total;
    const blockedAttempts = db.prepare('SELECT COUNT(*) as total FROM access_events WHERE outcome = ?').get('blocked').total;
    const safe = apps.filter((app) => app.status === 'Safe').length;
    const caution = apps.filter((app) => app.status === 'Caution').length;
    const dangerous = apps.filter((app) => app.status === 'Dangerous' || app.status === 'Needs Review').length;
    return { safe, caution, dangerous, openAlerts: totalOpenAlerts, blockedAttempts };
  }

  const state = getJsonState();
  const apps = state.apps;
  return {
    safe: apps.filter((app) => app.status === 'Safe').length,
    caution: apps.filter((app) => app.status === 'Caution').length,
    dangerous: apps.filter((app) => app.status === 'Dangerous' || app.status === 'Needs Review').length,
    openAlerts: state.alerts.filter((alert) => alert.status === 'open').length,
    blockedAttempts: state.accessEvents.filter((item) => item.outcome === 'blocked').length,
  };
}

export function getTrustHistory(appId) {
  if (db) {
    return db.prepare('SELECT * FROM trust_history WHERE app_id = ? ORDER BY timestamp DESC').all(appId);
  }
  const state = getJsonState();
  return state.trustHistory.filter((entry) => entry.app_id === appId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function recordTrustHistory(appId, score, status, breakdown) {
  const record = { app_id: appId, score, status, breakdown: JSON.stringify(breakdown), timestamp: new Date().toISOString() };
  if (db) {
    const stmt = db.prepare(`INSERT INTO trust_history (app_id, score, status, breakdown, timestamp) VALUES (@app_id, @score, @status, @breakdown, @timestamp)`);
    stmt.run(record);
    return record;
  }
  const state = getJsonState();
  state.trustHistory.push({ id: Date.now(), ...record });
  saveJsonState(state);
  return record;
}

export function upsertRecommendation(appId, permissionName, suggestedAction, reason, priority = 1) {
  const record = {
    app_id: appId,
    permission_name: permissionName,
    suggested_action: suggestedAction,
    reason,
    priority,
    created_at: new Date().toISOString(),
    status: 'open',
  };
  if (db) {
    const exists = db.prepare('SELECT * FROM recommendations WHERE app_id = ? AND permission_name = ?').get(appId, permissionName);
    if (exists) {
      db.prepare('UPDATE recommendations SET suggested_action = ?, reason = ?, priority = ?, status = ? WHERE id = ?').run(suggestedAction, reason, priority, 'open', exists.id);
      return { ...record, id: exists.id };
    }
    const result = db.prepare(`INSERT INTO recommendations (app_id, permission_name, suggested_action, reason, priority, created_at, status) VALUES (@app_id, @permission_name, @suggested_action, @reason, @priority, @created_at, @status)`).run(record);
    return { ...record, id: Number(result.lastInsertRowid) };
  }

  const state = getJsonState();
  const exists = state.recommendations.find((entry) => entry.app_id === appId && entry.permission_name === permissionName);
  if (exists) {
    exists.suggested_action = suggestedAction;
    exists.reason = reason;
    exists.priority = priority;
    exists.status = 'open';
    saveJsonState(state);
    return exists;
  }
  const nextId = state.recommendations.length ? Math.max(...state.recommendations.map((entry) => entry.id || 0)) + 1 : 1;
  const item = { id: nextId, ...record };
  state.recommendations.push(item);
  saveJsonState(state);
  return item;
}

export function getRecommendations(appId) {
  if (db) {
    return db.prepare('SELECT * FROM recommendations WHERE app_id = ? ORDER BY priority DESC, created_at DESC').all(appId);
  }
  const state = getJsonState();
  return state.recommendations.filter((item) => item.app_id === appId).sort((a, b) => Number(b.priority) - Number(a.priority));
}

export function setAppStatus(appId, status) {
  if (db) {
    db.prepare('UPDATE apps SET status = ?, last_updated = ? WHERE id = ?').run(status, new Date().toISOString(), appId);
    return true;
  }
  const state = getJsonState();
  const app = state.apps.find((entry) => entry.id === appId);
  if (app) {
    app.status = status;
    app.last_updated = new Date().toISOString();
    saveJsonState(state);
  }
  return true;
}

export function updateAppScore(appId, score, status) {
  if (db) {
    db.prepare('UPDATE apps SET trust_score = ?, status = ?, last_updated = ? WHERE id = ?').run(score, status, new Date().toISOString(), appId);
    return true;
  }
  const state = getJsonState();
  const app = state.apps.find((entry) => entry.id === appId);
  if (app) {
    app.trust_score = score;
    app.status = status;
    app.last_updated = new Date().toISOString();
    saveJsonState(state);
  }
  return true;
}

export function readPermissionRows(appId) {
  if (db) {
    return db.prepare('SELECT * FROM permissions WHERE app_id = ? ORDER BY name').all(appId);
  }
  const state = getJsonState();
  return state.permissions.filter((permission) => permission.app_id === appId);
}

export function readAppRecord(appId) {
  if (db) {
    return db.prepare('SELECT * FROM apps WHERE id = ?').get(appId);
  }
  const state = getJsonState();
  return state.apps.find((entry) => entry.id === appId);
}
