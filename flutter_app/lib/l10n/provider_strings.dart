/// Provider-facing strings
class ProviderStrings {
  const ProviderStrings({
    required this.title,
    required this.tabAvailable,
    required this.tabOffers,
    required this.tabJobs,
    required this.offerTitle,
    required this.watchVideoHint,
    required this.priceLabel,
    required this.messageLabel,
    required this.submitOffer,
    required this.navigate,
    required this.openGoogleMaps,
    required this.openWaze,
    required this.distanceToCustomer,
    required this.noRequests,
    required this.offerInvalidPrice,
    required this.offerSubmitFailed,
    required this.budget,
    required this.onSitePayment,
    required this.locationRequired,
    required this.gpsRequiredCustomer,
    required this.gpsRequiredProvider,
  });

  final String title;
  final String tabAvailable;
  final String tabOffers;
  final String tabJobs;
  final String offerTitle;
  final String watchVideoHint;
  final String priceLabel;
  final String messageLabel;
  final String submitOffer;
  final String navigate;
  final String openGoogleMaps;
  final String openWaze;
  final String distanceToCustomer;
  final String noRequests;
  final String offerInvalidPrice;
  final String offerSubmitFailed;
  final String budget;
  final String onSitePayment;
  final String locationRequired;
  final String gpsRequiredCustomer;
  final String gpsRequiredProvider;

  static const ar = ProviderStrings(
    title: 'طلبات العمل',
    tabAvailable: 'متاحة',
    tabOffers: 'عروضي',
    tabJobs: 'وظائفي',
    offerTitle: 'تقديم عرض',
    watchVideoHint: 'شاهد الفيديو أو الصورة قبل تحديد السعر',
    priceLabel: 'سعر العرض (₪)',
    messageLabel: 'رسالة للعميل (اختياري)',
    submitOffer: 'إرسال العرض',
    navigate: 'الملاحة للعميل',
    openGoogleMaps: 'فتح Google Maps',
    openWaze: 'فتح Waze',
    distanceToCustomer: 'المسافة للعميل',
    noRequests: 'لا توجد طلبات قريبة حالياً',
    offerInvalidPrice: 'أدخل سعراً صحيحاً',
    offerSubmitFailed: 'تعذّر إرسال العرض',
    budget: 'ميزانية العميل',
    onSitePayment: 'الدفع عند الوصول (نقداً)',
    locationRequired: 'الموقع مطلوب',
    gpsRequiredCustomer: 'يجب تفعيل GPS وتحديد موقعك الحقيقي لإرسال الطلب',
    gpsRequiredProvider: 'فعّل الموقع لرؤية الطلبات القريبة والملاحة',
  );

  static const en = ProviderStrings(
    title: 'Job requests',
    tabAvailable: 'Available',
    tabOffers: 'My offers',
    tabJobs: 'My jobs',
    offerTitle: 'Submit offer',
    watchVideoHint: 'Watch the video or photo before setting your price',
    priceLabel: 'Your price (₪)',
    messageLabel: 'Message to customer (optional)',
    submitOffer: 'Send offer',
    navigate: 'Navigate to customer',
    openGoogleMaps: 'Open Google Maps',
    openWaze: 'Open Waze',
    distanceToCustomer: 'Distance to customer',
    noRequests: 'No nearby requests right now',
    offerInvalidPrice: 'Enter a valid price',
    offerSubmitFailed: 'Failed to send offer',
    budget: 'Customer budget',
    onSitePayment: 'Pay on arrival (cash)',
    locationRequired: 'Location required',
    gpsRequiredCustomer: 'Enable GPS and set your real location to submit',
    gpsRequiredProvider: 'Enable location to see nearby requests and navigate',
  );

  static const he = ProviderStrings(
    title: 'בקשות עבודה',
    tabAvailable: 'זמינות',
    tabOffers: 'ההצעות שלי',
    tabJobs: 'העבודות שלי',
    offerTitle: 'הגש הצעה',
    watchVideoHint: 'צפה בסרטון או בתמונה לפני קביעת המחיר',
    priceLabel: 'המחיר שלך (₪)',
    messageLabel: 'הודעה ללקוח (אופציונלי)',
    submitOffer: 'שלח הצעה',
    navigate: 'ניווט ללקוח',
    openGoogleMaps: 'פתח Google Maps',
    openWaze: 'פתח Waze',
    distanceToCustomer: 'מרחק ללקוח',
    noRequests: 'אין בקשות קרובות כרגע',
    offerInvalidPrice: 'הזן מחיר תקין',
    offerSubmitFailed: 'שליחת ההצעה נכשלה',
    budget: 'תקציב הלקוח',
    onSitePayment: 'תשלום במקום (מזומן)',
    locationRequired: 'מיקום נדרש',
    gpsRequiredCustomer: 'הפעל GPS וקבע את המיקום האמיתי לשליחה',
    gpsRequiredProvider: 'הפעל מיקום לראות בקשות קרובות ולנווט',
  );
}
