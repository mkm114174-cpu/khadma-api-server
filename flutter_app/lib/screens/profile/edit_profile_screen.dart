import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/phone.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authProvider);
    _nameController.text = auth.name;
    _phoneController.text = auth.phone;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final isRtl = ref.read(isRtlProvider);
    final name = _nameController.text.trim();
    final phone = normalizeIlPhone(_phoneController.text);

    if (name.length < 2) {
      setState(() => _error = isRtl ? 'الاسم قصير جداً' : 'Name too short');
      return;
    }
    if (phone == null) {
      setState(() => _error = isRtl ? 'رقم الهاتف غير صالح' : 'Invalid phone');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await ref.read(authProvider.notifier).updateProfile(name: name, phone: phone);
      if (mounted) context.pop();
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = isRtl ? 'تعذّر الحفظ' : 'Save failed';
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRtl = ref.watch(isRtlProvider);

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkBg,
        foregroundColor: Colors.white,
        title: Text(isRtl ? 'تعديل الحساب' : 'Edit profile'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            TextField(
              controller: _nameController,
              textAlign: isRtl ? TextAlign.right : TextAlign.left,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: isRtl ? 'الاسم' : 'Name',
                labelStyle: const TextStyle(color: AppColors.gold),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
                ),
                focusedBorder: const OutlineInputBorder(
                  borderSide: BorderSide(color: AppColors.gold),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              textAlign: isRtl ? TextAlign.right : TextAlign.left,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: isRtl ? 'رقم الهاتف' : 'Phone',
                labelStyle: const TextStyle(color: AppColors.gold),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.15)),
                ),
                focusedBorder: const OutlineInputBorder(
                  borderSide: BorderSide(color: AppColors.gold),
                ),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.redAccent)),
            ],
            const Spacer(),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                    )
                  : const Icon(FeatherIcons.check),
              label: Text(isRtl ? 'حفظ' : 'Save'),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
