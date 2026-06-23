import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/language_provider.dart';

class ContactScreen extends ConsumerStatefulWidget {
  const ContactScreen({super.key});

  @override
  ConsumerState<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends ConsumerState<ContactScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _subject = TextEditingController();
  final _message = TextEditingController();
  bool _sending = false;
  bool _sent = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = ref.read(authProvider);
      if (auth.name.isNotEmpty) _name.text = auth.name;
      if (auth.user?.email != null && auth.user!.email!.isNotEmpty) {
        _email.text = auth.user!.email!;
      }
    });
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _subject.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final isRtl = ref.read(isRtlProvider);
    if (_name.text.trim().isEmpty || _message.text.trim().isEmpty) {
      setState(() => _error = isRtl ? 'الاسم والرسالة مطلوبان' : 'Name and message required');
      return;
    }
    setState(() {
      _error = null;
      _sending = true;
    });
    try {
      await ref.read(khadmaApiProvider).sendContactMessage(
            name: _name.text.trim(),
            email: _email.text.trim().isEmpty ? null : _email.text.trim(),
            subject: _subject.text.trim().isEmpty ? null : _subject.text.trim(),
            message: _message.text.trim(),
          );
      if (mounted) setState(() => _sent = true);
    } catch (_) {
      if (mounted) {
        setState(() => _error = isRtl ? 'تعذّر الإرسال، حاول لاحقاً' : 'Failed to send');
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(appStringsProvider);
    final isRtl = ref.watch(isRtlProvider);
    final align = isRtl ? TextAlign.right : TextAlign.left;

    if (_sent) {
      return Scaffold(
        backgroundColor: AppColors.darkBg,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(FeatherIcons.checkCircle, size: 64, color: Color(0xFF4CAF50)),
                  const SizedBox(height: 16),
                  Text(
                    isRtl ? 'تم الإرسال' : 'Message sent',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    isRtl
                        ? 'شكراً لتواصلك. سنرد عليك قريباً.'
                        : 'Thanks! We will get back to you soon.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white60),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: () => context.pop(),
                    style: FilledButton.styleFrom(backgroundColor: AppColors.gold),
                    child: Text(t.auth.back),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkBg,
        foregroundColor: Colors.white,
        title: Text(t.role.contact),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.gold.withValues(alpha: 0.15),
              ),
              child: const Icon(FeatherIcons.messageCircle, color: AppColors.gold, size: 32),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            t.role.contactSub,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white60),
          ),
          const SizedBox(height: 24),
          _field(isRtl ? 'الاسم' : 'Name', _name, align),
          const SizedBox(height: 12),
          _field(isRtl ? 'البريد (اختياري)' : 'Email (optional)', _email, align),
          const SizedBox(height: 12),
          _field(isRtl ? 'الموضوع (اختياري)' : 'Subject (optional)', _subject, align),
          const SizedBox(height: 12),
          _field(isRtl ? 'الرسالة' : 'Message', _message, align, maxLines: 5),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: Colors.redAccent)),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _sending ? null : _submit,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: _sending
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(isRtl ? 'إرسال' : 'Send'),
          ),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController c, TextAlign align, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(label, style: const TextStyle(color: AppColors.gold, fontSize: 13)),
        const SizedBox(height: 6),
        TextField(
          controller: c,
          maxLines: maxLines,
          textAlign: align,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white.withValues(alpha: 0.06),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }
}
