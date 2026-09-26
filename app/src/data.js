import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SCHEDULE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, REPORT_WINDOW_MIN } from './config';
import { toEnDigits } from './i18n';

// ---------------------------------------------------------------- small storage helpers
export async function loadJSON(key, fallback) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}
export async function saveJSON(key, value) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// ---------------------------------------------------------------- official schedule
export async function fetchSchedule() {
  try {
    const r = await fetch(`${SCHEDULE_URL}?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const doc = await r.json();
    await saveJSON('alo.schedule', doc);
    return { doc, offline: false };
  } catch (e) {
    return { doc: await loadJSON('alo.schedule', null), offline: true };
  }
}

const norm = (s) => toEnDigits(String(s || '')).toLowerCase().replace(/[\s.,/()-]+/g, '');

function matchesArea(slot, area) {
  if (slot.utility && area.u && slot.utility !== area.u) return false;
  const s = norm(slot.area);
  return [area.bn, area.en, ...(area.alt || [])].some((n) => n && s.includes(norm(n)));
}

// Slots for an area, as real Date objects (schedules are in Bangladesh time).
export function slotsForArea(doc, area) {
  if (!doc || !doc.slots) return [];
  return doc.slots
    .filter((s) => matchesArea(s, area))
    .map((s) => ({
      ...s,
      startAt: new Date(`${s.date}T${s.start}:00+06:00`),
      endAt: new Date(`${s.date}T${s.end === '24:00' ? '23:59' : s.end}:00+06:00`),
    }))
    .filter((s) => !isNaN(s.startAt))
    .sort((a, b) => a.startAt - b.startAt);
}

export const sameDay = (a, b) => a.toDateString() === b.toDateString();

// Planned shutdowns announced in the news (collected by alo-data), newest first by date.
export const plannedKey = (p) => `${p.date}|${p.start}|${p.url}`;
export function plannedList(doc, areas) {
  if (!doc || !doc.planned) return [];
  const now = Date.now();
  return doc.planned
    .map((p) => ({
      ...p,
      key: plannedKey(p),
      startAt: new Date(`${p.date}T${p.start}:00+06:00`),
      endAt: new Date(`${p.date}T${p.end === '24:00' ? '23:59' : p.end}:00+06:00`),
      mine: areas.some((a) => [a.bn, a.en, ...(a.alt || [])].some((n) => n && norm(p.places + p.title).includes(norm(n)))),
    }))
    .filter((p) => !isNaN(p.startAt) && p.endAt.getTime() > now)
    .sort((a, b) => (b.mine - a.mine) || (a.startAt - b.startAt));
}

// ---------------------------------------------------------------- crowd reports
const hasServer = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);
const sbHeaders = () => ({ apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' });

export async function deviceId() {
  let id = await loadJSON('alo.device', null);
  if (!id) {
    id = `d_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    await saveJSON('alo.device', id);
  }
  return id;
}

// Anti-spam: each phone gets one vote per area (its latest report), and at most
// REPORT_LIMIT reports every REPORT_LIMIT_MIN minutes. The server enforces the same limit.
export const REPORT_LIMIT = 3;
export const REPORT_LIMIT_MIN = 5;

// Returns { out, back, total, latest: 'out'|'back'|null } counted as distinct phones.
// With a street zone ({gi, gj}) it counts phones in the 3x3 squares around it (about 450 m across);
// otherwise the whole area.
export async function fetchReports(areaId, zone) {
  const since = new Date(Date.now() - REPORT_WINDOW_MIN * 60000);
  let rows = [];
  if (hasServer()) {
    try {
      const where = zone
        ? `gi=gte.${zone.gi - 1}&gi=lte.${zone.gi + 1}&gj=gte.${zone.gj - 1}&gj=lte.${zone.gj + 1}`
        : `area_id=eq.${areaId}`;
      const q = `${SUPABASE_URL}/rest/v1/reports?select=status,created_at,occurred_at,source,device_id&${where}&created_at=gte.${since.toISOString()}&order=created_at.desc&limit=500`;
      const r = await fetch(q, { headers: sbHeaders() });
      if (r.ok) rows = await r.json();
    } catch (e) {}
  } else {
    const mine = await loadJSON('alo.myReports', []);
    rows = mine.filter((x) => x.area_id === areaId && new Date(x.created_at) >= since).reverse()
      .map((x) => ({ ...x, device_id: 'me' }));
  }
  // A sensor "out" (charger lost power) only counts if another phone nearby lost power within 3 minutes.
  const tOf = (x) => new Date(x.occurred_at || x.created_at).getTime();
  rows = rows.filter((x) => x.source !== 'sensor' || x.status !== 'out'
    || rows.some((y) => y.device_id !== x.device_id && y.status === 'out' && Math.abs(tOf(y) - tOf(x)) <= 180000));
  // rows are newest first: keep only each phone's latest report
  const seenDev = new Set();
  rows = rows.filter((x) => {
    const d = x.device_id || Math.random();
    if (seenDev.has(d)) return false;
    seenDev.add(d);
    return true;
  });
  const out = rows.filter((x) => x.status === 'out').length;
  const back = rows.length - out;
  return { out, back, total: rows.length, latest: rows[0] ? rows[0].status : null };
}

// Returns { ok: true } or { ok: false, waitMin } when the phone has reported too often.
export async function sendReport(areaId, status, zone) {
  const row = { area_id: areaId, status, created_at: new Date().toISOString() };
  const mine = await loadJSON('alo.myReports', []);
  const windowStart = Date.now() - REPORT_LIMIT_MIN * 60000;
  const recent = mine.filter((x) => new Date(x.created_at).getTime() >= windowStart);
  if (recent.length >= REPORT_LIMIT) {
    const oldest = new Date(recent[recent.length - REPORT_LIMIT].created_at).getTime();
    return { ok: false, waitMin: Math.max(1, Math.ceil((oldest + REPORT_LIMIT_MIN * 60000 - Date.now()) / 60000)) };
  }
  mine.push(row);
  await saveJSON('alo.myReports', mine.slice(-500));
  if (hasServer()) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
        method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          area_id: areaId, status, device_id: await deviceId(), source: 'manual',
          ...(zone ? { gi: zone.gi, gj: zone.gj } : {}),
        }),
      });
    } catch (e) {}
  }
  return { ok: true };
}

// Live alerts: tell the server which areas this phone follows (push goes out when 3+ neighbours confirm).
export async function registerPush({ areaIds, cells = [], lang, enabled }) {
  if (!hasServer()) return false;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return false;
    const tok = await Notifications.getDevicePushTokenAsync();
    const token = tok && tok.data;
    if (!token || typeof token !== 'string') return false;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/register_push_v2`, {
      method: 'POST', headers: sbHeaders(),
      body: JSON.stringify({
        p_token: token, p_lang: lang,
        p_areas: enabled ? [...new Set(areaIds)].slice(0, 10) : [],
        p_cells: enabled ? [...new Set(cells)].slice(0, 10) : [],
      }),
    });
    return r.ok;
  } catch (e) {
    return false;
  }
}

// Hours without power per day for the last 7 days, from this phone's own reports.
export async function myWeek() {
  const mine = await loadJSON('alo.myReports', []);
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ date: d, hours: 0 });
  }
  let outAt = null;
  for (const r of mine) {
    const t = new Date(r.created_at);
    if (r.status === 'out') outAt = outAt || t;
    else if (outAt) {
      const hrs = Math.min(12, (t - outAt) / 3600000);
      const day = days.find((x) => sameDay(x.date, outAt));
      if (day && hrs > 0) day.hours += hrs;
      outAt = null;
    }
  }
  return days.map((d) => ({ ...d, hours: Math.round(d.hours * 10) / 10 }));
}

// ---------------------------------------------------------------- reminders (local notifications)
const TT = Notifications.SchedulableTriggerInputTypes || {};

export async function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Load shedding reminders', importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Live outage alerts', importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function askNotificationPermission() {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const res = await Notifications.requestPermissionsAsync();
  return !!res.granted;
}

function dateTrigger(date) {
  return TT.DATE ? { type: TT.DATE, date, channelId: 'reminders' } : { date, channelId: 'reminders' };
}

// Re-plan every reminder for the next 3 days across all saved places.
export async function planReminders({ doc, areas, leadMin, enabled, fmt, areaName, picked = [] }) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled || !doc) return 0;
    const limit = Date.now() + 3 * 86400000;
    let count = 0;
    const seen = new Set();
    // planned shutdowns the person tapped "Remind me" on
    for (const p of plannedList(doc, [])) {
      if (!picked.includes(p.key)) continue;
      const fireAt = new Date(p.startAt.getTime() - leadMin * 60000);
      if (fireAt.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: fmt.t.nTitle(fmt.lead(leadMin)), body: `${fmt.time(p.startAt)} – ${fmt.time(p.endAt)}. ${p.title}` },
        trigger: dateTrigger(fireAt),
      });
      count++;
    }
    for (const area of areas) {
      for (const s of slotsForArea(doc, area)) {
        const fireAt = new Date(s.startAt.getTime() - leadMin * 60000);
        const key = `${area.id}|${s.startAt.getTime()}`;
        if (fireAt.getTime() <= Date.now() || s.startAt.getTime() > limit || seen.has(key)) continue;
        seen.add(key);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: fmt.t.nTitle(fmt.lead(leadMin)),
            body: fmt.t.nBody(areaName(area), `${fmt.time(s.startAt)} – ${fmt.time(s.endAt)}`),
          },
          trigger: dateTrigger(fireAt),
        });
        count++;
      }
    }
    return count;
  } catch (e) {
    return 0;
  }
}

export async function sendTestReminder(fmt) {
  const trigger = TT.TIME_INTERVAL
    ? { type: TT.TIME_INTERVAL, seconds: 3, channelId: 'reminders' }
    : { seconds: 3, channelId: 'reminders' };
  await Notifications.scheduleNotificationAsync({
    content: { title: fmt.t.testTitle, body: fmt.t.testBody }, trigger,
  });
}
