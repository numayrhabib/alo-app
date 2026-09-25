import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet,
  Switch, Text, TextInput, useColorScheme, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

import { AREAS, UTIL_BN, areaById, nearestArea } from './src/areas';
import { makeFmt } from './src/i18n';
import { LIGHT, DARK } from './src/theme';
import { BottomBanner, InlineBanner, startAds } from './src/ads';
import {
  askNotificationPermission, fetchReports, fetchSchedule, loadJSON, myWeek, planReminders, saveJSON,
  sameDay, sendReport, sendTestReminder, setupNotifications, slotsForArea,
} from './src/data';

const LEADS = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 480, 600, 720];
const DEFAULTS = {
  lang: 'bn', theme: 'system', areaId: 'mirpur10', gps: false, auto: true, reminders: true, leadMin: 60,
  saved: [{ label: 'homeL', id: 'mirpur10' }, { label: 'officeL', id: 'gulshan' }, { label: 'parentsL', id: 'dhanmondi' }],
  ips: { bat: 12, ah: 150, fan: 2, light: 4, router: 1, tv: 0 },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const insets = useSafeAreaInsets();
  const sys = useColorScheme();
  const [st, setSt] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('home');
  const [doc, setDoc] = useState(null);
  const [offline, setOffline] = useState(false);
  const [reports, setReports] = useState({ out: 0, back: 0, total: 0, latest: null });
  const [myReport, setMyReport] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [picker, setPicker] = useState(null); // null | 'main' | index of saved place
  const [toast, setToast] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(new Date());
  const toastTimer = useRef(null);

  const c = st.theme === 'dark' ? DARK : st.theme === 'light2' ? LIGHT : sys === 'dark' ? DARK : LIGHT;
  const fmt = useMemo(() => makeFmt(st.lang), [st.lang]);
  const t = fmt.t;
  const area = areaById(st.areaId);
  const areaName = useCallback((a) => (st.lang === 'bn' ? a.bn : a.en), [st.lang]);
  const utilName = (u) => (st.lang === 'bn' ? UTIL_BN[u] || u : u);

  const update = (patch) => setSt((s) => ({ ...s, ...patch }));
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  };

  // ---- start-up
  useEffect(() => {
    (async () => {
      const saved = await loadJSON('alo.settings', null);
      if (saved) setSt((s) => ({ ...s, ...saved, ips: { ...s.ips, ...(saved.ips || {}) } }));
      setReady(true);
      startAds();
      await setupNotifications();
      const r = await fetchSchedule();
      setDoc(r.doc);
      setOffline(r.offline);
    })();
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { if (ready) saveJSON('alo.settings', st); }, [st, ready]);

  // ---- auto-detect area once on launch
  const detect = useCallback(async () => {
    setDetecting(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') { showToast(t.locDenied); return; }
      let pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((res) => setTimeout(() => res(null), 12000)),
      ]);
      if (!pos) pos = await Location.getLastKnownPositionAsync();
      if (!pos) { showToast(t.locDenied); return; }
      const a = nearestArea(pos.coords.latitude, pos.coords.longitude);
      update({ areaId: a.id, gps: true });
      setMyReport(null);
      showToast(t.youreIn(areaName(a)));
    } catch (e) {
      showToast(t.locDenied);
    } finally {
      setDetecting(false);
    }
  }, [t, areaName]);

  const didAuto = useRef(false);
  useEffect(() => {
    if (ready && st.auto && !didAuto.current) { didAuto.current = true; detect(); }
  }, [ready, st.auto, detect]);

  // ---- live reports for the current area
  const loadReports = useCallback(async () => setReports(await fetchReports(st.areaId)), [st.areaId]);
  useEffect(() => { loadReports(); const id = setInterval(loadReports, 60000); return () => clearInterval(id); }, [loadReports]);

  // ---- reminders follow schedule + settings
  useEffect(() => {
    if (!ready) return;
    const places = [area, ...st.saved.map((p) => areaById(p.id))];
    planReminders({ doc, areas: places, leadMin: st.leadMin, enabled: st.reminders, fmt, areaName });
  }, [ready, doc, st.areaId, st.saved, st.leadMin, st.reminders, st.lang]);

  const onRefresh = async () => {
    setRefreshing(true);
    const r = await fetchSchedule();
    setDoc(r.doc);
    setOffline(r.offline);
    await loadReports();
    setRefreshing(false);
  };

  const report = async (status) => {
    if (myReport === status) return;
    const res = await sendReport(st.areaId, status);
    if (!res.ok) { showToast(t.tooMany(fmt.lead(res.waitMin))); return; }
    setMyReport(status);
    await loadReports();
    showToast(t.thanks);
  };

  const slots = useMemo(() => slotsForArea(doc, area), [doc, st.areaId]);
  const todaySlots = slots.filter((s) => sameDay(s.startAt, now));
  const tomorrow = new Date(now.getTime() + 86400000);
  const tomorrowSlots = slots.filter((s) => sameDay(s.startAt, tomorrow));
  const liveSlot = slots.find((s) => s.startAt <= now && s.endAt > now);
  const nextSlot = slots.find((s) => s.startAt > now);

  let status = 'none';
  if (reports.total > 0) status = reports.out > reports.back || (reports.out === reports.back && reports.latest === 'out') ? 'off' : 'on';
  else if (liveSlot) status = 'sched';

  const s = styles(c);
  const props = { c, s, t, fmt, st, update, area, areaName, utilName };

  if (!ready) {
    return <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={c.amber} /></View>;
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <View style={s.top}>
        <View style={s.brand}>
          <View style={s.logo}><Ionicons name="flash" size={16} color="#fff" /></View>
          <Text style={s.brandText}>{t.appname}</Text>
        </View>
        <View style={s.lang}>
          {['en', 'bn'].map((l) => (
            <Pressable key={l} onPress={() => update({ lang: l })} style={[s.langBtn, st.lang === l && s.langOn]}>
              <Text style={[s.langTxt, st.lang === l && { color: c.ink }]}>{l === 'en' ? 'EN' : 'বাং'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.screen}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.amber} colors={[c.amber]} />}>
        {tab === 'home' && (
          <Home {...props} detecting={detecting} detect={detect} setPicker={setPicker} status={status} reports={reports}
            myReport={myReport} report={report} nextSlot={nextSlot} todaySlots={todaySlots} now={now}
            doc={doc} offline={offline} setMyReport={setMyReport} />
        )}
        {tab === 'schedule' && (
          <Schedule {...props} detecting={detecting} setPicker={setPicker} todaySlots={todaySlots} tomorrowSlots={tomorrowSlots} now={now} doc={doc} />
        )}
        {tab === 'tools' && <Tools {...props} />}
        {tab === 'settings' && <Settings {...props} detect={detect} setPicker={setPicker} showToast={showToast} />}
      </ScrollView>

      {!!toast && <View style={s.toast}><Text style={s.toastTxt}>{toast}</Text></View>}

      <BottomBanner c={c} />
      <View style={[s.tabs, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {[['home', 'home'], ['schedule', 'calendar'], ['tools', 'battery-half'], ['settings', 'settings']].map(([k, icon]) => (
          <Pressable key={k} style={s.tabBtn} onPress={() => setTab(k)}>
            <Ionicons name={tab === k ? icon : `${icon}-outline`} size={22} color={tab === k ? c.amber : c.ink3} />
            <Text style={[s.tabTxt, tab === k && { color: c.ink }]}>{t[k]}</Text>
          </Pressable>
        ))}
      </View>

      <AreaPicker {...props} visible={picker !== null} onClose={() => setPicker(null)}
        onPick={(a) => {
          if (picker === 'main') { update({ areaId: a.id, gps: false }); setMyReport(null); }
          else { const saved = st.saved.map((p, i) => (i === picker ? { ...p, id: a.id } : p)); update({ saved }); }
          setPicker(null);
        }} />
    </View>
  );
}

// ------------------------------------------------------------------ shared bits
function Card({ s, children, style }) { return <View style={[s.card, style]}>{children}</View>; }
function Eyebrow({ s, children }) { return <Text style={s.eyebrow}>{children}</Text>; }

function AreaButton({ s, t, c, area, areaName, utilName, st, detecting, onPress }) {
  const label = detecting ? t.detecting : st.gps ? t.autoLbl : t.yourArea;
  return (
    <Pressable style={s.areaBtn} onPress={onPress}>
      <Ionicons name="location-outline" size={20} color={c.ink2} />
      <View style={{ flex: 1 }}>
        <Text style={[s.small, detecting && { color: c.amberInk, fontWeight: '700' }]}>{label}</Text>
        <Text style={s.areaName}>{areaName(area)}</Text>
      </View>
      <Text style={s.util}>{utilName(area.u)}</Text>
    </Pressable>
  );
}

function Seg({ s, options, value, onChange }) {
  return (
    <View style={s.seg}>
      {options.map(([v, label]) => (
        <Pressable key={v} onPress={() => onChange(v)} style={[s.segBtn, value === v && s.segOn]}>
          <Text style={[s.segTxt, value === v && s.segTxtOn]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SlotRow({ s, c, t, fmt, slot, now, utilName }) {
  let state = 'later';
  if (slot.endAt <= now) state = 'done';
  else if (slot.startAt <= now) state = 'live';
  else if (slot.startAt - now < 2 * 3600000) state = 'soon';
  const pill = { done: [c.surface2, c.ink3], live: [c.offSoft, c.off], soon: [c.amberSoft, c.amberInk], later: [c.surface2, c.ink2] }[state];
  return (
    <View style={s.slot}>
      <View style={{ flex: 1 }}>
        <Text style={s.slotT}>{fmt.time(slot.startAt)} – {fmt.time(slot.endAt)}</Text>
        <Text style={s.small}>{t.official} · {utilName(slot.utility)}{slot.ambiguous ? ` · ${t.checkTime}` : ''}</Text>
      </View>
      <Text style={[s.pill, { backgroundColor: pill[0], color: pill[1] }]}>{t[state]}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ Home
function Home(p) {
  const { s, c, t, fmt, st, area, areaName, status, reports, myReport, report, nextSlot, todaySlots, now, doc, offline } = p;
  const bg = status === 'off' || status === 'sched' ? c.offSoft : status === 'on' ? c.onSoft : c.surface2;
  const fg = status === 'off' || status === 'sched' ? c.off : status === 'on' ? c.on : c.ink2;
  const title = { off: t.powerOff, sched: t.powerSched, on: t.powerOn, none: t.noReports }[status];
  const minsToNext = nextSlot ? (nextSlot.startAt - now) / 60000 : 0;
  return (
    <>
      <AreaButton {...p} onPress={() => p.setPicker('main')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Pressable onPress={p.detect} style={[s.chip, { borderColor: c.amber, backgroundColor: st.gps ? c.amber : c.amberSoft }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="navigate" size={13} color={st.gps ? '#fff' : c.amberInk} />
            <Text style={[s.chipTxt, { color: st.gps ? '#fff' : c.amberInk }]}>{t.current}</Text>
          </View>
        </Pressable>
        {st.saved.map((pl, i) => {
          const on = !st.gps && st.areaId === pl.id;
          return (
            <Pressable key={i} onPress={() => { p.update({ areaId: pl.id, gps: false }); p.setMyReport(null); }}
              style={[s.chip, on && { backgroundColor: c.ink, borderColor: c.ink }]}>
              <Text style={[s.chipTxt, on && { color: c.bg }]}>{t[pl.label]} · {areaName(areaById(pl.id))}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[s.status, { backgroundColor: bg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[s.dot, { backgroundColor: fg }]} />
          <Text style={[s.statusTitle, { color: fg }]}>{title}</Text>
        </View>
        <Text style={s.sub}>{reports.total ? fmt.n(t.reportsN(reports.total)) : t.beFirst}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['out', 'back'].map((k) => (
            <Pressable key={k} onPress={() => report(k)} style={[s.rbtn, myReport === k && { borderColor: c.ink }]}>
              <Text style={s.rbtnTxt}>{t[k]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Card s={s}>
        <Eyebrow s={s}>{t.nextOutage}</Eyebrow>
        {nextSlot ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View>
              <Text style={s.big}>{fmt.time(nextSlot.startAt)}</Text>
              <Text style={s.sub}>{fmt.time(nextSlot.startAt)} – {fmt.time(nextSlot.endAt)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: c.amberInk }}>{fmt.dur(minsToNext)}</Text>
              <Text style={s.small}>{t.toGo}</Text>
            </View>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: c.ink }}>{t.none}</Text>
            <Text style={[s.sub, { marginTop: 4 }]}>{t.noneH}</Text>
          </View>
        )}
        <View style={s.remind}>
          <Ionicons name="notifications-outline" size={16} color={c.amberInk} />
          <Text style={{ color: c.amberInk, fontWeight: '600', fontSize: 13, flex: 1 }}>
            {st.reminders ? t.reminderOn(fmt.lead(st.leadMin)) : t.reminderOff}
          </Text>
        </View>
      </Card>

      <Card s={s}>
        <Eyebrow s={s}>{t.todayTimeline}</Eyebrow>
        <View style={s.tl}>
          {todaySlots.map((x, i) => {
            const a = (x.startAt.getHours() + x.startAt.getMinutes() / 60) / 24;
            const b = (x.endAt.getHours() + x.endAt.getMinutes() / 60 || 24) / 24;
            return <View key={i} style={[s.blk, { left: `${a * 100}%`, width: `${Math.max(1, (b - a) * 100)}%`, opacity: x.endAt < now ? 0.35 : 0.85 }]} />;
          })}
          <View style={[s.nowLine, { left: `${((now.getHours() + now.getMinutes() / 60) / 24) * 100}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          {[12, 6, 12, 6, 12].map((h, i) => <Text key={i} style={s.small}>{fmt.n(h)}</Text>)}
        </View>
      </Card>

      <InlineBanner c={c} label={st.lang === 'bn' ? 'বিজ্ঞাপন' : 'Sponsored'} />

      <Text style={[s.small, { textAlign: 'center' }]}>
        {offline ? t.offline : doc && doc.generated_at ? t.updated(fmt.ago(new Date(doc.generated_at))) : ''}
      </Text>
    </>
  );
}

// ------------------------------------------------------------------ Schedule
function Schedule(p) {
  const { s, c, t, st, todaySlots, tomorrowSlots, doc, area, utilName } = p;
  const notices = ((doc && doc.notices) || []).filter((n) => n.utility === area.u).slice(0, 4);
  const news = ((doc && doc.news) || []).slice(0, 4);
  const day = (label, list) => (
    <Card s={s}>
      <Eyebrow s={s}>{label}</Eyebrow>
      {list.length ? list.map((x, i) => <SlotRow key={i} {...p} slot={x} />) : <Text style={s.sub}>{t.none}</Text>}
    </Card>
  );
  return (
    <>
      <Text style={s.h1}>{t.scheduleFor}</Text>
      <AreaButton {...p} onPress={() => p.setPicker('main')} />
      {day(t.today, todaySlots)}
      <InlineBanner c={c} label={st.lang === 'bn' ? 'বিজ্ঞাপন' : 'Sponsored'} />
      {day(t.tomorrow, tomorrowSlots)}
      {notices.length > 0 && (
        <Card s={s}>
          <Eyebrow s={s}>{t.notices} · {utilName(area.u)}</Eyebrow>
          {notices.map((n, i) => (
            <Pressable key={i} onPress={() => Linking.openURL(n.url)} style={s.linkRow}>
              <Text style={s.linkTxt} numberOfLines={2}>{n.title}</Text><Ionicons name="open-outline" size={16} color={c.ink3} />
            </Pressable>
          ))}
        </Card>
      )}
      {news.length > 0 && (
        <Card s={s}>
          <Eyebrow s={s}>{t.news}</Eyebrow>
          {news.map((n, i) => (
            <Pressable key={i} onPress={() => Linking.openURL(n.link)} style={s.linkRow}>
              <Text style={s.linkTxt} numberOfLines={2}>{n.title}</Text><Ionicons name="open-outline" size={16} color={c.ink3} />
            </Pressable>
          ))}
        </Card>
      )}
    </>
  );
}

// ------------------------------------------------------------------ Tools
function Tools(p) {
  const { s, c, t, fmt, st, update } = p;
  const ips = st.ips;
  const setIps = (patch) => update({ ips: { ...ips, ...patch } });
  const watts = ips.fan * 60 + ips.light * 10 + ips.router * 12 + ips.tv * 80;
  const mins = watts ? (ips.bat * ips.ah * 0.8 * 0.85 / watts) * 60 : 0; // 80% usable battery, 85% inverter efficiency
  const [week, setWeek] = useState([]);
  useEffect(() => { myWeek().then(setWeek); }, []);
  const max = Math.max(1, ...week.map((d) => d.hours));
  const dayNames = st.lang === 'bn' ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const appl = [['fan', 60], ['light', 10], ['router', 12], ['tv', 80]];
  return (
    <>
      <Text style={s.h1}>{t.tools}</Text>
      <Card s={s}>
        <Eyebrow s={s}>{t.ips}</Eyebrow>
        <Text style={s.label}>{t.battery}</Text>
        <Seg s={s} value={ips.bat} onChange={(v) => setIps({ bat: v })} options={[[12, fmt.n('12V')], [24, fmt.n('24V')]]} />
        <Text style={[s.label, { marginTop: 12 }]}>{t.capacity}</Text>
        <TextInput style={s.input} keyboardType="number-pad" value={String(ips.ah)}
          onChangeText={(v) => setIps({ ah: Math.min(1000, parseInt(v.replace(/\D/g, ''), 10) || 0) })} />
        <Text style={[s.label, { marginTop: 12 }]}>{t.load}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {appl.map(([k, w]) => (
            <View key={k} style={s.ap}>
              <Text style={{ color: c.ink, fontSize: 13, flex: 1 }}>{t[k]} <Text style={{ color: c.ink3 }}>{fmt.n(w)}W</Text></Text>
              <Pressable onPress={() => setIps({ [k]: Math.max(0, ips[k] - 1) })} style={s.step}><Text style={s.stepTxt}>−</Text></Pressable>
              <Text style={{ color: c.ink, fontWeight: '700', minWidth: 18, textAlign: 'center' }}>{fmt.n(ips[k])}</Text>
              <Pressable onPress={() => setIps({ [k]: Math.min(12, ips[k] + 1) })} style={s.step}><Text style={s.stepTxt}>+</Text></Pressable>
            </View>
          ))}
        </View>
        <View style={s.result}>
          <Text style={{ color: c.amberInk, fontSize: 12, flex: 1 }}>{t.lasts}</Text>
          <Text style={{ color: c.amberInk, fontSize: 28, fontWeight: '800' }}>{mins ? fmt.dur(mins) : '—'}</Text>
        </View>
      </Card>
      <InlineBanner c={c} label={st.lang === 'bn' ? 'বিজ্ঞাপন' : 'Sponsored'} />
      <Card s={s}>
        <Eyebrow s={s}>{t.myLog}</Eyebrow>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110 }}>
          {week.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
              <Text style={[s.small, { fontWeight: '700' }]}>{fmt.n(d.hours)}</Text>
              <View style={{ width: '100%', height: `${(d.hours / max) * 70}%`, minHeight: 3, borderRadius: 5,
                backgroundColor: i === week.length - 1 ? c.off : c.amber }} />
              <Text style={s.small}>{dayNames[d.date.getDay()]}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.small, { marginTop: 10 }]}>
          {fmt.n(Math.round(week.reduce((a, d) => a + d.hours, 0) * 10) / 10)} {t.hours} {t.total} · {t.myLogH}
        </Text>
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Settings
function Settings(p) {
  const { s, c, t, fmt, st, update, areaName, showToast } = p;
  const [lead, setLead] = useState(st.leadMin);
  const idx = Math.max(0, LEADS.indexOf(st.leadMin));
  const toggleReminders = async (v) => {
    if (v && !(await askNotificationPermission())) { showToast(t.notifDenied); return; }
    update({ reminders: v });
  };
  const test = async () => {
    if (!(await askNotificationPermission())) { showToast(t.notifDenied); return; }
    await sendTestReminder(fmt);
  };
  return (
    <>
      <Text style={s.h1}>{t.settings}</Text>
      <Card s={s}>
        <View style={s.setRow}>
          <View style={{ flex: 1 }}><Text style={s.k}>{t.reminders}</Text><Text style={s.small}>{t.remindersH}</Text></View>
          <Switch value={st.reminders} onValueChange={toggleReminders} trackColor={{ true: c.on }} />
        </View>
        <View style={[s.setRow, { flexDirection: 'column', alignItems: 'stretch' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={s.k}>{t.leadTime}</Text>
            <Text style={{ color: c.amberInk, fontSize: 22, fontWeight: '800' }}>{fmt.lead(lead)}</Text>
          </View>
          <Slider minimumValue={0} maximumValue={LEADS.length - 1} step={1} value={idx}
            onValueChange={(v) => setLead(LEADS[Math.round(v)])}
            onSlidingComplete={(v) => update({ leadMin: LEADS[Math.round(v)] })}
            minimumTrackTintColor={c.amber} maximumTrackTintColor={c.line} thumbTintColor={c.amber} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.small}>{fmt.lead(15)}</Text><Text style={s.small}>{fmt.lead(360)}</Text><Text style={s.small}>{fmt.lead(720)}</Text>
          </View>
        </View>
        <View style={s.setRow}>
          <View style={{ flex: 1 }}><Text style={s.k}>{t.autoSet}</Text><Text style={s.small}>{t.autoSetH}</Text></View>
          <Switch value={st.auto} onValueChange={(v) => { update({ auto: v }); if (v) p.detect(); }} trackColor={{ true: c.on }} />
        </View>
        <Pressable style={s.primary} onPress={test}><Text style={s.primaryTxt}>{t.testRem}</Text></Pressable>
      </Card>

      <Card s={s}>
        <Eyebrow s={s}>{t.saved}</Eyebrow>
        {st.saved.map((pl, i) => (
          <View key={i} style={s.setRow}>
            <View style={{ flex: 1 }}><Text style={s.k}>{t[pl.label]}</Text><Text style={s.small}>{areaName(areaById(pl.id))}</Text></View>
            <Pressable onPress={() => p.setPicker(i)} style={s.ghostSm}><Text style={{ color: c.ink, fontWeight: '700' }}>{t.change}</Text></Pressable>
          </View>
        ))}
      </Card>

      <Card s={s}>
        <Text style={[s.k, { marginBottom: 8 }]}>{t.language}</Text>
        <Seg s={s} value={st.lang} onChange={(v) => update({ lang: v })} options={[['en', 'English'], ['bn', 'বাংলা']]} />
        <Text style={[s.k, { marginVertical: 8 }]}>{t.theme}</Text>
        <Seg s={s} value={st.theme} onChange={(v) => update({ theme: v })} options={[['system', t.system], ['light2', t.light2], ['dark', t.dark]]} />
      </Card>

      <Card s={s}>
        <Eyebrow s={s}>{t.sources}</Eyebrow>
        <Text style={s.sub}>{t.srcLine}</Text>
        <Text style={[s.small, { marginTop: 8 }]}>{t.version} 0.1.0</Text>
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Area picker
function AreaPicker({ s, c, t, visible, onClose, onPick, areaName, utilName }) {
  const [q, setQ] = useState('');
  const list = AREAS.filter((a) => {
    const x = q.trim().toLowerCase();
    return !x || a.en.toLowerCase().includes(x) || a.bn.includes(x) || a.u.toLowerCase().includes(x) || (UTIL_BN[a.u] || '').includes(x);
  });
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.grab} />
        <Text style={[s.h1, { fontSize: 18 }]}>{t.chooseArea}</Text>
        <TextInput style={[s.input, { marginVertical: 8 }]} placeholder={t.searchArea} placeholderTextColor={c.ink3} value={q} onChangeText={setQ} />
        <FlatList data={list} keyExtractor={(a) => a.id} keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable style={s.aitem} onPress={() => { setQ(''); onPick(item); }}>
              <Text style={{ color: c.ink, fontSize: 15 }}>{areaName(item)}</Text>
              <Text style={s.util}>{utilName(item.u)}</Text>
            </Pressable>
          )} />
        <Pressable style={[s.ghostSm, { alignSelf: 'center', marginTop: 8 }]} onPress={onClose}><Text style={{ color: c.ink }}>{t.cancel}</Text></Pressable>
      </View>
    </Modal>
  );
}

// ------------------------------------------------------------------ styles
const styles = (c) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 28, height: 28, borderRadius: 8, backgroundColor: c.amber, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 22, fontWeight: '800', color: c.ink },
  lang: { flexDirection: 'row', backgroundColor: c.surface2, borderRadius: 999, padding: 3 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  langOn: { backgroundColor: c.surface },
  langTxt: { fontSize: 12, fontWeight: '700', color: c.ink3 },
  screen: { padding: 16, paddingTop: 4, gap: 14 },
  h1: { fontSize: 24, fontWeight: '800', color: c.ink },
  small: { fontSize: 12, color: c.ink3 },
  sub: { fontSize: 13, color: c.ink2, lineHeight: 19 },
  label: { fontSize: 13, color: c.ink2, fontWeight: '600', marginBottom: 6 },
  k: { fontSize: 15, fontWeight: '600', color: c.ink },
  areaBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12 },
  areaName: { fontSize: 16, fontWeight: '700', color: c.ink },
  util: { fontSize: 11, fontWeight: '700', color: c.ink2, backgroundColor: c.surface2, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line },
  chipTxt: { fontSize: 13, fontWeight: '600', color: c.ink2 },
  status: { borderRadius: 22, padding: 18, gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  statusTitle: { fontSize: 24, fontWeight: '800', flexShrink: 1 },
  rbtn: { flex: 1, backgroundColor: c.surface, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: c.line },
  rbtnTxt: { fontWeight: '700', fontSize: 14, color: c.ink },
  card: { backgroundColor: c.surface, borderRadius: 18, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  eyebrow: { fontSize: 12, fontWeight: '700', color: c.ink3, marginBottom: 8, letterSpacing: 0.4 },
  big: { fontSize: 32, fontWeight: '800', color: c.ink },
  remind: { marginTop: 14, backgroundColor: c.amberSoft, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tl: { height: 34, backgroundColor: c.surface2, borderRadius: 8, overflow: 'hidden' },
  blk: { position: 'absolute', top: 0, bottom: 0, backgroundColor: c.off, borderRadius: 3 },
  nowLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: c.ink },
  slot: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  slotT: { fontWeight: '700', color: c.ink, fontSize: 15 },
  pill: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  linkRow: { flexDirection: 'row', gap: 8, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  linkTxt: { flex: 1, color: c.ink, fontSize: 14 },
  seg: { flexDirection: 'row', backgroundColor: c.surface2, borderRadius: 10, padding: 3, gap: 2 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segOn: { backgroundColor: c.surface },
  segTxt: { fontSize: 13, fontWeight: '600', color: c.ink2 },
  segTxtOn: { color: c.ink },
  input: { backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: c.ink, fontSize: 15 },
  ap: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surface2, borderRadius: 10, padding: 8 },
  step: { width: 26, height: 26, borderRadius: 7, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: c.ink, fontWeight: '700', fontSize: 16 },
  result: { marginTop: 14, backgroundColor: c.amberSoft, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  primary: { marginTop: 12, backgroundColor: c.ink, borderRadius: 12, padding: 13, alignItems: 'center' },
  primaryTxt: { color: c.bg, fontWeight: '700' },
  ghostSm: { backgroundColor: c.surface2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  tabs: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, backgroundColor: c.surface, paddingTop: 8 },
  tabBtn: { flex: 1, alignItems: 'center', gap: 2 },
  tabTxt: { fontSize: 11, fontWeight: '600', color: c.ink3 },
  toast: { position: 'absolute', bottom: 150, alignSelf: 'center', backgroundColor: c.ink, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  toastTxt: { color: c.bg, fontWeight: '600', fontSize: 13 },
  scrim: { flex: 1, backgroundColor: 'rgba(10,14,24,0.45)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', backgroundColor: c.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16 },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: c.line, alignSelf: 'center', marginBottom: 12 },
  aitem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
});
