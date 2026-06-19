import { db } from "../index";
import { skillsTable } from "../schema";

const BUILT_IN_SKILLS = [
  { name: "قص شعر", slug: "haircut", category: "beauty", icon: "scissors", color: "#FF6B9D" },
  { name: "مكياج كامل", slug: "makeup", category: "beauty", icon: "star", color: "#FF6B9D" },
  { name: "مانيكير وبديكير", slug: "manicure-pedicure", category: "beauty", icon: "droplet", color: "#FF6B9D" },
  { name: "علاج الوجه", slug: "facial-treatment", category: "beauty", icon: "sun", color: "#FF6B9D" },
  { name: "تنظيف المنزل", slug: "home-cleaning", category: "home", icon: "home", color: "#2196F3" },
  { name: "خدمة طهي", slug: "cooking-service", category: "home", icon: "coffee", color: "#2196F3" },
  { name: "رعاية أطفال", slug: "childcare", category: "home", icon: "smile", color: "#2196F3" },
  { name: "رعاية كبار السن", slug: "elderly-care", category: "home", icon: "heart", color: "#2196F3" },
  { name: "سباكة", slug: "plumbing", category: "maintenance", icon: "tool", color: "#FF9800" },
  { name: "كهرباء", slug: "electrical", category: "maintenance", icon: "zap", color: "#FF9800" },
  { name: "صيانة تكييف", slug: "ac-maintenance", category: "maintenance", icon: "wind", color: "#FF9800" },
  { name: "دهانات", slug: "painting", category: "maintenance", icon: "edit", color: "#FF9800" },
  { name: "صانع كعك منزلي", slug: "home-baker", category: "home", icon: "gift", color: "#2196F3" },
  { name: "حلويات منزلية", slug: "home-sweets", category: "home", icon: "coffee", color: "#2196F3" },
  { name: "تنظيف سجاد وكنب", slug: "carpet-sofa-cleaning", category: "home", icon: "grid", color: "#2196F3" },
  { name: "مكافحة حشرات", slug: "pest-control", category: "home", icon: "shield", color: "#2196F3" },
  { name: "تنسيق وصيانة حدائق", slug: "gardening", category: "home", icon: "sun", color: "#2196F3" },
  { name: "نقل أثاث", slug: "furniture-moving", category: "home", icon: "truck", color: "#2196F3" },
  { name: "تصليح غسالات", slug: "washing-machine-repair", category: "maintenance", icon: "refresh-cw", color: "#FF9800" },
  { name: "تصليح ثلاجات وبرّادات", slug: "refrigerator-repair", category: "maintenance", icon: "thermometer", color: "#FF9800" },
  { name: "تصليح أفران ومايكروويف", slug: "oven-microwave-repair", category: "maintenance", icon: "zap", color: "#FF9800" },
  { name: "تصليح غسالة صحون", slug: "dishwasher-repair", category: "maintenance", icon: "droplet", color: "#FF9800" },
  { name: "نجارة وتركيب أثاث", slug: "carpentry-furniture", category: "maintenance", icon: "tool", color: "#FF9800" },
  { name: "تركيب ستائر وإكسسوارات", slug: "curtains-accessories", category: "maintenance", icon: "sliders", color: "#FF9800" },
  { name: "خدمات السيارات", nameEn: "Car Services", nameHe: "שירותי רכב", slug: "car-services", category: "maintenance", icon: "settings", color: "#FF9800" },
  { name: "صيانة البيوت", nameEn: "Home Maintenance", nameHe: "תחזוקת בתים", slug: "home-maintenance", category: "maintenance", icon: "home", color: "#FF9800" },
  // Catch-all skill for "other" (أخرى) requests that don't fit a specific
  // category. Auto-enabled for every provider on approval (see providers route).
  { name: "خدمات أخرى", nameEn: "Other services", nameHe: "שירותים אחרים", slug: "other-general", category: "other", icon: "more-horizontal", color: "#9C27B0" },
];

export async function seedSkills() {
  // Idempotent per-slug upsert: inserts any built-in skills that don't exist yet
  // (including ones added after the initial seed) and leaves existing rows alone.
  await db
    .insert(skillsTable)
    .values(
      BUILT_IN_SKILLS.map((s) => ({
        ...s,
        type: "built_in" as const,
      })),
    )
    .onConflictDoNothing({ target: skillsTable.slug });
}
