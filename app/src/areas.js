// Areas the app knows, with the power company that serves them and a centre point for GPS matching.
// `alt` holds other spellings used in official notices.
export const AREAS = [
  // DESCO (north Dhaka)
  { id: 'mirpur10', u: 'DESCO', en: 'Mirpur 10', bn: 'মিরপুর ১০', lat: 23.8069, lng: 90.3687, alt: ['মিরপুর'] },
  { id: 'mirpur1', u: 'DESCO', en: 'Mirpur 1', bn: 'মিরপুর ১', lat: 23.7957, lng: 90.3537 },
  { id: 'pallabi', u: 'DESCO', en: 'Pallabi', bn: 'পল্লবী', lat: 23.8262, lng: 90.3644 },
  { id: 'kafrul', u: 'DESCO', en: 'Kafrul', bn: 'কাফরুল', lat: 23.7925, lng: 90.3860 },
  { id: 'uttara', u: 'DESCO', en: 'Uttara', bn: 'উত্তরা', lat: 23.8740, lng: 90.3984 },
  { id: 'gulshan', u: 'DESCO', en: 'Gulshan', bn: 'গুলশান', lat: 23.7925, lng: 90.4078 },
  { id: 'banani', u: 'DESCO', en: 'Banani', bn: 'বনানী', lat: 23.7937, lng: 90.4066 },
  { id: 'baridhara', u: 'DESCO', en: 'Baridhara', bn: 'বারিধারা', lat: 23.8030, lng: 90.4210 },
  { id: 'badda', u: 'DESCO', en: 'Badda', bn: 'বাড্ডা', lat: 23.7806, lng: 90.4262 },
  { id: 'bashundhara', u: 'DESCO', en: 'Bashundhara', bn: 'বসুন্ধরা', lat: 23.8193, lng: 90.4526 },
  { id: 'tongi', u: 'DESCO', en: 'Tongi', bn: 'টঙ্গী', lat: 23.8981, lng: 90.4086 },
  { id: 'dakshinkhan', u: 'DESCO', en: 'Dakshinkhan', bn: 'দক্ষিণখান', lat: 23.8567, lng: 90.4240 },
  // DPDC (south Dhaka)
  { id: 'dhanmondi', u: 'DPDC', en: 'Dhanmondi', bn: 'ধানমন্ডি', lat: 23.7465, lng: 90.3760 },
  { id: 'mohammadpur', u: 'DPDC', en: 'Mohammadpur', bn: 'মোহাম্মদপুর', lat: 23.7662, lng: 90.3589 },
  { id: 'lalmatia', u: 'DPDC', en: 'Lalmatia', bn: 'লালমাটিয়া', lat: 23.7560, lng: 90.3700 },
  { id: 'farmgate', u: 'DPDC', en: 'Farmgate', bn: 'ফার্মগেট', lat: 23.7580, lng: 90.3900 },
  { id: 'tejgaon', u: 'DPDC', en: 'Tejgaon', bn: 'তেজগাঁও', lat: 23.7639, lng: 90.3930 },
  { id: 'moghbazar', u: 'DPDC', en: 'Moghbazar', bn: 'মগবাজার', lat: 23.7490, lng: 90.4070 },
  { id: 'rampura', u: 'DPDC', en: 'Rampura', bn: 'রামপুরা', lat: 23.7612, lng: 90.4210 },
  { id: 'khilgaon', u: 'DPDC', en: 'Khilgaon', bn: 'খিলগাঁও', lat: 23.7516, lng: 90.4280 },
  { id: 'motijheel', u: 'DPDC', en: 'Motijheel', bn: 'মতিঝিল', lat: 23.7330, lng: 90.4172 },
  { id: 'paltan', u: 'DPDC', en: 'Paltan', bn: 'পল্টন', lat: 23.7360, lng: 90.4120 },
  { id: 'lalbagh', u: 'DPDC', en: 'Lalbagh', bn: 'লালবাগ', lat: 23.7190, lng: 90.3880 },
  { id: 'azimpur', u: 'DPDC', en: 'Azimpur', bn: 'আজিমপুর', lat: 23.7270, lng: 90.3860 },
  { id: 'jatrabari', u: 'DPDC', en: 'Jatrabari', bn: 'যাত্রাবাড়ী', lat: 23.7104, lng: 90.4349 },
  { id: 'demra', u: 'DPDC', en: 'Demra', bn: 'ডেমরা', lat: 23.7240, lng: 90.4920 },
  { id: 'kamrangirchar', u: 'DPDC', en: 'Kamrangirchar', bn: 'কামরাঙ্গীরচর', lat: 23.7130, lng: 90.3730 },
  { id: 'narayanganj', u: 'DPDC', en: 'Narayanganj', bn: 'নারায়ণগঞ্জ', lat: 23.6238, lng: 90.5000 },
  // BREB (Palli Bidyut) – towns around Dhaka and districts
  { id: 'savar', u: 'BREB', en: 'Savar', bn: 'সাভার', lat: 23.8583, lng: 90.2667 },
  { id: 'ashulia', u: 'BREB', en: 'Ashulia', bn: 'আশুলিয়া', lat: 23.9000, lng: 90.3200 },
  { id: 'gazipur', u: 'BREB', en: 'Gazipur', bn: 'গাজীপুর', lat: 23.9999, lng: 90.4203 },
  { id: 'narsingdi', u: 'BREB', en: 'Narsingdi', bn: 'নরসিংদী', lat: 23.9322, lng: 90.7151 },
  { id: 'munshiganj', u: 'BREB', en: 'Munshiganj', bn: 'মুন্সীগঞ্জ', lat: 23.5422, lng: 90.5305 },
  { id: 'manikganj', u: 'BREB', en: 'Manikganj', bn: 'মানিকগঞ্জ', lat: 23.8617, lng: 90.0003 },
  { id: 'tangail', u: 'BREB', en: 'Tangail', bn: 'টাঙ্গাইল', lat: 24.2513, lng: 89.9167 },
  { id: 'mymensingh', u: 'BREB', en: 'Mymensingh', bn: 'ময়মনসিংহ', lat: 24.7471, lng: 90.4203 },
  { id: 'comilla', u: 'BREB', en: 'Cumilla', bn: 'কুমিল্লা', lat: 23.4607, lng: 91.1809, alt: ['comilla'] },
  { id: 'bogura', u: 'NESCO', en: 'Bogura', bn: 'বগুড়া', lat: 24.8481, lng: 89.3730, alt: ['bogra'] },
  // BPDB cities
  { id: 'ctg', u: 'BPDB', en: 'Chattogram', bn: 'চট্টগ্রাম', lat: 22.3569, lng: 91.7832, alt: ['chittagong'] },
  { id: 'sylhet', u: 'BPDB', en: 'Sylhet', bn: 'সিলেট', lat: 24.8949, lng: 91.8687 },
  { id: 'coxsbazar', u: 'BPDB', en: "Cox's Bazar", bn: 'কক্সবাজার', lat: 21.4272, lng: 92.0058 },
  // NESCO (north-west)
  { id: 'rajshahi', u: 'NESCO', en: 'Rajshahi', bn: 'রাজশাহী', lat: 24.3745, lng: 88.6042 },
  { id: 'rangpur', u: 'NESCO', en: 'Rangpur', bn: 'রংপুর', lat: 25.7439, lng: 89.2752 },
  { id: 'dinajpur', u: 'NESCO', en: 'Dinajpur', bn: 'দিনাজপুর', lat: 25.6217, lng: 88.6354 },
  // WZPDCL (south-west)
  { id: 'khulna', u: 'WZPDCL', en: 'Khulna', bn: 'খুলনা', lat: 22.8456, lng: 89.5403 },
  { id: 'jashore', u: 'WZPDCL', en: 'Jashore', bn: 'যশোর', lat: 23.1664, lng: 89.2081, alt: ['jessore'] },
  { id: 'barishal', u: 'WZPDCL', en: 'Barishal', bn: 'বরিশাল', lat: 22.7010, lng: 90.3535, alt: ['barisal'] },
  { id: 'kushtia', u: 'WZPDCL', en: 'Kushtia', bn: 'কুষ্টিয়া', lat: 23.9013, lng: 89.1204 },
];

export const UTIL_BN = { DESCO: 'ডেসকো', DPDC: 'ডিপিডিসি', BREB: 'পল্লী বিদ্যুৎ', BPDB: 'বিউবো', NESCO: 'নেসকো', WZPDCL: 'ওজোপাডিকো' };

export const areaById = (id) => AREAS.find((a) => a.id === id) || AREAS[0];

export function nearestArea(lat, lng) {
  let best = AREAS[0];
  let bestD = Infinity;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const a of AREAS) {
    const d = (a.lat - lat) ** 2 + ((a.lng - lng) * k) ** 2;
    if (d < bestD) { bestD = d; best = a; }
  }
  return best;
}
