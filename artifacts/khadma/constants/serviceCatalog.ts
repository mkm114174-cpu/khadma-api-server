// Single source of truth for the customer-facing service catalog.
//
// Both the customer browsing/request flow AND the provider registration/profile
// pickers MUST use this list so that a provider can only ever offer services that
// a customer can actually request — guaranteeing dispatch always finds a match.
//
// Each display category maps to ONE real catalog skill slug (CATEGORY_SLUG). Skill
// IDs are resolved at runtime from the live catalog (never hardcoded) so they stay
// correct across environments and re-seeds.

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: ReturnType<typeof require>;
}

export function getServiceCategories(t: any): ServiceCategory[] {
  return [
    { id: "painting", name: t.home.painting, description: "أصباغ وديكورات", icon: "edit", image: require("@/assets/images/cat_painting.png") },
    { id: "maintenance", name: t.home.maintenance, description: "كل أعمال صيانة المنزل", icon: "home", image: require("@/assets/images/cat_maintenance.png") },
    { id: "plumbing", name: t.home.plumbing, description: "تمديدات وصيانة", icon: "tool", image: require("@/assets/images/cat_plumbing.png") },
    { id: "electricity", name: t.home.electricity, description: "تأسيس وإصلاح", icon: "zap", image: require("@/assets/images/cat_electrical.png") },
    { id: "cleaning", name: t.home.cleaning, description: "تعقيم ومكافحة", icon: "home", image: require("@/assets/images/cat_cleaning.png") },
    { id: "ac", name: t.home.ac, description: "صيانة وتركيب", icon: "wind", image: require("@/assets/images/cat_ac.png") },
    { id: "carpentry", name: t.home.carpentry, description: "خشب وتصليح", icon: "tool", image: require("@/assets/images/cat_carpentry.png") },
    { id: "cars", name: t.home.cars, description: "فحص وميكانيك", icon: "settings", image: require("@/assets/images/cat_cars.png") },
    { id: "appliances", name: t.home.appliances, description: "ثلاجات وغسالات", icon: "refresh-cw", image: require("@/assets/images/cat_appliances.png") },
    { id: "pest_control", name: t.home.pest_control, description: "رش وتعقيم آمن", icon: "shield", image: require("@/assets/images/cat_pest_control.png") },
    { id: "furniture", name: t.home.furniture, description: "تجميع وتركيب", icon: "package", image: require("@/assets/images/cat_furniture.png") },
    { id: "landscaping", name: t.home.landscaping, description: "زراعة وتنسيق", icon: "sun", image: require("@/assets/images/cat_landscaping.png") },
    { id: "moving", name: t.home.moving, description: "فك ونقل آمن", icon: "truck", image: require("@/assets/images/cat_moving.png") },
    { id: "other", name: t.home.other, description: "كل ما هو جديد", icon: "more-horizontal", image: require("@/assets/images/cat_other.png") },
  ];
}

// Maps an app category (home/services tile) to a real catalog skill slug.
export const CATEGORY_SLUG: Record<string, string> = {
  painting: "painting",
  maintenance: "home-maintenance",
  plumbing: "plumbing",
  electricity: "electrical",
  cleaning: "home-cleaning",
  ac: "ac-maintenance",
  carpentry: "carpentry-furniture",
  cars: "car-services",
  furniture: "furniture-moving",
  moving: "furniture-moving",
  pest_control: "pest-control",
  landscaping: "gardening",
  appliances: "washing-machine-repair",
  other: "other-general",
};

// Fallback catalog section (skills.category) when no specific slug matches.
export const CATEGORY_SECTION: Record<string, string> = {
  painting: "maintenance",
  plumbing: "maintenance",
  electricity: "maintenance",
  ac: "maintenance",
  carpentry: "maintenance",
  maintenance: "maintenance",
  appliances: "maintenance",
  cleaning: "home",
  pest_control: "home",
  landscaping: "home",
  furniture: "home",
  moving: "home",
  cars: "home",
  other: "home",
};

export interface CatalogSkill {
  id: number;
  slug: string;
  category?: string | null;
}

// Resolve an app category to a REAL catalog skill id at runtime so we never send a
// non-existent skill id (which fails the DB foreign key).
export function resolveCategorySkillId(
  categoryId: string,
  skills: CatalogSkill[],
): number | null {
  const slug = CATEGORY_SLUG[categoryId];
  if (slug) {
    const bySlug = skills.find((s) => s.slug === slug);
    if (bySlug) return bySlug.id;
  }
  const section = CATEGORY_SECTION[categoryId];
  if (section) {
    const bySection = skills.find((s) => s.category === section);
    if (bySection) return bySection.id;
  }
  return null;
}
