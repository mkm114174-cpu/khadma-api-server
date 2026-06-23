enum AppLocale { ar, en, he }

extension AppLocaleX on AppLocale {
  String get code => name;

  bool get isRtl => this == AppLocale.ar || this == AppLocale.he;

  static AppLocale? fromCode(String? code) {
    switch (code) {
      case 'ar':
        return AppLocale.ar;
      case 'en':
        return AppLocale.en;
      case 'he':
        return AppLocale.he;
      default:
        return null;
    }
  }
}
