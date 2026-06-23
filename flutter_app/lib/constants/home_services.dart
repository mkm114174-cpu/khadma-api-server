import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';

import '../l10n/app_locale.dart';

/// The 13 canonical home/services categories — same list for home + provider signup.
class HomeServiceDef {
  const HomeServiceDef({
    required this.id,
    required this.slug,
    required this.icon,
    required this.imageUrl,
    required this.gradient,
  });

  final String id;
  final String slug;
  final IconData icon;
  final String imageUrl;
  final List<Color> gradient;
}

const kHomeServices = <HomeServiceDef>[
  HomeServiceDef(
    id: 'maintenance',
    slug: 'home-maintenance',
    icon: FeatherIcons.home,
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    gradient: [Color(0xFFC8A574), Color(0xFF8B6914)],
  ),
  HomeServiceDef(
    id: 'cleaning',
    slug: 'home-cleaning',
    icon: FeatherIcons.droplet,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
    gradient: [Color(0xFF4A90A4), Color(0xFF2C5F6E)],
  ),
  HomeServiceDef(
    id: 'electricity',
    slug: 'electrical',
    icon: FeatherIcons.zap,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
    gradient: [Color(0xFFE8B84A), Color(0xFFB8860B)],
  ),
  HomeServiceDef(
    id: 'plumbing',
    slug: 'plumbing',
    icon: FeatherIcons.droplet,
    imageUrl: 'https://images.unsplash.com/photo-1607472586893-edb8eebef770?w=400&q=80',
    gradient: [Color(0xFF5B8DEF), Color(0xFF3A5F9E)],
  ),
  HomeServiceDef(
    id: 'painting',
    slug: 'painting',
    icon: FeatherIcons.edit3,
    imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80',
    gradient: [Color(0xFFE07B54), Color(0xFFB84A2F)],
  ),
  HomeServiceDef(
    id: 'appliances',
    slug: 'washing-machine-repair',
    icon: FeatherIcons.cpu,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80',
    gradient: [Color(0xFF7B8FA1), Color(0xFF4A5568)],
  ),
  HomeServiceDef(
    id: 'carpentry',
    slug: 'carpentry-furniture',
    icon: FeatherIcons.settings,
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80',
    gradient: [Color(0xFF8B6914), Color(0xFF5C4610)],
  ),
  HomeServiceDef(
    id: 'ac',
    slug: 'ac-maintenance',
    icon: FeatherIcons.wind,
    imageUrl: 'https://images.unsplash.com/photo-1631545806609-406b797f7edc?w=400&q=80',
    gradient: [Color(0xFF60A5FA), Color(0xFF2563EB)],
  ),
  HomeServiceDef(
    id: 'moving',
    slug: 'furniture-moving',
    icon: FeatherIcons.package,
    imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80',
    gradient: [Color(0xFFA78BFA), Color(0xFF7C3AED)],
  ),
  HomeServiceDef(
    id: 'landscaping',
    slug: 'gardening',
    icon: FeatherIcons.sun,
    imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=400&q=80',
    gradient: [Color(0xFF4ADE80), Color(0xFF16A34A)],
  ),
  HomeServiceDef(
    id: 'furniture',
    slug: 'furniture-assembly',
    icon: FeatherIcons.box,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    gradient: [Color(0xFFD4A574), Color(0xFF9A6B3A)],
  ),
  HomeServiceDef(
    id: 'pest_control',
    slug: 'pest-control',
    icon: FeatherIcons.shield,
    imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&q=80',
    gradient: [Color(0xFF34D399), Color(0xFF059669)],
  ),
  HomeServiceDef(
    id: 'cars',
    slug: 'car-repair',
    icon: FeatherIcons.truck,
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
    gradient: [Color(0xFF64748B), Color(0xFF334155)],
  ),
];

class ServiceTexts {
  const ServiceTexts({required this.title, required this.subtitle});
  final String title;
  final String subtitle;
}

ServiceTexts serviceTexts(AppLocale locale, String id) {
  return switch (locale) {
    AppLocale.ar => _ar(id),
    AppLocale.he => _he(id),
    AppLocale.en => _en(id),
  };
}

ServiceTexts _ar(String id) => switch (id) {
      'maintenance' => const ServiceTexts(title: 'صيانة المنزل', subtitle: 'إصلاح وترميم شامل'),
      'cleaning' => const ServiceTexts(title: 'تنظيف', subtitle: 'تعقيم ومكافحة'),
      'electricity' => const ServiceTexts(title: 'كهرباء', subtitle: 'تأسيس وإصلاح'),
      'plumbing' => const ServiceTexts(title: 'سباكة', subtitle: 'تمديدات وصيانة'),
      'painting' => const ServiceTexts(title: 'الدهانات', subtitle: 'أصباغ وديكورات'),
      'appliances' => const ServiceTexts(title: 'صيانة الأجهزة', subtitle: 'ثلاجات وغسالات'),
      'carpentry' => const ServiceTexts(title: 'نجارة', subtitle: 'خشب وتصليح'),
      'ac' => const ServiceTexts(title: 'تكييف', subtitle: 'صيانة وتركيب'),
      'moving' => const ServiceTexts(title: 'نقل وترحيل', subtitle: 'فك ونقل آمن'),
      'landscaping' => const ServiceTexts(title: 'تنسيق حدائق', subtitle: 'زراعة وتنسيق'),
      'furniture' => const ServiceTexts(title: 'أثاث وديكور', subtitle: 'تجميع وتركيب'),
      'pest_control' => const ServiceTexts(title: 'مكافحة حشرات', subtitle: 'رش وتعقيم آمن'),
      'cars' => const ServiceTexts(title: 'سيارات', subtitle: 'صيانة وإصلاح'),
      _ => ServiceTexts(title: id, subtitle: ''),
    };

ServiceTexts _he(String id) => switch (id) {
      'maintenance' => const ServiceTexts(title: 'תחזוקת בית', subtitle: 'תיקון ושיפוץ'),
      'cleaning' => const ServiceTexts(title: 'ניקיון', subtitle: 'חיטוי והדברה'),
      'electricity' => const ServiceTexts(title: 'חשמל', subtitle: 'התקנה ותיקון'),
      'plumbing' => const ServiceTexts(title: 'אינסטלציה', subtitle: 'צנרת ותחזוקה'),
      'painting' => const ServiceTexts(title: 'צבע', subtitle: 'צבעים ועיצוב'),
      'appliances' => const ServiceTexts(title: 'מכשירי חשמל', subtitle: 'מקררים ומכונות כביסה'),
      'carpentry' => const ServiceTexts(title: 'נגרות', subtitle: 'עץ ותיקון'),
      'ac' => const ServiceTexts(title: 'מיזוג אוויר', subtitle: 'תחזוקה והתקנה'),
      'moving' => const ServiceTexts(title: 'הובלה', subtitle: 'פירוק והובלה בטוחה'),
      'landscaping' => const ServiceTexts(title: 'גינון', subtitle: 'שתילה ועיצוב'),
      'furniture' => const ServiceTexts(title: 'רהיטים ועיצוב', subtitle: 'הרכבה והתקנה'),
      'pest_control' => const ServiceTexts(title: 'הדברה', subtitle: 'ריסוס וחיטוי בטוח'),
      'cars' => const ServiceTexts(title: 'רכב', subtitle: 'תיקון ותחזוקה'),
      _ => ServiceTexts(title: id, subtitle: ''),
    };

ServiceTexts _en(String id) => switch (id) {
      'maintenance' => const ServiceTexts(title: 'Home Maintenance', subtitle: 'Repair & renovation'),
      'cleaning' => const ServiceTexts(title: 'Cleaning', subtitle: 'Sanitizing & pest prep'),
      'electricity' => const ServiceTexts(title: 'Electrical', subtitle: 'Install & repair'),
      'plumbing' => const ServiceTexts(title: 'Plumbing', subtitle: 'Pipes & maintenance'),
      'painting' => const ServiceTexts(title: 'Painting', subtitle: 'Paint & decor'),
      'appliances' => const ServiceTexts(title: 'Appliances', subtitle: 'Fridges & washers'),
      'carpentry' => const ServiceTexts(title: 'Carpentry', subtitle: 'Wood & repair'),
      'ac' => const ServiceTexts(title: 'A/C', subtitle: 'Service & install'),
      'moving' => const ServiceTexts(title: 'Moving', subtitle: 'Safe packing & move'),
      'landscaping' => const ServiceTexts(title: 'Landscaping', subtitle: 'Planting & design'),
      'furniture' => const ServiceTexts(title: 'Furniture', subtitle: 'Assembly & setup'),
      'pest_control' => const ServiceTexts(title: 'Pest Control', subtitle: 'Safe spray & sanitize'),
      'cars' => const ServiceTexts(title: 'Cars', subtitle: 'Repair & maintenance'),
      _ => ServiceTexts(title: id, subtitle: ''),
    };

HomeServiceDef? homeServiceById(String id) {
  for (final s in kHomeServices) {
    if (s.id == id) return s;
  }
  return null;
}
