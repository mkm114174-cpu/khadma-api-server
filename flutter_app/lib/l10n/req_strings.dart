/// Request-flow strings — ported from LanguageContext req section.
class ReqStrings {
  const ReqStrings({
    required this.cancel,
    required this.ok,
    required this.newTitle,
    required this.newSub,
    required this.descLabel,
    required this.descPlaceholder,
    required this.descRequired,
    required this.addressRequired,
    required this.phoneRequired,
    required this.mediaSectionTitle,
    required this.mediaSectionSub,
    required this.mediaRequired,
    required this.photoBtn,
    required this.videoBtn,
    required this.uploadingMedia,
    required this.sparePartsLabel,
    required this.sparePartsHint,
    required this.mediaPermission,
    required this.location,
    required this.useGps,
    required this.addressPlaceholder,
    required this.locationFailed,
    required this.preferredTime,
    required this.timeAsap,
    required this.timeTodayEve,
    required this.timeTomMorning,
    required this.timeTomEve,
    required this.timeCustom,
    required this.submit,
    required this.submitting,
    required this.created,
    required this.createdMsg,
    required this.viewRequest,
    required this.submitFailed,
    required this.error,
    required this.stepWhat,
    required this.stepWhere,
    required this.stepWhen,
    required this.next,
    required this.back,
    required this.reviewTitle,
    required this.payOnSite,
    required this.phoneLabel,
    required this.guestSignIn,
    required this.requestDetails,
    required this.offersFor,
    required this.noOffers,
    required this.noOffersSub,
    required this.chooseOffer,
    required this.choosing,
    required this.accepted,
    required this.confirmAccept,
    required this.confirmAcceptMsg,
    required this.currency,
    required this.noRating,
    required this.provider,
    required this.statusPending,
    required this.statusActive,
    required this.statusInProgress,
    required this.statusCompleted,
    required this.statusCancelled,
    required this.myTitle,
    required this.empty,
    required this.emptySub,
    required this.newRequest,
    required this.sortNearest,
    required this.waitingOffers,
    required this.locationGpsRequired,
    required this.locationConfirmed,
    required this.located,
    required this.watchVideo,
  });

  final String cancel;
  final String ok;
  final String newTitle;
  final String newSub;
  final String descLabel;
  final String descPlaceholder;
  final String descRequired;
  final String addressRequired;
  final String phoneRequired;
  final String mediaSectionTitle;
  final String mediaSectionSub;
  final String mediaRequired;
  final String photoBtn;
  final String videoBtn;
  final String uploadingMedia;
  final String sparePartsLabel;
  final String sparePartsHint;
  final String mediaPermission;
  final String location;
  final String useGps;
  final String addressPlaceholder;
  final String locationFailed;
  final String preferredTime;
  final String timeAsap;
  final String timeTodayEve;
  final String timeTomMorning;
  final String timeTomEve;
  final String timeCustom;
  final String submit;
  final String submitting;
  final String created;
  final String createdMsg;
  final String viewRequest;
  final String submitFailed;
  final String error;
  final String stepWhat;
  final String stepWhere;
  final String stepWhen;
  final String next;
  final String back;
  final String reviewTitle;
  final String payOnSite;
  final String phoneLabel;
  final String guestSignIn;
  final String requestDetails;
  final String offersFor;
  final String noOffers;
  final String noOffersSub;
  final String chooseOffer;
  final String choosing;
  final String accepted;
  final String confirmAccept;
  final String confirmAcceptMsg;
  final String currency;
  final String noRating;
  final String provider;
  final String statusPending;
  final String statusActive;
  final String statusInProgress;
  final String statusCompleted;
  final String statusCancelled;
  final String myTitle;
  final String empty;
  final String emptySub;
  final String newRequest;
  final String sortNearest;
  final String waitingOffers;
  final String locationGpsRequired;
  final String locationConfirmed;
  final String located;
  final String watchVideo;

  static const ar = ReqStrings(
    cancel: 'إلغاء',
    ok: 'حسناً',
    newTitle: 'اطلب خدمة',
    newSub: 'صف ما تحتاجه واحصل على عروض من المزودين',
    descLabel: 'وصف الطلب',
    descPlaceholder: 'اكتب تفاصيل ما تحتاجه...',
    descRequired: 'الرجاء كتابة وصف الطلب',
    addressRequired: 'الرجاء إدخال العنوان',
    phoneRequired: 'الرجاء إدخال رقم هاتف صالح',
    mediaSectionTitle: 'صورة أو فيديو',
    mediaSectionSub: 'أرفق ملفاً واحداً على الأقل لتوضيح الطلب',
    mediaRequired: 'يرجى إرفاق صورة أو فيديو',
    photoBtn: 'صورة',
    videoBtn: 'فيديو',
    uploadingMedia: 'جارٍ رفع الملف...',
    sparePartsLabel: 'شامل قطع غيار',
    sparePartsHint: 'اختياري — حدّد إذا كانت الخدمة تشمل قطع الغيار',
    mediaPermission: 'نحتاج إذن الوصول إلى الوسائط',
    location: 'الموقع',
    useGps: 'موقعي الحالي',
    addressPlaceholder: 'العنوان أو وصف الموقع',
    locationFailed: 'تعذّر تحديد الموقع',
    preferredTime: 'الوقت المفضل',
    timeAsap: 'في أقرب وقت',
    timeTodayEve: 'اليوم مساءً',
    timeTomMorning: 'غداً صباحاً',
    timeTomEve: 'غداً مساءً',
    timeCustom: 'تاريخ محدد',
    submit: 'إرسال الطلب',
    submitting: 'جارٍ الإرسال...',
    created: 'تم إرسال طلبك',
    createdMsg: 'سيتواصل معك مزودو الخدمة بعروضهم قريباً',
    viewRequest: 'عرض الطلب',
    submitFailed: 'تعذّر إرسال الطلب. حاول مرة أخرى.',
    error: 'حدث خطأ. حاول مرة أخرى.',
    stepWhat: 'ماذا تحتاج؟',
    stepWhere: 'أين وأرقام التواصل',
    stepWhen: 'متى؟',
    next: 'التالي',
    back: 'رجوع',
    reviewTitle: 'مراجعة الطلب',
    payOnSite: 'الدفع عند الوصول (نقداً)',
    phoneLabel: 'رقم الهاتف',
    guestSignIn: 'سجّل دخولك لإرسال طلب حقيقي',
    requestDetails: 'تفاصيل الطلب',
    offersFor: 'العروض المقدمة',
    noOffers: 'لا توجد عروض بعد',
    noOffersSub: 'بانتظار عروض من مزودي الخدمة',
    chooseOffer: 'اختر هذا العرض',
    choosing: 'جارٍ القبول...',
    accepted: 'مقبول',
    confirmAccept: 'قبول العرض',
    confirmAcceptMsg: 'سيتم تعيين هذا المزود ورفض العروض الأخرى.',
    currency: '₪',
    noRating: 'جديد',
    provider: 'مزود',
    statusPending: 'بانتظار العروض',
    statusActive: 'تم اختيار مزود',
    statusInProgress: 'قيد التنفيذ',
    statusCompleted: 'مكتمل',
    statusCancelled: 'ملغى',
    myTitle: 'طلباتي',
    empty: 'لا توجد طلبات بعد',
    emptySub: 'اطلب خدمتك الأولى الآن',
    newRequest: 'طلب جديد',
    sortNearest: 'مرتّبة من الأقرب للأبعد',
    waitingOffers: 'المزودون يراجعون طلبك...',
    locationGpsRequired: 'يجب تحديد موقعك الحقيقي عبر GPS قبل المتابعة',
    locationConfirmed: 'تم تحديد الموقع بدقة',
    located: '✓ الموقع محدد',
    watchVideo: 'معاينة الفيديو',
  );

  static const en = ReqStrings(
    cancel: 'Cancel',
    ok: 'OK',
    newTitle: 'Request a Service',
    newSub: 'Describe what you need and get offers from providers',
    descLabel: 'Description',
    descPlaceholder: 'Describe what you need...',
    descRequired: 'Please describe your request',
    addressRequired: 'Please enter an address',
    phoneRequired: 'Please enter a valid phone number',
    mediaSectionTitle: 'Photo or video',
    mediaSectionSub: 'Attach at least one file to clarify the request',
    mediaRequired: 'Please attach a photo or video',
    photoBtn: 'Photo',
    videoBtn: 'Video',
    uploadingMedia: 'Uploading...',
    sparePartsLabel: 'Includes spare parts',
    sparePartsHint: 'Optional — check if spare parts are included',
    mediaPermission: 'Media permission is required',
    location: 'Location',
    useGps: 'My location',
    addressPlaceholder: 'Address or location notes',
    locationFailed: 'Could not determine location',
    preferredTime: 'Preferred time',
    timeAsap: 'ASAP',
    timeTodayEve: 'Today evening',
    timeTomMorning: 'Tomorrow morning',
    timeTomEve: 'Tomorrow evening',
    timeCustom: 'Pick date & time',
    submit: 'Submit request',
    submitting: 'Submitting...',
    created: 'Request submitted',
    createdMsg: 'Providers will send their offers soon',
    viewRequest: 'View request',
    submitFailed: 'Failed to submit. Try again.',
    error: 'Something went wrong. Try again.',
    stepWhat: 'What do you need?',
    stepWhere: 'Where & contact',
    stepWhen: 'When?',
    next: 'Next',
    back: 'Back',
    reviewTitle: 'Review',
    payOnSite: 'Pay on arrival (cash)',
    phoneLabel: 'Phone number',
    guestSignIn: 'Sign in to submit a real request',
    requestDetails: 'Request details',
    offersFor: 'Offers received',
    noOffers: 'No offers yet',
    noOffersSub: 'Waiting for providers to respond',
    chooseOffer: 'Choose this offer',
    choosing: 'Accepting...',
    accepted: 'Accepted',
    confirmAccept: 'Accept offer',
    confirmAcceptMsg: 'This provider will be assigned and other offers rejected.',
    currency: '₪',
    noRating: 'New',
    provider: 'Provider',
    statusPending: 'Awaiting offers',
    statusActive: 'Provider chosen',
    statusInProgress: 'In progress',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    myTitle: 'My requests',
    empty: 'No requests yet',
    emptySub: 'Request your first service now',
    newRequest: 'New request',
    sortNearest: 'Sorted nearest first',
    waitingOffers: 'Providers are reviewing your request...',
    locationGpsRequired: 'You must set your real GPS location to continue',
    locationConfirmed: 'Location set accurately',
    located: '✓ Location set',
    watchVideo: 'Video preview',
  );

  static const he = ReqStrings(
    cancel: 'ביטול',
    ok: 'אישור',
    newTitle: 'בקשת שירות',
    newSub: 'תאר מה שאתה צריך וקבל הצעות מספקים',
    descLabel: 'תיאור הבקשה',
    descPlaceholder: 'תאר מה שאתה צריך...',
    descRequired: 'אנא תאר את הבקשה',
    addressRequired: 'אנא הזן כתובת',
    phoneRequired: 'אנא הזן מספר טלפון תקין',
    mediaSectionTitle: 'תמונה או סרטון',
    mediaSectionSub: 'צרף קובץ אחד לפחות להבהרת הבקשה',
    mediaRequired: 'אנא צרף תמונה או סרטון',
    photoBtn: 'תמונה',
    videoBtn: 'סרטון',
    uploadingMedia: 'מעלה...',
    sparePartsLabel: 'כולל חלקי חילוף',
    sparePartsHint: 'אופציונלי — סמן אם כולל חלקי חילוף',
    mediaPermission: 'נדרשת הרשאת מדיה',
    location: 'מיקום',
    useGps: 'המיקום שלי',
    addressPlaceholder: 'כתובת או הערות',
    locationFailed: 'לא ניתן לקבוע מיקום',
    preferredTime: 'זמן מועדף',
    timeAsap: 'בהקדם',
    timeTodayEve: 'היום בערב',
    timeTomMorning: 'מחר בבוקר',
    timeTomEve: 'מחר בערב',
    timeCustom: 'תאריך ושעה',
    submit: 'שלח בקשה',
    submitting: 'שולח...',
    created: 'הבקשה נשלחה',
    createdMsg: 'ספקים ישלחו הצעות בקרוב',
    viewRequest: 'צפה בבקשה',
    submitFailed: 'השליחה נכשלה. נסה שוב.',
    error: 'אירעה שגיאה. נסה שוב.',
    stepWhat: 'מה אתה צריך?',
    stepWhere: 'איפה ויצירת קשר',
    stepWhen: 'מתי?',
    next: 'הבא',
    back: 'חזור',
    reviewTitle: 'סקירה',
    payOnSite: 'תשלום במקום (מזומן)',
    phoneLabel: 'מספר טלפון',
    guestSignIn: 'התחבר כדי לשלוח בקשה',
    requestDetails: 'פרטי הבקשה',
    offersFor: 'הצעות שהתקבלו',
    noOffers: 'אין הצעות עדיין',
    noOffersSub: 'ממתין לספקים',
    chooseOffer: 'בחר הצעה זו',
    choosing: 'מקבל...',
    accepted: 'התקבלה',
    confirmAccept: 'קבל הצעה',
    confirmAcceptMsg: 'ספק זה יוקצה וההצעות האחרות יידחו.',
    currency: '₪',
    noRating: 'חדש',
    provider: 'ספק',
    statusPending: 'ממתין להצעות',
    statusActive: 'ספק נבחר',
    statusInProgress: 'בביצוע',
    statusCompleted: 'הושלם',
    statusCancelled: 'בוטל',
    myTitle: 'הבקשות שלי',
    empty: 'אין בקשות',
    emptySub: 'בקש שירות ראשון עכשיו',
    newRequest: 'בקשה חדשה',
    sortNearest: 'ממוין מהקרוב לרחוק',
    waitingOffers: 'ספקים בודקים את הבקשה...',
    locationGpsRequired: 'יש להפעיל GPS ולקבוע מיקום אמיתי להמשך',
    locationConfirmed: 'המיקום נקבע בדיוק',
    located: '✓ המיקום נקבע',
    watchVideo: 'תצוגת סרטון',
  );
}
