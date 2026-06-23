import 'app_locale.dart';
import 'provider_strings.dart';
import 'req_strings.dart';

/// Localized strings — subset ported from context/LanguageContext.tsx
class AppStrings {
  const AppStrings({
    required this.tabs,
    required this.langPicker,
    required this.onboarding,
    required this.role,
    required this.auth,
    required this.layout,
    required this.home,
    required this.req,
    required this.provider,
  });

  final TabStrings tabs;
  final LangPickerStrings langPicker;
  final OnboardingStrings onboarding;
  final RoleStrings role;
  final AuthStrings auth;
  final LayoutStrings layout;
  final HomeStrings home;
  final ReqStrings req;
  final ProviderStrings provider;

  static AppStrings of(AppLocale locale) {
    switch (locale) {
      case AppLocale.en:
        return _en;
      case AppLocale.he:
        return _he;
      case AppLocale.ar:
        return _ar;
    }
  }

  static const _ar = AppStrings(
    tabs: TabStrings(
      more: 'المزيد',
      services: 'خدماتي',
      messages: 'الرسائل',
      home: 'الرئيسية',
      orders: 'طلباتي',
      profile: 'حسابي',
    ),
    langPicker: LangPickerStrings(
      title: 'اختر لغتك',
      subtitle: 'اختر اللغة المناسبة لك',
      arabic: 'العربية',
      english: 'English',
      hebrew: 'עברית',
      demoMode: 'تجربة التطبيق بدون تسجيل',
    ),
    onboarding: OnboardingStrings(
      skip: 'تخطي',
      next: 'التالي',
      startNow: 'ابدأ الآن',
      slide1Label: 'اختر طريقة استخدامك',
      slide1Desc: 'مزود خدمة أو عميل',
      slide2Label: 'اكتشف المزودين',
      slide2Desc: 'أفضل المزودين بالقرب منك',
      slide3Label: 'تصفح الخدمات',
      slide3Desc: 'مجموعة واسعة من الخدمات المنزلية',
      slide4Label: 'احجز بسهولة',
      slide4Desc: 'خطوات بسيطة لحجز خدمتك',
    ),
    role: RoleStrings(
      appName: 'Khadma',
      welcome: 'مرحباً بك',
      subtitle: 'اختر نوع الحساب المناسب لك',
      provider: 'مقدم خدمة',
      providerDesc: 'انضم كمقدم خدمة وقدم خدماتك للعملاء',
      customer: 'طالب خدمة',
      customerDesc: 'اطلب الخدمات التي تحتاجها بسهولة وأمان',
      contact: 'تواصل معنا',
      contactSub: 'نحن هنا لمساعدتك',
    ),
    auth: AuthStrings(
      appName: 'Khadma',
      welcomeBack: 'أهلاً بعودتك',
      signIn: 'تسجيل الدخول',
      signInSub: 'أدخل بريدك الإلكتروني وسنرسل لك رمز التحقق',
      signUp: 'إنشاء حساب',
      signUpSub: 'سجّل للبدء باستخدام خدمة',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      or: 'أو',
      noAccount: 'ليس لديك حساب؟',
      hasAccount: 'لديك حساب؟',
      loginLink: 'تسجيل الدخول',
      loginFailed: 'تعذّر إكمال تسجيل الدخول، حاول مرة أخرى',
      signupFailed: 'تعذّر إنشاء الحساب، حاول مرة أخرى',
      signInGoogle: 'الدخول عبر Google',
      signUpGoogle: 'التسجيل عبر Google',
      sendCode: 'إرسال الرمز',
      sending: 'جاري الإرسال...',
      verifyEmail: 'تأكيد البريد الإلكتروني',
      verifySub: 'أدخل رمز التحقق المُرسل إلى',
      verify: 'تأكيد',
      verifying: 'جاري التحقق...',
      resend: 'إعادة إرسال الرمز',
      changeEmail: 'تغيير البريد',
      back: 'رجوع',
      code: 'رمز التحقق',
      invalidCode: 'الرمز غير صحيح أو منتهي، حاول مرة أخرى',
      verifyFailed: 'تعذّر التحقق، حاول مرة أخرى',
      serverError: 'خطأ في الخادم، حاول لاحقاً',
      create: 'إنشاء حساب',
      customer: 'طالب خدمة',
      provider: 'مقدم خدمة',
      completeProfile: 'أكمل ملفك الشخصي',
      howToUse: 'كيف تريد استخدام التطبيق؟',
      fullName: 'الاسم الكامل',
      namePlaceholder: 'أدخل اسمك',
      nameError: 'الاسم يجب أن يكون حرفين على الأقل',
      continueBtn: 'متابعة',
      saving: 'جاري الحفظ...',
      logout: 'تسجيل الخروج',
      provisionError: 'تعذّر إنشاء الحساب، حاول مرة أخرى',
      commissionAgree: 'أوافق على عمولة المنصة',
    ),
    layout: LayoutStrings(
      errorTitle: 'تعذّر تحميل حسابك',
      errorBody: 'حدث خطأ أثناء الاتصال بالخادم. تحقّق من اتصالك وحاول مرة أخرى.',
      retry: 'إعادة المحاولة',
      signOut: 'تسجيل الخروج',
    ),
    home: HomeStrings(
      appName: 'Khadma',
      goodEvening: 'مساء الخير',
      weAreHere: 'نحن هنا لخدمتك باحتراف',
      currentLocation: 'موقعك الحالي',
      update: 'تحديث',
      locationDenied: 'تم رفض إذن الوصول إلى الموقع. فعّله من إعدادات الجهاز للمتابعة.',
      openSettings: 'فتح الإعدادات',
      locationError: 'تعذّر تحديد موقعك الحالي. تأكد من تفعيل خدمة الموقع وحاول مرة أخرى.',
      searchService: 'ابحث عن خدمة...',
      viewAll: 'عرض الكل',
      categories: 'الأقسام',
      professionalServices: 'خدمات احترافية',
      highQuality: 'بجودة عالية وأسعار مناسبة',
      bookNow: 'احجز الآن',
      painting: 'الدهانات',
      maintenance: 'صيانة البيوت',
      electricity: 'كهرباء',
      plumbing: 'سباكة',
      furniture: 'أثاث وديكور',
      cars: 'خدمات السيارات',
      cleaning: 'تنظيف',
      ac: 'تكييف',
      carpentry: 'نجارة',
      appliances: 'صيانة الأجهزة',
      pestControl: 'مكافحة حشرات',
      landscaping: 'تنسيق حدائق',
      moving: 'نقل وترحيل',
      other: 'أخرى',
    ),
    req: ReqStrings.ar,
    provider: ProviderStrings.ar,
  );

  static const _en = AppStrings(
    tabs: TabStrings(
      more: 'More',
      services: 'Services',
      messages: 'Messages',
      home: 'Home',
      orders: 'Orders',
      profile: 'Profile',
    ),
    langPicker: LangPickerStrings(
      title: 'Choose Your Language',
      subtitle: 'Select the language that suits you',
      arabic: 'Arabic',
      english: 'English',
      hebrew: 'Hebrew',
      demoMode: 'Try the app without signing up',
    ),
    onboarding: OnboardingStrings(
      skip: 'Skip',
      next: 'Next',
      startNow: 'Start Now',
      slide1Label: 'Choose Your Path',
      slide1Desc: 'Service Provider or Customer',
      slide2Label: 'Discover Providers',
      slide2Desc: 'Best providers near you',
      slide3Label: 'Browse Services',
      slide3Desc: 'Wide range of home services',
      slide4Label: 'Book Easily',
      slide4Desc: 'Simple steps to book your service',
    ),
    role: RoleStrings(
      appName: 'Khadma',
      welcome: 'Welcome',
      subtitle: 'Choose the account type that suits you',
      provider: 'Service Provider',
      providerDesc: 'Join as a provider and offer your services',
      customer: 'Customer',
      customerDesc: 'Request the services you need easily and safely',
      contact: 'Contact Us',
      contactSub: 'We are here to help',
    ),
    auth: AuthStrings(
      appName: 'Khadma',
      welcomeBack: 'Welcome back',
      signIn: 'Sign In',
      signInSub: 'Enter your email and we will send a verification code',
      signUp: 'Sign Up',
      signUpSub: 'Sign up to start using Khadma',
      email: 'Email',
      password: 'Password',
      or: 'or',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginLink: 'Sign in',
      loginFailed: 'Sign-in failed. Please try again.',
      signupFailed: 'Sign-up failed. Please try again.',
      signInGoogle: 'Sign in with Google',
      signUpGoogle: 'Sign up with Google',
      sendCode: 'Send Code',
      sending: 'Sending...',
      verifyEmail: 'Verify Email',
      verifySub: 'Enter the code sent to',
      verify: 'Verify',
      verifying: 'Verifying...',
      resend: 'Resend code',
      changeEmail: 'Change email',
      back: 'Back',
      code: 'Verification code',
      invalidCode: 'Invalid or expired code, try again',
      verifyFailed: 'Verification failed, try again',
      serverError: 'Server error, try again later',
      create: 'Create Account',
      customer: 'Customer',
      provider: 'Service Provider',
      completeProfile: 'Complete your profile',
      howToUse: 'How will you use the app?',
      fullName: 'Full name',
      namePlaceholder: 'Enter your name',
      nameError: 'Name must be at least 2 characters',
      continueBtn: 'Continue',
      saving: 'Saving...',
      logout: 'Sign out',
      provisionError: 'Could not create profile, try again',
      commissionAgree: 'I agree to the platform commission',
    ),
    layout: LayoutStrings(
      errorTitle: 'Could not load your account',
      errorBody: 'A server error occurred. Check your connection and try again.',
      retry: 'Retry',
      signOut: 'Sign Out',
    ),
    home: HomeStrings(
      appName: 'Khadma',
      goodEvening: 'Good evening',
      weAreHere: 'We are here to serve you professionally',
      currentLocation: 'Your location',
      update: 'Update',
      locationDenied: 'Location permission denied. Enable it in settings.',
      openSettings: 'Open Settings',
      locationError: 'Could not determine your location. Try again.',
      searchService: 'Search for a service...',
      viewAll: 'View all',
      categories: 'Categories',
      professionalServices: 'Professional services',
      highQuality: 'High quality at fair prices',
      bookNow: 'Book now',
      painting: 'Painting',
      maintenance: 'Home maintenance',
      electricity: 'Electricity',
      plumbing: 'Plumbing',
      furniture: 'Furniture & decor',
      cars: 'Car services',
      cleaning: 'Cleaning',
      ac: 'AC',
      carpentry: 'Carpentry',
      appliances: 'Appliance repair',
      pestControl: 'Pest control',
      landscaping: 'Landscaping',
      moving: 'Moving',
      other: 'Other',
    ),
    req: ReqStrings.en,
    provider: ProviderStrings.en,
  );

  static const _he = AppStrings(
    tabs: TabStrings(
      more: 'עוד',
      services: 'שירותים',
      messages: 'הודעות',
      home: 'בית',
      orders: 'הזמנות',
      profile: 'פרופיל',
    ),
    langPicker: LangPickerStrings(
      title: 'בחר שפה',
      subtitle: 'בחר את השפה המתאימה לך',
      arabic: 'ערבית',
      english: 'אנגלית',
      hebrew: 'עברית',
      demoMode: 'נסה את האפליקציה ללא הרשמה',
    ),
    onboarding: OnboardingStrings(
      skip: 'דלג',
      next: 'הבא',
      startNow: 'התחל עכשיו',
      slide1Label: 'בחר את הדרך שלך',
      slide1Desc: 'ספק שירות או לקוח',
      slide2Label: 'גלה ספקים',
      slide2Desc: 'הספקים הטובים ביותר בקרבתך',
      slide3Label: 'עיין בשירותים',
      slide3Desc: 'מגוון רחב של שירותי בית',
      slide4Label: 'הזמן בקלות',
      slide4Desc: 'צעדים פשוטים להזמנת השירות',
    ),
    role: RoleStrings(
      appName: 'Khadma',
      welcome: 'ברוכים הבאים',
      subtitle: 'בחר את סוג החשבון המתאים לך',
      provider: 'ספק שירות',
      providerDesc: 'הצטרף כספק והצע את השירותים שלך',
      customer: 'לקוח',
      customerDesc: 'בקש את השירותים שאתה צריך בקלות ובבטחה',
      contact: 'צור קשר',
      contactSub: 'אנחנו כאן לעזור',
    ),
    auth: AuthStrings(
      appName: 'Khadma',
      welcomeBack: 'ברוך שובך',
      signIn: 'התחברות',
      signInSub: 'הזן את האימייל שלך ונשלח קוד אימות',
      signUp: 'הרשמה',
      signUpSub: 'הירשם כדי להתחיל להשתמש ב-Khadma',
      email: 'אימייל',
      password: 'סיסמה',
      or: 'או',
      noAccount: 'אין לך חשבון?',
      hasAccount: 'יש לך חשבון?',
      loginLink: 'התחבר',
      loginFailed: 'ההתחברות נכשלה. נסה שוב.',
      signupFailed: 'ההרשמה נכשלה. נסה שוב.',
      signInGoogle: 'התחבר עם Google',
      signUpGoogle: 'הירשם עם Google',
      sendCode: 'שלח קוד',
      sending: 'שולח...',
      verifyEmail: 'אימות אימייל',
      verifySub: 'הזן את הקוד שנשלח ל',
      verify: 'אמת',
      verifying: 'מאמת...',
      resend: 'שלח קוד שוב',
      changeEmail: 'שנה אימייל',
      back: 'חזור',
      code: 'קוד אימות',
      invalidCode: 'קוד שגוי או פג תוקף, נסה שוב',
      verifyFailed: 'האימות נכשל, נסה שוב',
      serverError: 'שגיאת שרת, נסה מאוחר יותר',
      create: 'צור חשבון',
      customer: 'לקוח',
      provider: 'ספק שירות',
      completeProfile: 'השלם את הפרופיל',
      howToUse: 'איך תשתמש באפליקציה?',
      fullName: 'שם מלא',
      namePlaceholder: 'הזן את שמך',
      nameError: 'השם חייב להיות לפחות 2 תווים',
      continueBtn: 'המשך',
      saving: 'שומר...',
      logout: 'התנתק',
      provisionError: 'לא ניתן ליצור פרופיל, נסה שוב',
      commissionAgree: 'אני מסכים לעמלת הפלטפורמה',
    ),
    layout: LayoutStrings(
      errorTitle: 'לא ניתן לטעון את החשבון',
      errorBody: 'אירעה שגיאת שרת. בדוק את החיבור ונסה שוב.',
      retry: 'נסה שוב',
      signOut: 'התנתק',
    ),
    home: HomeStrings(
      appName: 'Khadma',
      goodEvening: 'ערב טוב',
      weAreHere: 'אנחנו כאן לשרת אותך במקצועיות',
      currentLocation: 'המיקום שלך',
      update: 'עדכן',
      locationDenied: 'הרשאת מיקום נדחתה. הפעל בהגדרות.',
      openSettings: 'פתח הגדרות',
      locationError: 'לא ניתן לקבוע את המיקום. נסה שוב.',
      searchService: 'חפש שירות...',
      viewAll: 'הצג הכל',
      categories: 'קטגוריות',
      professionalServices: 'שירותים מקצועיים',
      highQuality: 'איכות גבוהה במחירים הוגנים',
      bookNow: 'הזמן עכשיו',
      painting: 'צביעה',
      maintenance: 'תחזוקת בית',
      electricity: 'חשמל',
      plumbing: 'אינסטלציה',
      furniture: 'ריהוט ועיצוב',
      cars: 'שירותי רכב',
      cleaning: 'ניקיון',
      ac: 'מיזוג',
      carpentry: 'נגרות',
      appliances: 'תיקון מכשירים',
      pestControl: 'הדברת מזיקים',
      landscaping: 'גינון',
      moving: 'הובלה',
      other: 'אחר',
    ),
    req: ReqStrings.he,
    provider: ProviderStrings.he,
  );

  String categoryLabel(String id) {
    switch (id) {
      case 'painting':
        return home.painting;
      case 'maintenance':
        return home.maintenance;
      case 'electricity':
        return home.electricity;
      case 'plumbing':
        return home.plumbing;
      case 'furniture':
        return home.furniture;
      case 'cars':
        return home.cars;
      case 'cleaning':
        return home.cleaning;
      case 'ac':
        return home.ac;
      case 'carpentry':
        return home.carpentry;
      case 'appliances':
        return home.appliances;
      case 'pest_control':
        return home.pestControl;
      case 'landscaping':
        return home.landscaping;
      case 'moving':
        return home.moving;
      case 'other':
        return home.other;
      default:
        return id;
    }
  }
}

class TabStrings {
  const TabStrings({
    required this.more,
    required this.services,
    required this.messages,
    required this.home,
    required this.orders,
    required this.profile,
  });

  final String more;
  final String services;
  final String messages;
  final String home;
  final String orders;
  final String profile;
}

class LangPickerStrings {
  const LangPickerStrings({
    required this.title,
    required this.subtitle,
    required this.arabic,
    required this.english,
    required this.hebrew,
    required this.demoMode,
  });

  final String title;
  final String subtitle;
  final String arabic;
  final String english;
  final String hebrew;
  final String demoMode;
}

class OnboardingStrings {
  const OnboardingStrings({
    required this.skip,
    required this.next,
    required this.startNow,
    required this.slide1Label,
    required this.slide1Desc,
    required this.slide2Label,
    required this.slide2Desc,
    required this.slide3Label,
    required this.slide3Desc,
    required this.slide4Label,
    required this.slide4Desc,
  });

  final String skip;
  final String next;
  final String startNow;
  final String slide1Label;
  final String slide1Desc;
  final String slide2Label;
  final String slide2Desc;
  final String slide3Label;
  final String slide3Desc;
  final String slide4Label;
  final String slide4Desc;

  List<({String label, String desc})> get slides => [
        (label: slide1Label, desc: slide1Desc),
        (label: slide2Label, desc: slide2Desc),
        (label: slide3Label, desc: slide3Desc),
        (label: slide4Label, desc: slide4Desc),
      ];
}

class RoleStrings {
  const RoleStrings({
    required this.appName,
    required this.welcome,
    required this.subtitle,
    required this.provider,
    required this.providerDesc,
    required this.customer,
    required this.customerDesc,
    required this.contact,
    required this.contactSub,
  });

  final String appName;
  final String welcome;
  final String subtitle;
  final String provider;
  final String providerDesc;
  final String customer;
  final String customerDesc;
  final String contact;
  final String contactSub;
}

class AuthStrings {
  const AuthStrings({
    required this.appName,
    required this.welcomeBack,
    required this.signIn,
    required this.signInSub,
    required this.signUp,
    required this.signUpSub,
    required this.email,
    required this.password,
    required this.or,
    required this.noAccount,
    required this.hasAccount,
    required this.loginLink,
    required this.loginFailed,
    required this.signupFailed,
    required this.signInGoogle,
    required this.signUpGoogle,
    required this.sendCode,
    required this.sending,
    required this.verifyEmail,
    required this.verifySub,
    required this.verify,
    required this.verifying,
    required this.resend,
    required this.changeEmail,
    required this.back,
    required this.code,
    required this.invalidCode,
    required this.verifyFailed,
    required this.serverError,
    required this.create,
    required this.customer,
    required this.provider,
    required this.completeProfile,
    required this.howToUse,
    required this.fullName,
    required this.namePlaceholder,
    required this.nameError,
    required this.continueBtn,
    required this.saving,
    required this.logout,
    required this.provisionError,
    required this.commissionAgree,
  });

  final String appName;
  final String welcomeBack;
  final String signIn;
  final String signInSub;
  final String signUp;
  final String signUpSub;
  final String email;
  final String password;
  final String or;
  final String noAccount;
  final String hasAccount;
  final String loginLink;
  final String loginFailed;
  final String signupFailed;
  final String signInGoogle;
  final String signUpGoogle;
  final String sendCode;
  final String sending;
  final String verifyEmail;
  final String verifySub;
  final String verify;
  final String verifying;
  final String resend;
  final String changeEmail;
  final String back;
  final String code;
  final String invalidCode;
  final String verifyFailed;
  final String serverError;
  final String create;
  final String customer;
  final String provider;
  final String completeProfile;
  final String howToUse;
  final String fullName;
  final String namePlaceholder;
  final String nameError;
  final String continueBtn;
  final String saving;
  final String logout;
  final String provisionError;
  final String commissionAgree;
}

class LayoutStrings {
  const LayoutStrings({
    required this.errorTitle,
    required this.errorBody,
    required this.retry,
    required this.signOut,
  });

  final String errorTitle;
  final String errorBody;
  final String retry;
  final String signOut;
}

class HomeStrings {
  const HomeStrings({
    required this.appName,
    required this.goodEvening,
    required this.weAreHere,
    required this.currentLocation,
    required this.update,
    required this.locationDenied,
    required this.openSettings,
    required this.locationError,
    required this.searchService,
    required this.viewAll,
    required this.categories,
    required this.professionalServices,
    required this.highQuality,
    required this.bookNow,
    required this.painting,
    required this.maintenance,
    required this.electricity,
    required this.plumbing,
    required this.furniture,
    required this.cars,
    required this.cleaning,
    required this.ac,
    required this.carpentry,
    required this.appliances,
    required this.pestControl,
    required this.landscaping,
    required this.moving,
    required this.other,
  });

  final String appName;
  final String goodEvening;
  final String weAreHere;
  final String currentLocation;
  final String update;
  final String locationDenied;
  final String openSettings;
  final String locationError;
  final String searchService;
  final String viewAll;
  final String categories;
  final String professionalServices;
  final String highQuality;
  final String bookNow;
  final String painting;
  final String maintenance;
  final String electricity;
  final String plumbing;
  final String furniture;
  final String cars;
  final String cleaning;
  final String ac;
  final String carpentry;
  final String appliances;
  final String pestControl;
  final String landscaping;
  final String moving;
  final String other;
}
