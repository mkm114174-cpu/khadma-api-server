import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/env.dart';
import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _email = TextEditingController();
  final _code = TextEditingController();
  bool _busy = false;
  bool _codeSent = false;
  String? _loginToken;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _email.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    setState(() {
      _busy = true;
      _error = null;
      _info = null;
    });
    try {
      final token = await ref
          .read(clerkAuthProvider)
          .sendEmailCode(email: _email.text.trim());
      setState(() {
        _loginToken = token;
        _codeSent = true;
        _info = 'تم إرسال الكود إلى ${ _email.text.trim() }';
        _code.clear();
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verifyCode() async {
    final token = _loginToken;
    if (token == null) return;

    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(clerkAuthProvider).verifyEmailCode(
            loginToken: token,
            code: _code.text.trim(),
          );
      ref.invalidate(authTokenProvider);
      ref.invalidate(adminUserProvider);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _backToEmail() {
    setState(() {
      _codeSent = false;
      _loginToken = null;
      _code.clear();
      _error = null;
      _info = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AdminColors.gold.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.admin_panel_settings,
                      color: AdminColors.gold,
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'خدما — الأدمن',
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'إدارة المنصة الكاملة',
                    style: TextStyle(color: AdminColors.muted),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'النسخة v1.0.3 — ${Env.apiDomain}',
                    style: const TextStyle(color: AdminColors.muted, fontSize: 11),
                  ),
                  const SizedBox(height: 32),
                  if (!_codeSent) ...[
                    TextField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      textAlign: TextAlign.right,
                      enabled: !_busy,
                      decoration: const InputDecoration(
                        labelText: 'البريد الإلكتروني',
                        hintText: 'أدخل إيميل الأدمن',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'سنرسل لك كوداً من 6 أرقام على الإيميل',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AdminColors.muted, fontSize: 13),
                    ),
                  ] else ...[
                    TextField(
                      controller: _code,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      maxLength: 6,
                      enabled: !_busy,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      style: const TextStyle(
                        fontSize: 28,
                        letterSpacing: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: const InputDecoration(
                        labelText: 'كود التحقق',
                        hintText: '000000',
                        counterText: '',
                        prefixIcon: Icon(Icons.pin_outlined),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _busy ? null : _backToEmail,
                      child: const Text('تغيير الإيميل'),
                    ),
                  ],
                  if (_info != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _info!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AdminColors.gold, fontSize: 13),
                    ),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AdminColors.danger),
                    ),
                  ],
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _busy
                          ? null
                          : (_codeSent ? _verifyCode : _sendCode),
                      style: FilledButton.styleFrom(
                        backgroundColor: AdminColors.gold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _busy
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              _codeSent ? 'تأكيد الدخول' : 'إرسال الكود',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                  if (_codeSent) ...[
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: _busy ? null : _sendCode,
                      child: const Text('إعادة إرسال الكود'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
