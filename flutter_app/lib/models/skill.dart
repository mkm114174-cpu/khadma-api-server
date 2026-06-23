class Skill {
  const Skill({
    required this.id,
    required this.name,
    required this.slug,
    this.nameEn,
    this.nameHe,
    this.category,
    this.icon,
    this.color,
  });

  final int id;
  final String name;
  final String slug;
  final String? nameEn;
  final String? nameHe;
  final String? category;
  final String? icon;
  final String? color;

  factory Skill.fromJson(Map<String, dynamic> json) {
    return Skill(
      id: json['id'] as int,
      name: json['name'] as String,
      slug: json['slug'] as String,
      nameEn: json['nameEn'] as String?,
      nameHe: json['nameHe'] as String?,
      category: json['category'] as String?,
      icon: json['icon'] as String?,
      color: json['color'] as String?,
    );
  }

  String localizedName(String locale) {
    if (locale == 'en' && nameEn != null && nameEn!.isNotEmpty) return nameEn!;
    if (locale == 'he' && nameHe != null && nameHe!.isNotEmpty) return nameHe!;
    return name;
  }
}
