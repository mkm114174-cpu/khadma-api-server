/// Category → catalog skill mapping — from constants/serviceCatalog.ts
const categorySlug = <String, String>{
  'painting': 'painting',
  'maintenance': 'home-maintenance',
  'plumbing': 'plumbing',
  'electricity': 'electrical',
  'cleaning': 'home-cleaning',
  'ac': 'ac-maintenance',
  'carpentry': 'carpentry-furniture',
  'cars': 'car-services',
  'furniture': 'furniture-assembly',
  'moving': 'furniture-moving',
  'pest_control': 'pest-control',
  'landscaping': 'gardening',
  'appliances': 'washing-machine-repair',
  'other': 'other-general',
};

const categorySection = <String, String>{
  'painting': 'maintenance',
  'plumbing': 'maintenance',
  'electricity': 'maintenance',
  'ac': 'maintenance',
  'carpentry': 'maintenance',
  'maintenance': 'maintenance',
  'appliances': 'maintenance',
  'cleaning': 'home',
  'pest_control': 'home',
  'landscaping': 'home',
  'furniture': 'home',
  'moving': 'home',
  'cars': 'home',
  'other': 'home',
};

int? resolveCategorySkillId(String categoryId, List<({int id, String slug, String? category})> skills) {
  final slug = categorySlug[categoryId];
  if (slug != null) {
    for (final s in skills) {
      if (s.slug == slug) return s.id;
    }
  }
  final section = categorySection[categoryId];
  if (section != null) {
    for (final s in skills) {
      if (s.category == section) return s.id;
    }
  }
  return skills.isNotEmpty ? skills.first.id : null;
}
