// Everything you may need to change later lives here.

// Official schedules, collected every 30 minutes by the alo-data repository.
export const SCHEDULE_URL = 'https://raw.githubusercontent.com/numayrhabib/alo-data/main/data/schedule.json';

// Crowd reports ("Power's out" / "Power's back"). Fill these in after creating the free
// Supabase project. While empty, reports stay on this phone only.
export const SUPABASE_URL = 'https://cnnextllqufknvhuppya.supabase.co';
// Public "anon" key: meant to ship inside the app. The database rules (supabase.sql) limit what it can do.
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNubmV4dGxscXVma252aHVwcHlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTEyNjUsImV4cCI6MjEwNTkyNzI2NX0.hLucs1bldBld_W0iZ_VgkZQGSJk0lTi9vuB1PJv98w4';

// AdMob banner unit. Empty = Google's official test banner (safe to tap while testing).
export const BANNER_UNIT_ID = '';

// How long a crowd report counts towards an area's live status.
export const REPORT_WINDOW_MIN = 30;
