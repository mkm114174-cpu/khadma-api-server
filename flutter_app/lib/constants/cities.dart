class KhadmaCity {
  const KhadmaCity({
    required this.nameAr,
    required this.nameEn,
    required this.nameHe,
    required this.lat,
    required this.lng,
  });

  final String nameAr;
  final String nameEn;
  final String nameHe;
  final double lat;
  final double lng;

  String label(String localeCode) => switch (localeCode) {
        'he' => nameHe,
        'en' => nameEn,
        _ => nameAr,
      };
}

const kCities = <KhadmaCity>[
  KhadmaCity(nameAr: 'حيفا', nameEn: 'Haifa', nameHe: 'חיפה', lat: 32.794, lng: 34.989),
  KhadmaCity(nameAr: 'الناصرة', nameEn: 'Nazareth', nameHe: 'נצרת', lat: 32.702, lng: 35.297),
  KhadmaCity(nameAr: 'شفاعمرو', nameEn: "Shefa-'Amr", nameHe: 'שפרעם', lat: 32.806, lng: 35.169),
  KhadmaCity(nameAr: 'عكا', nameEn: 'Acre', nameHe: 'עכו', lat: 32.928, lng: 35.082),
  KhadmaCity(nameAr: 'أم الفحم', nameEn: 'Umm al-Fahm', nameHe: 'אום אל-פחם', lat: 32.519, lng: 35.152),
  KhadmaCity(nameAr: 'الطيبة', nameEn: 'Tayibe', nameHe: 'טייבה', lat: 32.266, lng: 35.0),
  KhadmaCity(nameAr: 'سخنين', nameEn: 'Sakhnin', nameHe: "סח'נין", lat: 32.865, lng: 35.298),
  KhadmaCity(nameAr: 'كفر ياسيف', nameEn: 'Kafr Yasif', nameHe: 'כפר יאסיף', lat: 32.955, lng: 35.166),
  KhadmaCity(nameAr: 'مجد الكروم', nameEn: 'Majd al-Krum', nameHe: "מג'ד אל-כרום", lat: 32.918, lng: 35.243),
  KhadmaCity(nameAr: 'يافة الناصرة', nameEn: 'Yafa an-Naseriyye', nameHe: 'יפיע', lat: 32.687, lng: 35.273),
];
