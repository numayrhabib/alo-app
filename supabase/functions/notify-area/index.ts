// Sends "power went out / came back" push notifications for one confirmed alert.
// Called by the database trigger in supabase_alerts.sql with {"alert_id": 123}.
// Each alert row is claimed once (sent_at), so calling this again can't send duplicates.
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const AREAS: Record<string, [string, string]> = {"mirpur10": ["Mirpur 10", "মিরপুর ১০"], "mirpur1": ["Mirpur 1", "মিরপুর ১"], "pallabi": ["Pallabi", "পল্লবী"], "kafrul": ["Kafrul", "কাফরুল"], "uttara": ["Uttara", "উত্তরা"], "gulshan": ["Gulshan", "গুলশান"], "banani": ["Banani", "বনানী"], "baridhara": ["Baridhara", "বারিধারা"], "badda": ["Badda", "বাড্ডা"], "bashundhara": ["Bashundhara", "বসুন্ধরা"], "tongi": ["Tongi", "টঙ্গী"], "dakshinkhan": ["Dakshinkhan", "দক্ষিণখান"], "dhanmondi": ["Dhanmondi", "ধানমন্ডি"], "mohammadpur": ["Mohammadpur", "মোহাম্মদপুর"], "lalmatia": ["Lalmatia", "লালমাটিয়া"], "farmgate": ["Farmgate", "ফার্মগেট"], "tejgaon": ["Tejgaon", "তেজগাঁও"], "moghbazar": ["Moghbazar", "মগবাজার"], "rampura": ["Rampura", "রামপুরা"], "khilgaon": ["Khilgaon", "খিলগাঁও"], "motijheel": ["Motijheel", "মতিঝিল"], "paltan": ["Paltan", "পল্টন"], "lalbagh": ["Lalbagh", "লালবাগ"], "azimpur": ["Azimpur", "আজিমপুর"], "jatrabari": ["Jatrabari", "যাত্রাবাড়ী"], "demra": ["Demra", "ডেমরা"], "kamrangirchar": ["Kamrangirchar", "কামরাঙ্গীরচর"], "narayanganj": ["Narayanganj", "নারায়ণগঞ্জ"], "savar": ["Savar", "সাভার"], "ashulia": ["Ashulia", "আশুলিয়া"], "gazipur": ["Gazipur", "গাজীপুর"], "narsingdi": ["Narsingdi", "নরসিংদী"], "munshiganj": ["Munshiganj", "মুন্সীগঞ্জ"], "manikganj": ["Manikganj", "মানিকগঞ্জ"], "tangail": ["Tangail", "টাঙ্গাইল"], "mymensingh": ["Mymensingh", "ময়মনসিংহ"], "comilla": ["Cumilla", "কুমিল্লা"], "bogura": ["Bogura", "বগুড়া"], "ctg": ["Chattogram", "চট্টগ্রাম"], "sylhet": ["Sylhet", "সিলেট"], "coxsbazar": ["Cox's Bazar", "কক্সবাজার"], "rajshahi": ["Rajshahi", "রাজশাহী"], "rangpur": ["Rangpur", "রংপুর"], "dinajpur": ["Dinajpur", "দিনাজপুর"], "khulna": ["Khulna", "খুলনা"], "jashore": ["Jashore", "যশোর"], "barishal": ["Barishal", "বরিশাল"], "kushtia": ["Kushtia", "কুষ্টিয়া"]};

const TEXT = {
  en: {
    out: (a: string, n: number) => [`Power is out in ${a}`, `${n} neighbours just reported load shedding. Tap to see live status.`],
    back: (a: string, n: number) => [`Power is back in ${a}`, `${n} neighbours say electricity has returned.`],
    zoneOut: (a: string, n: number) => [`Power cut on your street`, `${n} phones nearby just lost power (near ${a}).`],
    zoneBack: (a: string, n: number) => [`Power is back on your street`, `${n} phones nearby say electricity is back (near ${a}).`],
  },
  bn: {
    out: (a: string, n: number) => [`${a}-এ বিদ্যুৎ নেই`, `${toBn(n)} জন প্রতিবেশী এইমাত্র লোডশেডিং জানিয়েছেন।`],
    back: (a: string, n: number) => [`${a}-এ বিদ্যুৎ এসেছে`, `${toBn(n)} জন প্রতিবেশী জানিয়েছেন বিদ্যুৎ ফিরেছে।`],
    zoneOut: (a: string, n: number) => [`আপনার আশেপাশে বিদ্যুৎ গেছে`, `${a}-এর কাছে ${toBn(n)}টি ফোনে এইমাত্র বিদ্যুৎ চলে গেছে।`],
    zoneBack: (a: string, n: number) => [`আপনার আশেপাশে বিদ্যুৎ ফিরেছে`, `${a}-এর কাছে ${toBn(n)}টি ফোন জানিয়েছে বিদ্যুৎ ফিরেছে।`],
  },
};
function toBn(n: number) {
  return String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}

// ---- Google OAuth token from the Firebase service account (secret FCM_SERVICE_ACCOUNT)
function b64url(data: ArrayBuffer | string) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function googleAccessToken(sa: { client_email: string; private_key: string }) {
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const sig = b64url(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${head}.${claim}`)));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${claim}.${sig}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`Google token error: ${JSON.stringify(j)}`);
  return j.access_token as string;
}

Deno.serve(async (req) => {
  try {
    const { alert_id } = await req.json();
    const { data: alert } = await sb.from("alerts").update({ sent_at: new Date().toISOString() })
      .eq("id", alert_id).is("sent_at", null).select().maybeSingle();
    if (!alert) return new Response(JSON.stringify({ skipped: true }), { status: 200 });

    const since = new Date(Date.now() - 60 * 86400000).toISOString();
    // Street zone: everyone following the 3x3 squares around it, plus squares learned to share its line.
    let q = sb.from("push_tokens").select("token, lang, last_sent_at, last_kind").gt("updated_at", since).limit(5000);
    const zone = alert.gi != null && alert.gj != null;
    if (zone) {
      const cells: string[] = [];
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) cells.push(`${alert.gi + di}:${alert.gj + dj}`);
      const { data: links } = await sb.from("cell_links").select("b").eq("a", `${alert.gi}:${alert.gj}`).limit(200);
      for (const l of links ?? []) cells.push(l.b);
      q = q.overlaps("cells", cells);
    } else {
      q = q.contains("areas", [alert.area_id]);
    }
    const { data: all } = await q;
    // one notification per phone per outage, even if neighbouring squares both raise an alert
    const recent = Date.now() - 30 * 60000;
    const subs = (all ?? []).filter((s) => !(s.last_kind === alert.kind && s.last_sent_at && new Date(s.last_sent_at).getTime() > recent));
    if (!subs || !subs.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

    const sa = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "{}");
    const access = await googleAccessToken(sa);
    const names = AREAS[alert.area_id] ?? [alert.area_id, alert.area_id];
    let sent = 0;
    const dead: string[] = [];
    const delivered: string[] = [];
    for (const s of subs) {
      const lang = s.lang === "en" ? "en" : "bn";
      const key = (zone ? (alert.kind === "out" ? "zoneOut" : "zoneBack") : alert.kind) as "out" | "back" | "zoneOut" | "zoneBack";
      const [title, body] = TEXT[lang][key](lang === "en" ? names[0] : names[1], alert.phones);
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            token: s.token,
            notification: { title, body },
            data: { area_id: alert.area_id, kind: alert.kind },
            android: { priority: "HIGH", notification: { channel_id: "alerts" } },
          },
        }),
      });
      if (r.ok) { sent++; delivered.push(s.token); }
      else if (r.status === 404 || r.status === 400) dead.push(s.token);
    }
    if (dead.length) await sb.from("push_tokens").delete().in("token", dead);
    if (delivered.length) {
      await sb.from("push_tokens").update({ last_sent_at: new Date().toISOString(), last_kind: alert.kind }).in("token", delivered);
    }
    await sb.from("alerts").update({ sent_count: sent }).eq("id", alert.id);
    return new Response(JSON.stringify({ sent, removed: dead.length }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
