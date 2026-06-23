import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../l10n/app_locale.dart';
import '../../models/user.dart';
import '../../router/app_router.dart';
import '../../screens/auth/provider_onboarding_screen.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../../providers/theme_provider.dart';
import '../../widgets/logo_icon.dart';

/// Customer: name only (role already chosen on role screen).
/// Provider: falls through to provider onboarding fields.
class CompleteProfileScreen extends ConsumerStatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  ConsumerState<CompleteProfileScreen> createState() =>
      _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends ConsumerState<CompleteProfileScreen> {
  final _nameController = TextEditingController();
  String _role = 'customer';
  bool _roleLoaded = false;
  bool _submitting = false;
  bool _commissionAgreed = false;
  String? _error;
  String? _email;

  @override
  void initState() {
    super.initState();
    _loadRole();
  }

  Future<void> _loadRole() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString('khadma:intendedRole');
    final pendingEmail = prefs.getString('khadma:pendingEmail');
    if (stored == 'provider' || stored == 'customer') {
      _role = stored!;
    }
    if (pendingEmail != null && pendingEmail.isNotEmpty) {
      _email = pendingEmail;
      _nameController.text = pendingEmail.split('@').first;
    }
    if (mounted) {
      setState(() => _roleLoaded = true);
      if (_role == 'provider') {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) context.go(AppRoutes.providerSkills);
        });
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final t = ref.read(appStringsProvider);
    final name = _nameController.text.trim();

    if (name.length < 2) {
      setState(() => _error = t.auth.nameError);
      return;
    }

    if (_role == 'provider' && !_commissionAgreed) {
      setState(() => _error = t.auth.commissionAgree);
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final locale = ref.read(languageProvider);
      await ref.read(authProvider.notifier).provision(
            ProvisionInput(
              name: name,
              role: _role,
              email: _email,
              language: locale.code,
              commissionAgreed: _role == 'provider' ? true : null,
            ),
          );
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('khadma:intendedRole');
      await prefs.remove('khadma:pendingEmail');
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = t.auth.provisionError;
          _submitting = false;
        });
      }
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final colors = ref.watch(appColorsProvider);
    final isRtl = ref.watch(isRtlProvider);

    ref.listen(authProvider, (prev, next) {
      if (prev?.status != AuthStatus.ready && next.status == AuthStatus.ready) {
        final role = next.role;
        if (role == AppRole.provider) {
          context.go(AppRoutes.providerSkills);
        } else {
          context.go(AppRoutes.tabs);
        }
      }
    });

    if (!_roleLoaded) {
      return Scaffold(
        backgroundColor: colors.background,
        body: Center(child: CircularProgressIndicator(color: colors.primary)),
      );
    }

    final isCustomer = _role == 'customer';

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: SingleChildScrollView(
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
              Text(
                isCustomer ? t.auth.fullName : t.auth.completeProfile,
                style: TextStyle(color: colors.mutedForeground),
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
                    if (!isCustomer) ...[
                      Text(
                        t.auth.howToUse,
                        textAlign: isRtl ? TextAlign.right : TextAlign.left,
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: colors.foreground,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    Text(
                      t.auth.fullName,
                      textAlign: isRtl ? TextAlign.right : TextAlign.left,
                      style: TextStyle(
                        color: colors.mutedForeground,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _nameController,
                      textAlign: isRtl ? TextAlign.right : TextAlign.left,
                      decoration: InputDecoration(hintText: t.auth.namePlaceholder),
                    ),
                    if (_role == 'provider') ...[
                      const SizedBox(height: 12),
                      CheckboxListTile(
                        value: _commissionAgreed,
                        onChanged: (v) =>
                            setState(() => _commissionAgreed = v ?? false),
                        title: Text(
                          t.auth.commissionAgree,
                          style: TextStyle(color: colors.foreground, fontSize: 14),
                        ),
                        controlAffinity: ListTileControlAffinity.leading,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        _error!,
                        style: TextStyle(color: colors.destructive, fontSize: 13),
                      ),
                    ],
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _submitting ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: colors.primary,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        _submitting ? t.auth.saving : t.auth.continueBtn,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () => ref.read(authProvider.notifier).logout(),
                      child: Text(t.auth.logout),
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
