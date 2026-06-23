import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../config/env.dart';
import '../../core/theme/app_colors.dart';
import '../../models/user.dart';
import '../../l10n/app_locale.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/logo_icon.dart';
import '../../core/auth/post_login.dart';
import '../../core/utils/email.dart';

/// Sign-in via email OTP (customer & provider).
class EmailCodeScreen extends ConsumerStatefulWidget {
  const EmailCodeScreen({super.key});

  @override
  ConsumerState<EmailCodeScreen> createState() => _EmailCodeScreenState();
}

class _EmailCodeScreenState extends ConsumerState<EmailCodeScreen> {
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();

  bool _codePhase = false;
  bool _isSignUp = false;
  bool _busy = false;
  String? _error;
  String? _tempPassword;
  String _intendedRole = 'customer';

  static final _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  String get _email => normalizeEmail(_emailController.text);

  bool get _isProvider => _intendedRole == 'provider';

  @override
  void initState() {
    super.initState();
    _loadIntendedRole();
  }

  Future<void> _loadIntendedRole() async {
    final prefs = await SharedPreferences.getInstance();
    final role = prefs.getString('khadma:intendedRole');
    if (role == 'provider' || role == 'customer') {
      if (mounted) setState(() => _intendedRole = role!);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    if (!_emailRe.hasMatch(_email) || _busy) return;
    if (!Env.isConfigured) {
      setState(() => _error = 'إعدادات الخادم غير مكتملة. أعد تثبيت التطبيق من المصدر الصحيح.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });

    final t = ref.read(appStringsProvider);
    final auth = ref.read(neonAuthServiceProvider);

    final signIn = await auth.sendVerificationOtp(
      email: _email,
      type: 'sign-in',
    );

    if (signIn.success) {
      setState(() {
        _isSignUp = false;
        _codePhase = true;
        _busy = false;
      });
      return;
    }

    _tempPassword = const Uuid().v4();
    final signUp = await auth.signUpWithEmail(
      email: _email,
      password: _tempPassword!,
      name: _email.split('@').first,
    );

    if (!signUp.success) {
      setState(() {
        _error = signUp.error ?? t.auth.signupFailed;
        _busy = false;
      });
      return;
    }

    final verify = await auth.sendVerificationOtp(
      email: _email,
      type: 'email-verification',
    );

    if (!verify.success) {
      setState(() {
        _error = verify.error ?? t.auth.serverError;
        _busy = false;
      });
      return;
    }

    setState(() {
      _isSignUp = true;
      _codePhase = true;
      _busy = false;
    });
  }

  Future<void> _verify() async {
    final code = _codeController.text.trim();
    if (code.length < 6 || _busy) return;

    setState(() {
      _busy = true;
      _error = null;
    });

    final t = ref.read(appStringsProvider);
    final auth = ref.read(neonAuthServiceProvider);

    if (_isSignUp) {
      final verified = await auth.verifyEmailWithOtp(email: _email, otp: code);
      if (!verified.success) {
        setState(() {
          _error = verified.error ?? t.auth.invalidCode;
          _busy = false;
        });
        return;
      }

      final password = _tempPassword;
      if (password == null) {
        setState(() {
          _error = t.auth.verifyFailed;
          _busy = false;
        });
        return;
      }

      final signedIn = await auth.signInWithEmail(email: _email, password: password);
      if (!signedIn.success) {
        setState(() {
          _error = signedIn.error ?? t.auth.loginFailed;
          _busy = false;
        });
        return;
      }
    } else {
      var signedIn = await auth.signInWithEmailOtp(email: _email, otp: code);
      if (!signedIn.success) {
        // مستخدم جديد: جرّب مسار التسجيل بنفس الرمز
        _tempPassword ??= const Uuid().v4();
        final signUp = await auth.signUpWithEmail(
          email: _email,
          password: _tempPassword!,
          name: _email.split('@').first,
        );
        if (signUp.success) {
          final verified = await auth.verifyEmailWithOtp(email: _email, otp: code);
          if (verified.success) {
            signedIn = await auth.signInWithEmail(
              email: _email,
              password: _tempPassword!,
            );
            if (signedIn.success) _isSignUp = true;
          }
        }
      }
      if (!signedIn.success) {
        setState(() {
          _error = signedIn.error ?? t.auth.invalidCode;
          _busy = false;
        });
        return;
      }
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('khadma:pendingEmail', _email);

    await ref.read(authProvider.notifier).finalizeAuthAfterLogin();
    if (!mounted) return;

    var authState = ref.read(authProvider);
    if (authState.status == AuthStatus.signedOut) {
      setState(() {
        _error = 'تعذّر إكمال تسجيل الدخول. تحقق من الإنترنت وأعد إدخال الرمز.';
        _busy = false;
      });
      return;
    }

    // حساب موجود بنفس الإيميل (قاعدة البيانات) — ربطه تلقائياً عبر POST /users
    if (authState.status != AuthStatus.ready) {
      await autoProvisionAfterLogin(ref, email: _email);
      if (!mounted) return;
      authState = ref.read(authProvider);
    }

    if (authState.status == AuthStatus.ready) {
      final role = authState.role;
      if (role == AppRole.provider) {
        if (!mounted) return;
        context.go(AppRoutes.providerSkills);
      } else {
        context.go(AppRoutes.tabs);
      }
      return;
    }

    // حساب جديد — إكمال الملف (الاسم + موافقة العمولة للمزوّد)
    if (!mounted) return;
    context.go(AppRoutes.complete);
  }

  Future<void> _resend() async {
    if (_busy) return;
    setState(() => _busy = true);
    final auth = ref.read(neonAuthServiceProvider);
    await auth.sendVerificationOtp(
      email: _email,
      type: _isSignUp ? 'email-verification' : 'sign-in',
    );
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);

    if (_busy && _codePhase) {
      return Scaffold(
        backgroundColor: ref.watch(appColorsProvider).background,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final colors = ref.watch(appColorsProvider);
    final isRtl = ref.watch(isRtlProvider);
    final emailValid = _emailRe.hasMatch(_email);
    final codeValid = _codeController.text.trim().length >= 6;

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            children: [
              const SizedBox(height: 24),
              const LogoIcon(size: 80),
              const SizedBox(height: 8),
              Text(
                t.auth.appName,
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: colors.foreground,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.gold.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _isProvider ? FeatherIcons.settings : FeatherIcons.user,
                      size: 13,
                      color: AppColors.gold,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _isProvider ? t.role.provider : t.role.customer,
                      style: const TextStyle(
                        color: AppColors.gold,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: colors.card,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!_codePhase) ...[
                      Text(
                        t.auth.signIn,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: colors.foreground,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        t.auth.signInSub,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(color: colors.mutedForeground),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        autocorrect: false,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        decoration: InputDecoration(hintText: t.auth.email),
                        onChanged: (_) => setState(() {}),
                        onSubmitted: (_) => _sendCode(),
                      ),
                    ] else ...[
                      Text(
                        t.auth.verifyEmail,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: colors.foreground,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${t.auth.verifySub} $_email',
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(color: colors.mutedForeground),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _codeController,
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        maxLength: 6,
                        style: const TextStyle(
                          fontSize: 28,
                          letterSpacing: 8,
                          fontWeight: FontWeight.w700,
                        ),
                        decoration: const InputDecoration(
                          counterText: '',
                          hintText: '------',
                        ),
                        onChanged: (_) => setState(() {}),
                        onSubmitted: (_) => _verify(),
                      ),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: colors.destructive.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: colors.destructive.withValues(alpha: 0.35)),
                        ),
                        child: Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: colors.destructive, fontSize: 13, height: 1.4),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _busy
                          ? null
                          : (_codePhase
                              ? (codeValid ? _verify : null)
                              : (emailValid ? _sendCode : null)),
                      style: FilledButton.styleFrom(
                        backgroundColor: colors.primary,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        _codePhase
                            ? (_busy ? t.auth.verifying : t.auth.verify)
                            : (_busy ? t.auth.sending : t.auth.sendCode),
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (_codePhase) ...[
                      TextButton(
                        onPressed: _busy ? null : _resend,
                        child: Text(t.auth.resend),
                      ),
                      TextButton(
                        onPressed: () => setState(() {
                          _codePhase = false;
                          _codeController.clear();
                          _error = null;
                        }),
                        child: Text(t.auth.changeEmail),
                      ),
                    ] else
                      TextButton(
                        onPressed: () => context.pop(),
                        child: Text(t.auth.back),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
