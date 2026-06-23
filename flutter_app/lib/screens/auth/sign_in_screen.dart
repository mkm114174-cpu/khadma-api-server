import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/auth/neon_auth_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';
import '../../router/app_router.dart';
import '../../widgets/logo_icon.dart';

/// Sign-in screen — ported from app/(auth)/sign-in.tsx
class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _formError = '';
  bool _busy = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final t = ref.read(appStringsProvider);
    setState(() {
      _formError = '';
      _busy = true;
    });

    try {
      final auth = ref.read(neonAuthServiceProvider);
      final result = await auth.signInWithEmail(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!result.success) {
        setState(() => _formError = t.auth.loginFailed);
        return;
      }

      await ref.read(authProvider.notifier).finalizeAuthAfterLogin();
    } catch (_) {
      setState(() => _formError = t.auth.loginFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
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
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                t.auth.welcomeBack,
                style: TextStyle(fontSize: 16, color: colors.mutedForeground),
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
                    Text(
                      t.auth.signIn,
                      textAlign: isRtl ? TextAlign.right : TextAlign.left,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: colors.foreground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      t.auth.signInSub,
                      textAlign: isRtl ? TextAlign.right : TextAlign.left,
                      style: TextStyle(fontSize: 15, color: colors.mutedForeground),
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
                    if (_formError.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        _formError,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(color: colors.destructive, fontSize: 13),
                      ),
                    ],
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _busy ? null : _handleSubmit,
                      style: FilledButton.styleFrom(
                        backgroundColor: colors.primary,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        t.auth.signIn,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: Divider(color: colors.border)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            t.auth.or,
                            style: TextStyle(
                              fontSize: 13,
                              color: colors.mutedForeground,
                            ),
                          ),
                        ),
                        Expanded(child: Divider(color: colors.border)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () {
                        // Google OAuth — requires platform-specific setup
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(t.auth.signInGoogle)),
                        );
                      },
                      icon: const Icon(Icons.g_mobiledata, size: 28),
                      label: Text(t.auth.signInGoogle),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          t.auth.noAccount,
                          style: TextStyle(
                            color: colors.mutedForeground,
                            fontSize: 14,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.push(AppRoutes.signUp),
                          child: Text(
                            t.auth.signUp,
                            style: TextStyle(
                              color: colors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
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
