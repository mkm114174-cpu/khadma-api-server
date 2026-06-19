import type { Lang } from "@/context/LanguageContext";
import { categories, services } from "@/constants/services";

interface ServiceText {
  name: string;
  description: string;
  duration: string;
}

const svcById: Record<string, (typeof services)[number]> = Object.fromEntries(
  services.map((s) => [s.id, s]),
);
const catById: Record<string, (typeof categories)[number]> = Object.fromEntries(
  categories.map((c) => [c.id, c]),
);

const categoryNamesEn: Record<string, string> = {
  beauty: "Beauty",
  home: "Home",
  maintenance: "Maintenance",
};

const categoryNamesHe: Record<string, string> = {
  beauty: "יופי",
  home: "בית",
  maintenance: "תחזוקה",
};

const serviceTextEn: Record<string, ServiceText> = {
  s1: { name: "Haircut", description: "Professional haircut and styling", duration: "45 min" },
  s2: { name: "Full Makeup", description: "Premium makeup with global products", duration: "60 min" },
  s3: { name: "Manicure & Pedicure", description: "Complete nail care", duration: "50 min" },
  s4: { name: "Facial Treatment", description: "Facial cleansing and hydration", duration: "75 min" },
  s9: { name: "Home Cleaning", description: "Thorough professional cleaning", duration: "180 min" },
  s10: { name: "Cooking Service", description: "A professional chef cooks at your home", duration: "120 min" },
  s11: { name: "Babysitting", description: "Trusted, trained babysitter", duration: "240 min" },
  s12: { name: "Elderly Care", description: "Companionship and specialized care", duration: "240 min" },
  s13: { name: "Plumbing", description: "Fix all plumbing issues", duration: "60 min" },
  s14: { name: "Electrical", description: "Safe, certified electrical work", duration: "60 min" },
  s15: { name: "AC Maintenance", description: "AC cleaning and maintenance", duration: "90 min" },
  s16: { name: "Painting", description: "Professional wall painting", duration: "480 min" },
  s17: { name: "Home Cake Maker", description: "Fresh cakes and sweets made to order", duration: "120 min" },
  s18: { name: "Homemade Sweets", description: "Homemade Eastern and Western sweets", duration: "90 min" },
  s19: { name: "Carpet & Sofa Cleaning", description: "Steam washing and sanitizing of carpets and sofas", duration: "120 min" },
  s20: { name: "Pest Control", description: "Safe spraying and sanitizing against pests", duration: "60 min" },
  s21: { name: "Garden Care", description: "Trimming, landscaping and plant watering", duration: "90 min" },
  s22: { name: "Furniture Moving", description: "Safe furniture disassembly, packing and moving", duration: "180 min" },
  s23: { name: "Washing Machine Repair", description: "Service and repair for all washing machines", duration: "60 min" },
  s24: { name: "Fridge & Cooler Repair", description: "Cooling fault repair and parts replacement", duration: "75 min" },
  s25: { name: "Oven & Microwave Repair", description: "Maintenance of ovens and electric stoves", duration: "60 min" },
  s26: { name: "Dishwasher Repair", description: "Service and repair of dishwashers", duration: "60 min" },
  s27: { name: "Carpentry & Furniture Assembly", description: "Wooden furniture assembly and repair", duration: "90 min" },
  s28: { name: "Curtain & Accessory Installation", description: "Hanging curtains, shelves and accessories", duration: "60 min" },
};

const serviceTextHe: Record<string, ServiceText> = {
  s1: { name: "תספורת", description: "תספורת ועיצוב מקצועי", duration: "45 דק׳" },
  s2: { name: "איפור מלא", description: "איפור יוקרתי במוצרים מובילים", duration: "60 דק׳" },
  s3: { name: "מניקור ופדיקור", description: "טיפוח ציפורניים מלא", duration: "50 דק׳" },
  s4: { name: "טיפול פנים", description: "ניקוי והזנת עור הפנים", duration: "75 דק׳" },
  s9: { name: "ניקיון הבית", description: "ניקיון יסודי ומקצועי", duration: "180 דק׳" },
  s10: { name: "שירות בישול", description: "שף מקצועי מבשל אצלך בבית", duration: "120 דק׳" },
  s11: { name: "שמרטפות", description: "שמרטף/ית מנוסה ואמין/ה", duration: "240 דק׳" },
  s12: { name: "טיפול בקשישים", description: "ליווי וטיפול מסור", duration: "240 דק׳" },
  s13: { name: "אינסטלציה", description: "תיקון כל בעיות האינסטלציה", duration: "60 דק׳" },
  s14: { name: "חשמל", description: "עבודות חשמל בטוחות ומוסמכות", duration: "60 דק׳" },
  s15: { name: "תחזוקת מזגנים", description: "ניקוי ותחזוקת מזגנים", duration: "90 דק׳" },
  s16: { name: "צביעה", description: "צביעת קירות מקצועית", duration: "480 דק׳" },
  s17: { name: "אופה עוגות ביתי", description: "עוגות ומתוקים טריים לפי הזמנה", duration: "120 דק׳" },
  s18: { name: "מתוקים ביתיים", description: "מתוקים מזרחיים ומערביים ביתיים", duration: "90 דק׳" },
  s19: { name: "ניקוי שטיחים וספות", description: "כביסה וחיטוי שטיחים וספות בקיטור", duration: "120 דק׳" },
  s20: { name: "הדברה", description: "ריסוס וחיטוי בטוח נגד מזיקים", duration: "60 דק׳" },
  s21: { name: "גינון ותחזוקת גינות", description: "גיזום, עיצוב והשקיית צמחים", duration: "90 דק׳" },
  s22: { name: "הובלת רהיטים", description: "פירוק, אריזה והובלת רהיטים בבטחה", duration: "180 דק׳" },
  s23: { name: "תיקון מכונות כביסה", description: "שירות ותיקון לכל מכונות הכביסה", duration: "60 דק׳" },
  s24: { name: "תיקון מקררים ומצננים", description: "תיקון תקלות קירור והחלפת חלקים", duration: "75 דק׳" },
  s25: { name: "תיקון תנורים ומיקרוגל", description: "תחזוקת תנורים וכיריים חשמליים", duration: "60 דק׳" },
  s26: { name: "תיקון מדיח כלים", description: "שירות ותיקון מדיחי כלים", duration: "60 דק׳" },
  s27: { name: "נגרות והרכבת רהיטים", description: "הרכבה ותיקון רהיטי עץ", duration: "90 דק׳" },
  s28: { name: "התקנת וילונות ואביזרים", description: "תליית וילונות, מדפים ואביזרים", duration: "60 דק׳" },
};

const serviceTextByLang: Record<"en" | "he", Record<string, ServiceText>> = {
  en: serviceTextEn,
  he: serviceTextHe,
};

const categoryNamesByLang: Record<"en" | "he", Record<string, string>> = {
  en: categoryNamesEn,
  he: categoryNamesHe,
};

export function categoryName(id: string, lang: Lang): string {
  if (lang === "ar") return catById[id]?.name ?? id;
  return categoryNamesByLang[lang][id] ?? catById[id]?.name ?? id;
}

export function serviceName(id: string, lang: Lang): string {
  if (lang === "ar") return svcById[id]?.name ?? id;
  return serviceTextByLang[lang][id]?.name ?? svcById[id]?.name ?? id;
}

export function serviceDescription(id: string, lang: Lang): string {
  if (lang === "ar") return svcById[id]?.description ?? "";
  return serviceTextByLang[lang][id]?.description ?? svcById[id]?.description ?? "";
}

export function serviceDuration(id: string, lang: Lang): string {
  if (lang === "ar") return svcById[id]?.duration ?? "";
  return serviceTextByLang[lang][id]?.duration ?? svcById[id]?.duration ?? "";
}

// API-sourced skills (useListSkills) carry localized columns alongside the
// canonical Arabic `name`. These helpers pick the active language and fall back
// to the Arabic value when a translation is missing.
export function localizedSkillName(
  skill: { name: string; nameEn?: string | null; nameHe?: string | null },
  lang: Lang,
): string {
  if (lang === "en") return skill.nameEn?.trim() || skill.name;
  if (lang === "he") return skill.nameHe?.trim() || skill.name;
  return skill.name;
}

export function localizedSkillDescription(
  skill: { description?: string | null; descriptionEn?: string | null; descriptionHe?: string | null },
  lang: Lang,
): string {
  if (lang === "en") return skill.descriptionEn?.trim() || skill.description?.trim() || "";
  if (lang === "he") return skill.descriptionHe?.trim() || skill.description?.trim() || "";
  return skill.description?.trim() || "";
}

// Stored requests keep the canonical Arabic service name as `serviceType`.
// Translate it back to the active language for display by matching the name.
export function serviceNameByType(serviceType: string, lang: Lang): string {
  if (lang === "ar") return serviceType;
  const svc = services.find((s) => s.name === serviceType);
  return svc ? serviceName(svc.id, lang) : serviceType;
}
