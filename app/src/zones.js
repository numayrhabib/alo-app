// Street-level zones: Bangladesh is cut into squares about 150 m wide ("cells").
// Only the square is ever sent to the server, never the exact GPS point.
import * as Location from 'expo-location';

export const G = 0.0015; // degrees: ≈167 m north–south, ≈153 m east–west in Dhaka

export function cellOf(lat, lng) {
  const gi = Math.round(lat / G);
  const gj = Math.round(lng / G);
  return { gi, gj, id: `${gi}:${gj}` };
}

export const cellCenter = (c) => ({ lat: c.gi * G, lng: c.gj * G });

// One GPS fix, or null (permission refused / no fix in 12 s).
export async function currentSpot() {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return null;
    let pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise((res) => setTimeout(() => res(null), 12000)),
    ]);
    if (!pos) pos = await Location.getLastKnownPositionAsync();
    return pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : null;
  } catch (e) {
    return null;
  }
}
