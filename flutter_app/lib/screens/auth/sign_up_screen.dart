import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';
import '../../core/auth/post_login.dart';
import '../../core/utils/email.dart';
import '../../router/app_router.dart';
import '../../widgets/logo_icon.dart';

/// Provider sign-up — ported from sign-up.tsx
class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key, this.role = 'provider'});

  final String role;

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();

  bool _needsVerify = false;
  bool _busy = false;
  String _formError = '';

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  bool get _isProvider => widget.role == 'provider';

  Future<void> _submit() async {
    final t = ref.read(appStringsProvider);
    setState(() {
      _formError = '';
      _busy = true;
    });

    final auth = ref.read(neonAuthServiceProvider);
    final email = normalizeEmail(_emailController.text);
    final result = await auth.signUpWithEmail(
      email: email,
      password: _passwordController.text,
      name: email.split('@').first,
    );

    if (!result.success) {
      setState(() {
        _formError = t.auth.signupFailed;
        _busy = false;
      });
      return;
    }

    if (result.needsVerify) {
      await auth.sendVerificationOtp(email: email, type: 'email-verification');
      setState(() {
        _needsVerify = true;
        _busy = false;
      });
      return;
    }

    await ref.read(authProvider.notifier).finalizeAuthAfterLogin();
    if (mounted) await _afterAuthSuccess();
  }

  Future<void> _persistSignupContext(String email) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('khadma:pendingEmail', email);
    await prefs.setString('khadma:intendedRole', widget.role);
  }

  Future<void> _afterAuthSuccess() async {
    final email = normalizeEmail(_emailController.text);
    await _persistSignupContext(email);
    if (mounted) await _navigateAfterAuth();
  }

  Future<void> _navigateAfterAuth() async {
    final auth = ref.read(authProvider);
    final t = ref.read(appStringsProvider);
    final email = normalizeEmail(_emailController.text);

    if (auth.status == AuthStatus.signedOut) {
      setState(() {
        _busy = false;
        _formError = t.auth.verifyFailed;
      });
      return;
    }

    if (auth.status == AuthStatus.ready) {
      setState(() => _busy = false);
      final role = auth.role;
      if (role == AppRole.provider) {
        if (!mounted) return;
        context.go(AppRoutes.providerSkills);
      } else {
        context.go(AppRoutes.tabs);
      }
      return;
    }

    await autoProvisionAfterLogin(ref, email: email);
    if (!mounted) return;
    setState(() => _busy = false);

    final role = resolveIntendedRole(ref);
    if (role == 'provider') {
      context.go(AppRoutes.providerSkills);
    } else {
      context.go(AppRoutes.tabs);
    }
  }

  Future<void> _verify() async {
    final t = ref.read(appStringsProvider);
    setState(() {
      _formError = '';
      _busy = true;
    });

    final auth = ref.read(neonAuthServiceProvider);
    final email = normalizeEmail(_emailController.text);
    final verified = await auth.verifyEmailWithOtp(
      email: email,
      otp: _codeController.text.trim(),
    );

    if (!verified.success) {
      setState(() {
        _formError = t.auth.verifyFailed;
        _busy = false;
      });
      return;
    }

    final signedIn = await auth.signInWithEmail(
      email: email,
      password: _passwordController.text,
    );

    if (!signedIn.success) {
      setState(() {
        _formError = t.auth.loginFailed;
        _busy = false;
      });
      return;
    }

    await ref.read(authProvider.notifier).finalizeAuthAfterLogin();
    if (mounted) await _afterAuthSuccess();
  }

  Future<void> _resend() async {
    setState(() => _busy = true);
    await ref.read(neonAuthServiceProvider).sendVerificationOtp(
          email: normalizeEmail(_emailController.text),
          type: 'email-verification',
        );
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final colors = ref.watch(appColorsProvider);
    final isRtl = ref.watch(isRtlProvider);

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
                  fontSize: 32,
                  fontWeight: FontWeight.w800,
                  color: colors.foreground,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: colors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colors.primary.withValues(alpha: 0.35)),
                ),
                child: Text(
                  _isProvider ? '🔧 ${t.auth.provider}' : '👤 ${t.auth.customer}',
                  style: TextStyle(
                    color: colors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: colors.card,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: colors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_needsVerify) ...[
                      Text(
                        t.auth.verifyEmail,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: colors.foreground,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        t.auth.verifySub,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(color: colors.mutedForeground),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _codeController,
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        decoration: InputDecoration(hintText: t.auth.code),
                      ),
                    ] else ...[
                      Text(
                        t.auth.signUp,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: colors.foreground,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        t.auth.signUpSub,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(color: colors.mutedForeground),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        decoration: InputDecoration(hintText: t.auth.email),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        decoration: InputDecoration(hintText: t.auth.password),
                      ),
                    ],
                    if (_formError.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        _formError,
                        style: TextStyle(color: colors.destructive, fontSize: 13),
                      ),
                    ],
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _busy
                          ? null
                          : (_needsVerify ? _verify : _submit),
                      style: FilledButton.styleFrom(
                        backgroundColor: colors.primary,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        _needsVerify ? t.auth.verify : t.auth.create,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    if (_needsVerify)
                      TextButton(
                        onPressed: _busy ? null : _resend,
                        child: Text(t.auth.resend),
                      )
                    else
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            t.auth.hasAccount,
                            style: TextStyle(color: colors.mutedForeground),
                          ),
                          TextButton(
                            onPressed: () => context.push(AppRoutes.signIn),
                            child: Text(t.auth.loginLink),
                          ),
                        ],
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
