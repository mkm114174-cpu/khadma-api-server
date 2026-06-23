import 'app_locale.dart';

class LegalContent {
  const LegalContent({
    required this.termsTitle,
    required this.termsBody,
    required this.aboutTitle,
    required this.aboutBody,
    required this.privacyTitle,
    required this.privacyBody,
    required this.close,
  });

  final String termsTitle;
  final String termsBody;
  final String aboutTitle;
  final String aboutBody;
  final String privacyTitle;
  final String privacyBody;
  final String close;

  static LegalContent of(AppLocale locale) {
    return switch (locale) {
      AppLocale.ar => const LegalContent(
          termsTitle: 'شروط الاستخدام',
          termsBody:
              'خدما منصة تربط بين العملاء ومقدمي الخدمات المنزلية في شمال إسرائيل.\n\n'
              '• يجب تقديم معلومات صحيحة عند التسجيل.\n'
              '• الدفع يتم عادةً في الموقع بعد إنجاز الخدمة.\n'
              '• يحق للمنصة إيقاف الحسابات المخالفة.\n'
              '• استخدام التطبيق يعني موافقتك على هذه الشروط.',
          aboutTitle: 'عن التطبيق',
          aboutBody:
              'خدما — منصة خدمات منزلية ومهنية.\n\n'
              'اطلب سباكة، كهرباء، تنظيف، صيانة وأكثر. '
              'نربطك بأقرب مقدم خدمة مناسب لطلبك.',
          privacyTitle: 'سياسة الخصوصية',
          privacyBody:
              'نحترم خصوصيتك. بياناتك تُستخدم لتشغيل الحساب ومطابقة الطلبات مع مقدمي الخدمة فقط. '
              'لا نبيع بياناتك لأطراف ثالثة.',
          close: 'إغلاق',
        ),
      AppLocale.he => const LegalContent(
          termsTitle: 'תנאי שימוש',
          termsBody:
              'Khadma מחברת בין לקוחות לספקי שירות ביתי בצפון.\n'
              'שימוש באפליקציה מהווה הסכמה לתנאים אלה.',
          aboutTitle: 'אודות האפליקציה',
          aboutBody:
              'Khadma — פלטפורמת שירותי בית.\n'
              'מזמינים שירות ומתחברים לספק הקרוב והמתאים.',
          privacyTitle: 'מדיניות פרטיות',
          privacyBody:
              'אנחנו מכבדים את הפרטיות שלך. הנתונים משמשים להפעלת החשבון ולהתאמת בקשות בלבד.',
          close: 'סגירה',
        ),
      AppLocale.en => const LegalContent(
          termsTitle: 'Terms of Use',
          termsBody:
              'Khadma connects customers with home-service providers.\n\n'
              '• Provide accurate information when registering.\n'
              '• Payment is usually on-site after the job.\n'
              '• Misuse may result in account suspension.',
          aboutTitle: 'About Khadma',
          aboutBody:
              'Khadma is a home-services marketplace.\n'
              'Request plumbing, electrical, cleaning, maintenance and more — '
              'we match you with the nearest suitable provider.',
          privacyTitle: 'Privacy Policy',
          privacyBody:
              'We respect your privacy. Your data is used only to run your account '
              'and match service requests. We do not sell your data.',
          close: 'Close',
        ),
    };
  }
}
