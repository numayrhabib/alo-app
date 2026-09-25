// Everything you may need to change later lives here.

// Official schedules, collected every 30 minutes by the alo-data repository.
export const SCHEDULE_URL = 'https://raw.githubusercontent.com/numayrhabib/alo-data/main/data/schedule.json';

// Crowd reports ("Power's out" / "Power's back"). Fill these in after creating the free
// Supabase project. While empty, reports stay on this phone only.
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

// AdMob banner unit. Empty = Google's official test banner (safe to tap while testing).
export const BANNER_UNIT_ID = '';

// How long a crowd report counts towards an area's live status.
export const REPORT_WINDOW_MIN = 30;
