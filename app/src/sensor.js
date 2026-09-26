// Power-cut sensor: a small native Android service (modules/power-sensor) that notices the moment a
// charging phone loses power and reports it for the Home square. Not available in Expo Go.
import { requireOptionalNativeModule } from 'expo';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';
import { deviceId } from './data';

const PS = requireOptionalNativeModule('PowerSensor');
export const sensorAvailable = !!PS;

export async function sensorSync({ home, lang }) {
  if (!PS || !home || !home.cell) return false;
  try {
    PS.configure(JSON.stringify({
      url: SUPABASE_URL, key: SUPABASE_ANON_KEY, device: await deviceId(),
      gi: home.cell.gi, gj: home.cell.gj, area: home.id, lang,
    }));
    PS.start();
    return true;
  } catch (e) {
    return false;
  }
}

export function sensorOff() {
  try { if (PS) PS.stop(); } catch (e) {}
}
