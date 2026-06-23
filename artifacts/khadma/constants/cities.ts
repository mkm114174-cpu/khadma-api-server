import type { Lang } from "@/context/LanguageContext";

export interface City {
  /** Canonical Arabic name — this is the value stored on provider.city. */
  name: string;
  nameEn: string;
  nameHe: string;
  lat: number;
  lng: number;
}

/* بلدات ومدن شمال البلاد (منطقة حيفا - الجليل - المثلث) مع إحداثياتها التقريبية. */
export const CITIES: City[] = [
  { name: "شفاعمرو", nameEn: "Shefa-'Amr", nameHe: "שפרעם", lat: 32.806, lng: 35.169 },
  { name: "الناصرة", nameEn: "Nazareth", nameHe: "נצרת", lat: 32.702, lng: 35.297 },
  { name: "حيفا", nameEn: "Haifa", nameHe: "חיפה", lat: 32.794, lng: 34.989 },
  { name: "عكا", nameEn: "Acre", nameHe: "עכו", lat: 32.928, lng: 35.082 },
  { name: "العفولة", nameEn: "Afula", nameHe: "עפולה", lat: 32.61, lng: 35.289 },
  { name: "سخنين", nameEn: "Sakhnin", nameHe: "סח'נין", lat: 32.865, lng: 35.298 },
  { name: "عرابة", nameEn: "Arraba", nameHe: "עראבה", lat: 32.851, lng: 35.337 },
  { name: "طمرة", nameEn: "Tamra", nameHe: "טמרה", lat: 32.853, lng: 35.198 },
  { name: "كفر كنا", nameEn: "Kafr Kanna", nameHe: "כפר כנא", lat: 32.747, lng: 35.342 },
  { name: "كفر مندا", nameEn: "Kafr Manda", nameHe: "כפר מנדא", lat: 32.811, lng: 35.26 },
  { name: "مجد الكروم", nameEn: "Majd al-Krum", nameHe: "מג'ד אל-כרום", lat: 32.918, lng: 35.243 },
  { name: "البعنة", nameEn: "Bi'ina", nameHe: "בענה", lat: 32.913, lng: 35.281 },
  { name: "دير الأسد", nameEn: "Deir al-Asad", nameHe: "דיר אל-אסד", lat: 32.917, lng: 35.27 },
  { name: "نحف", nameEn: "Nahf", nameHe: "נחף", lat: 32.934, lng: 35.31 },
  { name: "الرامة", nameEn: "Rameh", nameHe: "ראמה", lat: 32.937, lng: 35.368 },
  { name: "المغار", nameEn: "Maghar", nameHe: "מע'אר", lat: 32.889, lng: 35.408 },
  { name: "دير حنا", nameEn: "Deir Hanna", nameHe: "דיר חנא", lat: 32.861, lng: 35.368 },
  { name: "عيلبون", nameEn: "Eilabun", nameHe: "עיילבון", lat: 32.825, lng: 35.397 },
  { name: "كفر ياسيف", nameEn: "Kafr Yasif", nameHe: "כפר יאסיף", lat: 32.955, lng: 35.166 },
  { name: "أبو سنان", nameEn: "Abu Snan", nameHe: "אבו סנאן", lat: 32.96, lng: 35.172 },
  { name: "جديدة المكر", nameEn: "Judeida-Makr", nameHe: "ג'דיידה-מכר", lat: 32.926, lng: 35.158 },
  { name: "يافة الناصرة", nameEn: "Yafa an-Naseriyye", nameHe: "יפיע", lat: 32.687, lng: 35.273 },
  { name: "الرينة", nameEn: "Reineh", nameHe: "ריינה", lat: 32.726, lng: 35.31 },
  { name: "إكسال", nameEn: "Iksal", nameHe: "אכסאל", lat: 32.682, lng: 35.323 },
  { name: "المشهد", nameEn: "Mashhad", nameHe: "משהד", lat: 32.738, lng: 35.327 },
  { name: "طرعان", nameEn: "Tur'an", nameHe: "טורעאן", lat: 32.776, lng: 35.374 },
  { name: "كابول", nameEn: "Kabul", nameHe: "כאבול", lat: 32.866, lng: 35.213 },
  { name: "البقيعة", nameEn: "Peki'in", nameHe: "פקיעין", lat: 32.972, lng: 35.339 },
  { name: "أم الفحم", nameEn: "Umm al-Fahm", nameHe: "אום אל-פחם", lat: 32.519, lng: 35.152 },
  { name: "الطيبة", nameEn: "Tayibe", nameHe: "טייבה", lat: 32.266, lng: 35.0 },
  { name: "باقة الغربية", nameEn: "Baqa al-Gharbiyye", nameHe: "באקה אל-גרבייה", lat: 32.418, lng: 35.038 },
];

const cityByName: Record<string, City> = Object.fromEntries(
  CITIES.map((c) => [c.name, c]),
);

/**
 * Localize a city for display. `name` is the canonical Arabic value stored on
 * provider records; this maps it to the active language and falls back to the
 * stored value when the city is not in the catalog (e.g. custom/legacy entries).
 */
export function localizeCity(name: string | null | undefined, lang: Lang): string {
  if (!name) return "";
  const city = cityByName[name];
  if (!city) return name;
  if (lang === "en") return city.nameEn || city.name;
  if (lang === "he") return city.nameHe || city.name;
  return city.name;
}

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/* أقرب بلدة لإحداثيات معيّنة — يستخدم لتجميع المزوّدين الذين لم يحدّدوا بلدتهم. */
export function nearestCity(coord: {
  latitude: number;
  longitude: number;
}): City {
  let best = CITIES[0];
  let bestD = Infinity;
  for (const c of CITIES) {
    const d = haversineKm(coord, { latitude: c.lat, longitude: c.lng });
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}
