export const T = {
  en: {
    appname: 'Alo', home: 'Home', schedule: 'Schedule', tools: 'Tools', settings: 'Settings',
    yourArea: 'Your area', detecting: 'Finding your area…', autoLbl: 'Detected automatically', current: 'Current location',
    powerOn: 'Power is on', powerOff: 'Load shedding now', powerSched: 'Scheduled load shedding now', noReports: 'No reports yet',
    reportsN: (n) => `${n} reports in the last 30 min`, beFirst: 'Tell your neighbours: tap below when power goes or comes back',
    out: "Power's out", back: "Power's back", thanks: 'Thanks, your report helps neighbours',
    tooMany: (m) => `You've reported a lot just now. Try again in ${m}.`,
    maybe: 'Possible outage', notConfirmed: (n) => `${n} report so far, not confirmed yet`,
    confirmedBy: (n) => `Confirmed by ${n} neighbours in the last 30 min`,
    whoQ: 'Is it just your home, or the whole area?', whoH: 'Look outside: are streetlights and neighbours dark too?',
    wholeArea: 'Whole area is out', justMe: 'Only my home',
    justMeTitle: "Probably not load shedding", justMeTip: 'Check your main switch (circuit breaker) and your prepaid meter balance. We did not count this as an area outage.',
    planned: 'Planned shutdowns', plannedH: 'Announced by power offices in the news', remindMe: 'Remind me', reminded: 'Reminder set',
    read: 'Read notice', forYourArea: 'Mentions your area', nothingPlanned: 'No planned shutdowns announced for the next few days.',
    nextOutage: 'Next scheduled outage', toGo: 'to go', none: 'No scheduled load shedding found',
    noneH: 'Your power company has not published a schedule for this area. Crowd reports above still work.',
    reminderOn: (m) => `Reminder set ${m} before`, reminderOff: 'Reminders are off',
    today: 'Today', tomorrow: 'Tomorrow', done: 'Done', live: 'Now', soon: 'Soon', later: 'Later',
    todayTimeline: "Today's timeline", official: 'Official schedule', checkTime: 'check AM/PM',
    scheduleFor: 'Load shedding schedule', notices: 'Official notices', news: 'In the news',
    chooseArea: 'Choose your area', searchArea: 'Search area or company', cancel: 'Cancel',
    ips: 'IPS backup calculator', battery: 'Battery', capacity: 'Capacity (Ah)', load: 'What will run',
    fan: 'Fan', light: 'LED light', router: 'Wi-Fi router', tv: 'TV', lasts: 'Your IPS should last about',
    myLog: 'My outage hours this week', myLogH: 'Counted from your own "out" and "back" reports',
    reminders: 'Outage reminders', remindersH: 'Get notified before scheduled load shedding in your saved places',
    leadTime: 'Remind me before', drag: 'Drag to set', testRem: 'Send test reminder',
    streetLbl: 'Your street (about 150 m)', pinned: 'Pinned', spotSaved: (a) => `Spot saved · near ${a}`,
    mapTitle: 'Pin the exact spot', mapH: 'Move the map until the pin sits on the building.', useSpot: 'Use this spot',
    sensorT: 'Power-cut sensor', sensorCard: 'Turn this phone into a power-cut sensor', sensorOnBtn: 'Turn on',
    sensorH: 'While this phone charges at home, Alo notices the moment the charger loses power and warns your street. No button needed, almost no battery.',
    homeQ: 'Are you at home right now?', homeQH: 'The sensor reports for your Home spot. Pin it first.', atHome: "Yes, I'm home", pickMap: 'Pick on map',
    liveSet: 'Live outage alerts', liveSetH: 'Get a notification when 3 or more neighbours confirm power went out or came back in your saved places',
    autoSet: 'Auto-detect my area', autoSetH: 'Uses GPS to show the area you are in right now',
    saved: 'Saved places', homeL: 'Home', officeL: 'Office', parentsL: 'Parents', change: 'Change',
    language: 'Language', theme: 'Theme', system: 'System', light2: 'Light', dark: 'Dark',
    sources: 'Where the data comes from',
    srcLine: 'Official schedules are checked every 30 minutes on the DESCO, DPDC, BREB, BPDB, NESCO and WZPDCL websites. Live status comes from people nearby.',
    updated: (x) => `Schedules checked ${x}`, offline: 'Offline: showing saved data',
    nTitle: (m) => `Load shedding in ${m}`, nBody: (a, t) => `${a}, ${t}. Charge your phone and fill the water tank.`,
    testTitle: 'Test reminder', testBody: 'Reminders are working.',
    locDenied: 'Location permission is off. Pick your area by hand.', youreIn: (a) => `You're in ${a}`,
    notifDenied: 'Notifications are off for Alo. Turn them on in Android settings.',
    hour: 'hour', hours: 'hours', min: 'min', h: 'h', m: 'm', ago: 'ago', justNow: 'just now', total: 'total',
    version: 'Test version',
  },
  bn: {
    appname: 'আলো', home: 'হোম', schedule: 'সূচি', tools: 'টুলস', settings: 'সেটিংস',
    yourArea: 'আপনার এলাকা', detecting: 'আপনার এলাকা খোঁজা হচ্ছে…', autoLbl: 'স্বয়ংক্রিয়ভাবে শনাক্ত', current: 'বর্তমান অবস্থান',
    powerOn: 'বিদ্যুৎ আছে', powerOff: 'এখন লোডশেডিং চলছে', powerSched: 'এখন নির্ধারিত লোডশেডিং', noReports: 'এখনো কোনো রিপোর্ট নেই',
    reportsN: (n) => `গত ৩০ মিনিটে ${n}টি রিপোর্ট`, beFirst: 'বিদ্যুৎ গেলে বা এলে নিচে চাপুন, প্রতিবেশীরা জানবে',
    out: 'বিদ্যুৎ চলে গেছে', back: 'বিদ্যুৎ এসেছে', thanks: 'ধন্যবাদ, আপনার রিপোর্ট প্রতিবেশীদের কাজে লাগবে',
    tooMany: (m) => `অল্প সময়ে অনেক রিপোর্ট দিয়েছেন। ${m} পর আবার চেষ্টা করুন।`,
    maybe: 'সম্ভাব্য বিদ্যুৎ বিভ্রাট', notConfirmed: (n) => `এখন পর্যন্ত ${n}টি রিপোর্ট, এখনো নিশ্চিত নয়`,
    confirmedBy: (n) => `গত ৩০ মিনিটে ${n} জন প্রতিবেশী নিশ্চিত করেছেন`,
    whoQ: 'শুধু আপনার বাসায়, নাকি পুরো এলাকায়?', whoH: 'বাইরে দেখুন: রাস্তার বাতি আর প্রতিবেশীদের বাসাও কি অন্ধকার?',
    wholeArea: 'পুরো এলাকায় নেই', justMe: 'শুধু আমার বাসায়',
    justMeTitle: 'সম্ভবত লোডশেডিং নয়', justMeTip: 'মেইন সুইচ (সার্কিট ব্রেকার) ও প্রিপেইড মিটারের ব্যালেন্স দেখুন। এটি এলাকার বিভ্রাট হিসেবে গণনা করা হয়নি।',
    planned: 'পরিকল্পিত বিদ্যুৎ বন্ধ', plannedH: 'খবরে প্রকাশিত বিদ্যুৎ অফিসের বিজ্ঞপ্তি থেকে', remindMe: 'মনে করিয়ে দিন', reminded: 'রিমাইন্ডার সেট',
    read: 'বিজ্ঞপ্তি পড়ুন', forYourArea: 'আপনার এলাকার নাম আছে', nothingPlanned: 'আগামী কয়েক দিনে কোনো পরিকল্পিত বিদ্যুৎ বন্ধের ঘোষণা নেই।',
    nextOutage: 'পরবর্তী লোডশেডিং', toGo: 'বাকি', none: 'কোনো নির্ধারিত লোডশেডিং পাওয়া যায়নি',
    noneH: 'এই এলাকার জন্য বিদ্যুৎ কোম্পানি কোনো সূচি প্রকাশ করেনি। উপরের রিপোর্ট সুবিধা চালু আছে।',
    reminderOn: (m) => `${m} আগে রিমাইন্ডার দেওয়া হবে`, reminderOff: 'রিমাইন্ডার বন্ধ',
    today: 'আজ', tomorrow: 'আগামীকাল', done: 'শেষ', live: 'চলছে', soon: 'শীঘ্রই', later: 'পরে',
    todayTimeline: 'আজকের সময়রেখা', official: 'অফিসিয়াল সূচি', checkTime: 'সময় যাচাই করুন',
    scheduleFor: 'লোডশেডিং সূচি', notices: 'অফিসিয়াল নোটিশ', news: 'খবরে',
    chooseArea: 'এলাকা বেছে নিন', searchArea: 'এলাকা বা কোম্পানি খুঁজুন', cancel: 'বাতিল',
    ips: 'আইপিএস ব্যাকআপ ক্যালকুলেটর', battery: 'ব্যাটারি', capacity: 'ক্ষমতা (Ah)', load: 'কী কী চলবে',
    fan: 'ফ্যান', light: 'এলইডি লাইট', router: 'ওয়াইফাই রাউটার', tv: 'টিভি', lasts: 'আপনার আইপিএস চলবে প্রায়',
    myLog: 'এই সপ্তাহে আমার বিদ্যুৎহীন সময়', myLogH: 'আপনার নিজের রিপোর্ট থেকে হিসাব',
    reminders: 'লোডশেডিং রিমাইন্ডার', remindersH: 'সংরক্ষিত স্থানে নির্ধারিত লোডশেডিংয়ের আগে নোটিফিকেশন পান',
    leadTime: 'কতক্ষণ আগে জানাবে', drag: 'টেনে সময় ঠিক করুন', testRem: 'টেস্ট রিমাইন্ডার পাঠান',
    streetLbl: 'আপনার রাস্তা (প্রায় ১৫০ মি.)', pinned: 'পিন করা', spotSaved: (a) => `জায়গা সংরক্ষিত · ${a}-এর কাছে`,
    mapTitle: 'সঠিক জায়গাটা পিন করুন', mapH: 'ম্যাপ সরিয়ে পিনটি বাড়ির উপর রাখুন।', useSpot: 'এই জায়গা নিন',
    sensorT: 'বিদ্যুৎ-বিভ্রাট সেন্সর', sensorCard: 'এই ফোনকে বিদ্যুৎ-বিভ্রাট সেন্সর বানান', sensorOnBtn: 'চালু করুন',
    sensorH: 'বাসায় চার্জে থাকার সময় চার্জারে বিদ্যুৎ গেলেই আলো টের পায় এবং আপনার রাস্তার সবাইকে জানায়। কোনো বোতাম চাপতে হয় না, ব্যাটারিও প্রায় খরচ হয় না।',
    homeQ: 'আপনি কি এখন বাসায়?', homeQH: 'সেন্সর আপনার বাসার জায়গার জন্য রিপোর্ট করে। আগে সেটি পিন করুন।', atHome: 'হ্যাঁ, বাসায় আছি', pickMap: 'ম্যাপে বেছে নিন',
    liveSet: 'লাইভ বিদ্যুৎ বিভ্রাট সতর্কতা', liveSetH: 'সংরক্ষিত স্থানে ৩ বা তার বেশি প্রতিবেশী বিদ্যুৎ যাওয়া বা আসা নিশ্চিত করলে নোটিফিকেশন পান',
    autoSet: 'এলাকা স্বয়ংক্রিয়ভাবে শনাক্ত করুন', autoSetH: 'জিপিএস দিয়ে আপনি এখন যে এলাকায় আছেন তা দেখায়',
    saved: 'সংরক্ষিত স্থান', homeL: 'বাসা', officeL: 'অফিস', parentsL: 'বাবা-মা', change: 'বদলান',
    language: 'ভাষা', theme: 'থিম', system: 'সিস্টেম', light2: 'লাইট', dark: 'ডার্ক',
    sources: 'তথ্য কোথা থেকে আসে',
    srcLine: 'ডেসকো, ডিপিডিসি, পল্লী বিদ্যুৎ, বিউবো, নেসকো ও ওজোপাডিকোর ওয়েবসাইট প্রতি ৩০ মিনিটে দেখা হয়। লাইভ অবস্থা আসে আশেপাশের মানুষের রিপোর্ট থেকে।',
    updated: (x) => `সূচি দেখা হয়েছে ${x}`, offline: 'অফলাইন: সংরক্ষিত তথ্য দেখানো হচ্ছে',
    nTitle: (m) => `${m} পর লোডশেডিং`, nBody: (a, t) => `${a}, ${t}। ফোন চার্জ দিন ও পানির ট্যাংক ভরে রাখুন।`,
    testTitle: 'টেস্ট রিমাইন্ডার', testBody: 'রিমাইন্ডার কাজ করছে।',
    locDenied: 'লোকেশন অনুমতি বন্ধ। হাতে এলাকা বেছে নিন।', youreIn: (a) => `আপনি এখন ${a}-এ`,
    notifDenied: 'আলোর নোটিফিকেশন বন্ধ। অ্যান্ড্রয়েড সেটিংসে চালু করুন।',
    hour: 'ঘণ্টা', hours: 'ঘণ্টা', min: 'মিনিট', h: 'ঘ', m: 'মি', ago: 'আগে', justNow: 'এইমাত্র', total: 'মোট',
    version: 'টেস্ট ভার্সন',
  },
};

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toBn = (s) => String(s).replace(/\d/g, (d) => BN_DIGITS[d]);
export const toEnDigits = (s) => String(s).replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

export function makeFmt(lang) {
  const t = T[lang];
  const n = (s) => (lang === 'bn' ? toBn(s) : String(s));
  const time = (d) => {
    const H = d.getHours();
    const M = String(d.getMinutes()).padStart(2, '0');
    const h12 = H % 12 === 0 ? 12 : H % 12;
    if (lang === 'bn') {
      const p = H < 5 ? 'রাত' : H < 12 ? 'সকাল' : H < 15 ? 'দুপুর' : H < 18 ? 'বিকাল' : H < 20 ? 'সন্ধ্যা' : 'রাত';
      return n(`${p} ${h12}:${M}`);
    }
    return `${h12}:${M} ${H < 12 ? 'AM' : 'PM'}`;
  };
  const dur = (mins) => {
    mins = Math.max(0, Math.round(mins));
    const H = Math.floor(mins / 60);
    const M = mins % 60;
    return n(((H ? `${H}${t.h} ` : '') + `${M}${t.m}`).trim());
  };
  const lead = (mins) => {
    if (mins < 60) return `${n(mins)} ${t.min}`;
    const h = mins / 60;
    const v = Number.isInteger(h) ? h : h.toFixed(1);
    return `${n(v)} ${h === 1 ? t.hour : t.hours}`;
  };
  const ago = (date) => {
    const m = Math.round((Date.now() - date.getTime()) / 60000);
    if (m < 1) return t.justNow;
    return `${dur(m)} ${t.ago}`;
  };
  return { t, n, time, dur, lead, ago };
}
