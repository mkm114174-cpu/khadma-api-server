import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../constants/cities.dart';
import '../../constants/home_services.dart';
import '../../core/theme/app_colors.dart';
import '../../l10n/app_locale.dart';
import '../../l10n/legal_strings.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/request_providers.dart';
import '../../router/app_router.dart';

const _onboardingDoneKey = 'khadma:providerOnboardingDone';

class _DocFile {
  const _DocFile({this.path, this.label, this.uploading = false});

  final String? path;
  final String? label;
  final bool uploading;

  _DocFile copyWith({String? path, String? label, bool? uploading}) {
    return _DocFile(
      path: path ?? this.path,
      label: label ?? this.label,
      uploading: uploading ?? this.uploading,
    );
  }
}

/// Multi-step provider registration: application → agreements → pending review.
class ProviderOnboardingScreen extends ConsumerStatefulWidget {
  const ProviderOnboardingScreen({super.key});

  @override
  ConsumerState<ProviderOnboardingScreen> createState() =>
      _ProviderOnboardingScreenState();
}

class _ProviderOnboardingScreenState
    extends ConsumerState<ProviderOnboardingScreen> {
  int _step = 0;
  bool _checking = true;
  bool _submitting = false;
  String? _error;

  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();

  final _selectedServices = <String>{};
  KhadmaCity? _city;
  _DocFile _osekPatur = const _DocFile();
  _DocFile _osekMurshe = const _DocFile();
  _DocFile _idDoc = const _DocFile();

  bool _termsAgreed = false;
  bool _pledgeAgreed = false;

  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final auth = ref.read(authProvider);
    if (auth.user?.name != null && auth.user!.name.length >= 2) {
      _nameCtrl.text = auth.user!.name;
    }
    if (auth.user?.phone != null) {
      _phoneCtrl.text = auth.user!.phone!;
    }

    try {
      final provider = await ref.read(khadmaApiProvider).getMyProvider();
      if (!mounted) return;
      if (provider?.status == 'approved') {
        await markProviderOnboardingDone();
        context.go(AppRoutes.provider);
        return;
      }
      if (provider != null && provider.status != 'rejected') {
        _step = 2;
      }
    } catch (_) {}

    if (mounted) setState(() => _checking = false);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  bool get _isRtl => ref.read(isRtlProvider);

  String _s(String ar, String en, String he) {
    final code = ref.read(languageProvider).code;
    return switch (code) {
      'he' => he,
      'en' => en,
      _ => ar,
    };
  }

  Future<void> _pickDoc(void Function(_DocFile) setter) async {
    final file = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );
    if (file == null) return;
    setter(_DocFile(path: file.path, label: file.name));
  }

  Future<String> _uploadDoc(_DocFile doc, String prefix) async {
    final upload = ref.read(uploadServiceProvider);
    final path = doc.path!;
    final ext = path.split('.').last.toLowerCase();
    final contentType = ext == 'png' ? 'image/png' : 'image/jpeg';
    return upload.uploadFile(
      filePath: path,
      fileName: '$prefix-${DateTime.now().millisecondsSinceEpoch}.$ext',
      contentType: contentType,
    );
  }

  void _openServicePicker() {
    final locale = ref.read(languageProvider);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1E1E28),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModal) {
            return DraggableScrollableSheet(
              expand: false,
              initialChildSize: 0.65,
              minChildSize: 0.4,
              maxChildSize: 0.9,
              builder: (_, scroll) => Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      _s('اختر الخدمات', 'Choose services', 'בחר שירותים'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      controller: scroll,
                      itemCount: kHomeServices.length,
                      itemBuilder: (_, i) {
                        final svc = kHomeServices[i];
                        final texts = serviceTexts(locale, svc.id);
                        final selected = _selectedServices.contains(svc.id);
                        return CheckboxListTile(
                          value: selected,
                          activeColor: AppColors.gold,
                          title: Text(
                            texts.title,
                            style: const TextStyle(color: Colors.white),
                          ),
                          subtitle: Text(
                            texts.subtitle,
                            style: const TextStyle(color: Colors.white54),
                          ),
                          onChanged: (v) {
                            setModal(() {
                              if (v == true) {
                                _selectedServices.add(svc.id);
                              } else {
                                _selectedServices.remove(svc.id);
                              }
                            });
                            setState(() {});
                          },
                        );
                      },
                    ),
                  ),
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: FilledButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          minimumSize: const Size.fromHeight(48),
                        ),
                        child: Text(_s('تم', 'Done', 'סיום')),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _openCityPicker() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF1E1E28),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.55,
          builder: (_, scroll) => ListView.builder(
            controller: scroll,
            itemCount: kCities.length,
            itemBuilder: (_, i) {
              final city = kCities[i];
              final code = ref.read(languageProvider).code;
              return ListTile(
                title: Text(
                  city.label(code),
                  style: const TextStyle(color: Colors.white),
                ),
                trailing: _city?.nameAr == city.nameAr
                    ? const Icon(Icons.check, color: AppColors.gold)
                    : null,
                onTap: () {
                  setState(() => _city = city);
                  Navigator.pop(ctx);
                },
              );
            },
          ),
        );
      },
    );
  }

  void _showTerms() {
    final locale = ref.read(languageProvider);
    final legal = LegalContent.of(locale);
  final providerTerms = _providerTerms(locale);

    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E28),
        title: Text(
          legal.termsTitle,
          style: const TextStyle(color: Colors.white),
        ),
        content: SingleChildScrollView(
          child: Text(
            providerTerms,
            style: const TextStyle(color: Colors.white70, height: 1.5),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              legal.close,
              style: const TextStyle(color: AppColors.gold),
            ),
          ),
        ],
      ),
    );
  }

  String _providerTerms(AppLocale locale) => switch (locale) {
        AppLocale.ar =>
          'شروط استخدام منصة خدما لمقدمي الخدمة\n\n'
          '1. التسجيل: تلتزم بتقديم معلومات صحيحة وكاملة عن هويتك وخبرتك ومستنداتك الرسمية. '
          'يحق للمنصة التحقق من صحة البيانات ورفض أو إيقاف الحساب عند التزوير.\n\n'
          '2. العمولة: تفرض المنصة عمولة قدرها 7% على قيمة كل طلب مكتمل عبر التطبيق، '
          'دون حد أقصى لعدد الطلبات. تُستحق العمولة عند إتمام الخدمة وتأكيد الطلب.\n\n'
          '3. المستندات: المستندات المرفوعة (עוסק פטור، עוסק מורשה، هوية/رخصة) تُستخدم للمراجعة فقط '
          'وتُحذف من خوادمنا بعد قرار الموافقة أو الرفض النهائي.\n\n'
          '4. السلوك المهني: تلتزم بالحضور في المواعيد المتفق عليها، التعامل باحترام مع العملاء، '
          'وإنجاز العمل بجودة مهنية. الإخلال المتكرر قد يؤدي لتعليق الحساب.\n\n'
          '5. الدفع: يتم الدفع عادةً نقداً في موقع العمل ما لم يُتفق خلاف ذلك.\n\n'
          '6. الإنهاء: يحق لك أو للمنصة إنهاء التعاون وفق سياسة المنصة. '
          'استمرارك في استخدام التطبيق بعد الموافقة يعني قبولك لهذه الشروط.',
        AppLocale.he =>
          'תנאי שימוש לספקי Khadma\n\n'
          '1. רישום: עליך למסור מידע מדויק ומלא. הפלטפורמה רשאית לאמת ולדחות חשבונות.\n'
          '2. עמלה: 7% מכל הזמנה שהושלמה דרך האפליקציה, ללא מגבלת מספר הזמנות.\n'
          '3. מסמכים: מסמכים שהועלו נמחקים לאחר החלטת אישור או דחייה סופית.\n'
          '4. התנהגות מקצועית: הגעה בזמן, יחס מכבד ואיכות עבודה.\n'
          '5. תשלום: בדרך כלל במזומן במקום העבודה.',
        AppLocale.en =>
          'Khadma Provider Terms\n\n'
          '1. Registration: You must provide accurate information. Khadma may verify and suspend fraudulent accounts.\n'
          '2. Commission: 7% on every completed order through the app, with no order limit.\n'
          '3. Documents: Uploaded documents are used for review only and deleted after a final approve/reject decision.\n'
          '4. Professional conduct: Punctuality, respect, and quality work are required.\n'
          '5. Payment: Usually on-site in cash unless otherwise agreed.',
      };

  bool _validateStep0() {
    if (_selectedServices.isEmpty) {
      setState(() => _error = _s(
            'اختر خدمة واحدة على الأقل',
            'Pick at least one service',
            'בחר לפחות שירות אחד',
          ));
      return false;
    }
    if (_nameCtrl.text.trim().length < 2) {
      setState(() => _error = _s('أدخل الاسم الكامل', 'Enter full name', 'הזן שם מלא'));
      return false;
    }
    if (_city == null) {
      setState(() => _error = _s('اختر البلد/المدينة', 'Choose city', 'בחר עיר'));
      return false;
    }
    if (_addressCtrl.text.trim().length < 3) {
      setState(() => _error = _s('أدخل العنوان', 'Enter address', 'הזן כתובת'));
      return false;
    }
    if (_bioCtrl.text.trim().length < 10) {
      setState(() => _error = _s(
            'اكتب نبذة عن خبرتك (10 أحرف على الأقل)',
            'Describe your experience (min 10 chars)',
            'תאר את הניסיון שלך',
          ));
      return false;
    }
    if (_phoneCtrl.text.trim().length < 9) {
      setState(() => _error = _s('أدخل رقم هاتف صحيح', 'Enter a valid phone', 'הזן טלפון תקין'));
      return false;
    }
    if (_osekPatur.path == null) {
      setState(() => _error = _s(
            'עוסק פטור إجباري',
            'Osek Patur is required',
            'עוסק פטור חובה',
          ));
      return false;
    }
    if (_idDoc.path == null) {
      setState(() => _error = _s(
            'صورة الهوية أو رخصة القيادة إجبارية',
            'ID or driving license required',
            'תעודה או רישיון נהיגה חובה',
          ));
      return false;
    }
    setState(() => _error = null);
    return true;
  }

  Future<void> _goToAgreements() async {
    if (!_validateStep0()) return;
    setState(() => _step = 1);
  }

  Future<void> _submit() async {
    if (!_termsAgreed || !_pledgeAgreed) {
      setState(() => _error = _s(
            'يجب الموافقة على جميع البنود',
            'You must agree to all items',
            'יש לאשר את כל הסעיפים',
          ));
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final auth = ref.read(authProvider);
      if (auth.status == AuthStatus.needsProvision) {
        final locale = ref.read(languageProvider);
        await ref.read(authProvider.notifier).provision(
              ProvisionInput(
                name: _nameCtrl.text.trim(),
                role: 'provider',
                email: auth.user?.email,
                language: locale.code,
                commissionAgreed: true,
              ),
            );
      }

      setState(() {
        _osekPatur = _osekPatur.copyWith(uploading: true);
        _idDoc = _idDoc.copyWith(uploading: true);
        if (_osekMurshe.path != null) {
          _osekMurshe = _osekMurshe.copyWith(uploading: true);
        }
      });

      final paturPath = await _uploadDoc(_osekPatur, 'osek-patur');
      final idPath = await _uploadDoc(_idDoc, 'id-doc');
      String? murshePath;
      if (_osekMurshe.path != null) {
        murshePath = await _uploadDoc(_osekMurshe, 'osek-murshe');
      }

      final firstSvc = homeServiceById(_selectedServices.first);
      final city = _city!;

      await ref.read(khadmaApiProvider).createProvider(
            phone: _phoneCtrl.text.trim(),
            addressText: _addressCtrl.text.trim(),
            docOsekPaturPath: paturPath,
            docIdPath: idPath,
            docOsekMurshePath: murshePath,
            serviceType: firstSvc?.slug,
            bio: _bioCtrl.text.trim(),
            city: city.nameAr,
            lat: city.lat,
            lng: city.lng,
          );

      final skills = await ref.read(khadmaApiProvider).listSkills();
      final ids = <int>[];
      for (final catId in _selectedServices) {
        final def = homeServiceById(catId);
        if (def == null) continue;
        for (final s in skills) {
          if (s.slug == def.slug) {
            ids.add(s.id);
            break;
          }
        }
      }
      if (ids.isNotEmpty) {
        await ref.read(khadmaApiProvider).setProviderSkills(ids);
      }

      await markProviderOnboardingDone();
      ref.invalidate(myProviderProvider);

      if (!mounted) return;
      setState(() {
        _submitting = false;
        _step = 2;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _error = _s(
            'تعذّر إرسال الطلب. تحقق من الاتصال وحاول مجدداً',
            'Failed to submit. Check connection and retry',
            'שליחת הבקשה נכשלה',
          );
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(
        backgroundColor: AppColors.darkBg,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.gold),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkBg,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: _step == 0,
        title: Text(_stepTitle()),
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: switch (_step) {
          0 => _buildApplicationStep(),
          1 => _buildAgreementStep(),
          _ => _buildPendingStep(),
        },
      ),
    );
  }

  String _stepTitle() => switch (_step) {
        0 => _s('تقديم طلب مزوّد', 'Provider application', 'בקשת ספק'),
        1 => _s('الموافقات', 'Agreements', 'הסכמות'),
        _ => _s('قيد المراجعة', 'Under review', 'בבדיקה'),
      };

  Widget _buildApplicationStep() {
    final locale = ref.watch(languageProvider);
    final serviceLabel = _selectedServices.isEmpty
        ? _s('اختر الخدمات', 'Choose services', 'בחר שירותים')
        : _selectedServices
            .map((id) => serviceTexts(locale, id).title)
            .join('، ');

    return ListView(
      key: const ValueKey('app'),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      children: [
        _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              OutlinedButton(
                onPressed: _openServicePicker,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.gold,
                  side: const BorderSide(color: AppColors.gold),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: Text(serviceLabel, textAlign: TextAlign.center),
              ),
              const SizedBox(height: 16),
              _fieldLabel(_s('الاسم الكامل', 'Full name', 'שם מלא')),
              _textField(_nameCtrl, _s('الاسم كما في الهوية', 'As on ID', 'כמו בתעודה')),
              const SizedBox(height: 12),
              _fieldLabel(_s('البلد / المدينة', 'City', 'עיר')),
              OutlinedButton(
                onPressed: _openCityPicker,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
                ),
                child: Text(
                  _city?.label(locale.code) ??
                      _s('اختر المدينة', 'Select city', 'בחר עיר'),
                ),
              ),
              const SizedBox(height: 12),
              _fieldLabel(_s('العنوان', 'Address', 'כתובת')),
              _textField(_addressCtrl, _s('الشارع والرقم', 'Street & number', 'רחוב ומספר')),
              const SizedBox(height: 12),
              _fieldLabel(_s('الخبرة', 'Experience', 'ניסיון')),
              _textField(
                _bioCtrl,
                _s(
                  'اكتب نبذة عن خبرتك ومجال عملك...',
                  'Describe your experience...',
                  'תאר את הניסיון שלך...',
                ),
                maxLines: 4,
              ),
              const SizedBox(height: 12),
              _fieldLabel(_s('رقم الهاتف', 'Phone', 'טלפון')),
              _textField(_phoneCtrl, '05XXXXXXXX', keyboard: TextInputType.phone),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _s('المستندات', 'Documents', 'מסמכים'),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: _isRtl ? TextAlign.right : TextAlign.left,
              ),
              const SizedBox(height: 4),
              Text(
                _s(
                  'تُحذف المستندات بعد موافقة الإدارة أو الرفض',
                  'Documents are deleted after admin approve/reject',
                  'המסמכים נמחקים לאחר אישור או דחייה',
                ),
                style: const TextStyle(color: Colors.white54, fontSize: 12),
                textAlign: _isRtl ? TextAlign.right : TextAlign.left,
              ),
              const SizedBox(height: 12),
              _docRow(
                label: 'עוסק פטור *',
                doc: _osekPatur,
                onPick: () => _pickDoc((d) => setState(() => _osekPatur = d)),
              ),
              _docRow(
                label: _s('עוסק מורשה (اختياري)', 'Osek Murshe (optional)', 'עוסק מורשה (אופציונלי)'),
                doc: _osekMurshe,
                onPick: () => _pickDoc((d) => setState(() => _osekMurshe = d)),
              ),
              _docRow(
                label: _s(
                  'صورة الهوية أو رخصة القيادة *',
                  'ID or driving license *',
                  'תעודה או רישיון נהיגה *',
                ),
                doc: _idDoc,
                onPick: () => _pickDoc((d) => setState(() => _idDoc = d)),
              ),
            ],
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: Colors.redAccent)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _goToAgreements,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.black,
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: Text(
            _s('التالي', 'Next', 'הבא'),
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildAgreementStep() {
    return ListView(
      key: const ValueKey('agree'),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      children: [
        _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Icon(FeatherIcons.percent, color: AppColors.gold, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _s('عمولة المنصة', 'Platform commission', 'עמלת הפלטפורמה'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
                ),
                child: Text(
                  _s(
                    '7% على كل طلب مكتمل — بدون حد أقصى لعدد الطلبات',
                    '7% on every completed order — no order limit',
                    '7% מכל הזמנה שהושלמה — ללא מגבלת הזמנות',
                  ),
                  style: const TextStyle(color: Colors.white, height: 1.5),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _card(
          child: Column(
            children: [
              CheckboxListTile(
                value: _termsAgreed,
                activeColor: AppColors.gold,
                onChanged: (v) => setState(() => _termsAgreed = v ?? false),
                title: Row(
                  children: [
                    Expanded(
                      child: Text(
                        _s('سياسة الاستخدام', 'Terms of use', 'תנאי שימוש'),
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                    TextButton(
                      onPressed: _showTerms,
                      child: Text(
                        _s('قراءة', 'Read', 'קרא'),
                        style: const TextStyle(color: AppColors.gold),
                      ),
                    ),
                  ],
                ),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              const Divider(color: Colors.white12, height: 1),
              CheckboxListTile(
                value: _pledgeAgreed,
                activeColor: AppColors.gold,
                onChanged: (v) => setState(() => _pledgeAgreed = v ?? false),
                title: Text(
                  _s(
                    'أتعهد بالعمل بثقة ومواعيد',
                    'I pledge to work with trust and punctuality',
                    'אני מתחייב לעבוד באמון ובזמן',
                  ),
                  style: const TextStyle(color: Colors.white),
                ),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
            ],
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: Colors.redAccent)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _submitting ? null : _submit,
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.black,
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: _submitting
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(
                  _s('إرسال الطلب', 'Submit application', 'שלח בקשה'),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: _submitting ? null : () => setState(() => _step = 0),
          child: Text(
            _s('رجوع', 'Back', 'חזרה'),
            style: const TextStyle(color: Colors.white54),
          ),
        ),
      ],
    );
  }

  Widget _buildPendingStep() {
    return Center(
      key: const ValueKey('pending'),
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                FeatherIcons.clock,
                color: AppColors.gold,
                size: 40,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _s(
                'بانتظار موافقة الإدارة',
                'Awaiting admin approval',
                'ממתין לאישור מנהל',
              ),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              _s(
                'تم استلام طلبك بنجاح. تستغرق المراجعة حتى 48 ساعة عمل. '
                'سيصلك إشعار عند الموافقة أو الرفض.',
                'Your application was received. Review takes up to 48 business hours. '
                'You will be notified when approved or rejected.',
                'הבקשה התקבלה. הבדיקה עד 48 שעות עבודה. תקבל הודעה עם ההחלטה.',
              ),
              style: const TextStyle(color: Colors.white60, height: 1.6),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            OutlinedButton.icon(
              onPressed: () => ref.read(authProvider.notifier).logout(),
              icon: const Icon(FeatherIcons.logOut, color: Colors.white54, size: 18),
              label: Text(
                _s('تسجيل الخروج', 'Sign out', 'התנתק'),
                style: const TextStyle(color: Colors.white54),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _card({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E28),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: child,
    );
  }

  Widget _fieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white70,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
        textAlign: _isRtl ? TextAlign.right : TextAlign.left,
      ),
    );
  }

  Widget _textField(
    TextEditingController ctrl,
    String hint, {
    int maxLines = 1,
    TextInputType keyboard = TextInputType.text,
  }) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      keyboardType: keyboard,
      style: const TextStyle(color: Colors.white),
      textAlign: _isRtl ? TextAlign.right : TextAlign.left,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white38),
        filled: true,
        fillColor: const Color(0xFF141418),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  Widget _docRow({
    required String label,
    required _DocFile doc,
    required VoidCallback onPick,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
                if (doc.label != null)
                  Text(
                    doc.label!,
                    style: const TextStyle(color: Colors.white38, fontSize: 11),
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          if (doc.uploading)
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.gold),
            )
          else
            OutlinedButton.icon(
              onPressed: onPick,
              icon: Icon(
                doc.path != null ? FeatherIcons.check : FeatherIcons.upload,
                size: 16,
                color: doc.path != null ? Colors.greenAccent : AppColors.gold,
              ),
              label: Text(
                doc.path != null
                    ? _s('تم', 'Done', 'הועלה')
                    : _s('رفع', 'Upload', 'העלה'),
                style: TextStyle(
                  color: doc.path != null ? Colors.greenAccent : AppColors.gold,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: BorderSide(
                  color: doc.path != null ? Colors.greenAccent : AppColors.gold,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

Future<bool> isProviderOnboardingDone() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(_onboardingDoneKey) ?? false;
}

Future<void> markProviderOnboardingDone() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(_onboardingDoneKey, true);
}

/// Backward-compatible alias used by auth flow.
Future<bool> isProviderSkillsDone() => isProviderOnboardingDone();

Future<void> markProviderSkillsDone() => markProviderOnboardingDone();
