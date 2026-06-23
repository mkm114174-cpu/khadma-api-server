import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../constants/service_sections.dart';
import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';

class ServiceEditScreen extends ConsumerStatefulWidget {
  const ServiceEditScreen({super.key, required this.skillId});

  final int skillId;

  @override
  ConsumerState<ServiceEditScreen> createState() => _ServiceEditScreenState();
}

class _ServiceEditScreenState extends ConsumerState<ServiceEditScreen> {
  final _name = TextEditingController();
  final _nameEn = TextEditingController();
  final _nameHe = TextEditingController();
  final _slug = TextEditingController();
  final _desc = TextEditingController();
  String? _category;
  String? _imagePath;
  String? _status;
  bool _loading = true;
  bool _saving = false;
  bool _isNew = false;

  @override
  void initState() {
    super.initState();
    _isNew = widget.skillId == 0;
    if (!_isNew) _load();
    else setState(() => _loading = false);
  }

  Future<void> _load() async {
    try {
      final s = await ref.read(adminApiProvider).getSkill(widget.skillId);
      _name.text = '${s['name'] ?? ''}';
      _nameEn.text = '${s['nameEn'] ?? ''}';
      _nameHe.text = '${s['nameHe'] ?? ''}';
      _slug.text = '${s['slug'] ?? ''}';
      _desc.text = '${s['description'] ?? ''}';
      _category = s['category'] as String?;
      _imagePath = s['image'] as String?;
      _status = s['status'] as String?;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  void dispose() {
    _name.dispose();
    _nameEn.dispose();
    _nameHe.dispose();
    _slug.dispose();
    _desc.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    final upload = ref.read(uploadServiceProvider);
    final path = await upload.uploadFile(
      filePath: file.path,
      fileName: 'skill-${DateTime.now().millisecondsSinceEpoch}.jpg',
      contentType: 'image/jpeg',
    );
    setState(() => _imagePath = path);
  }

  Future<void> _save({String? newStatus}) async {
    if (_name.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      final body = {
        'name': _name.text.trim(),
        'nameEn': _nameEn.text.trim(),
        'nameHe': _nameHe.text.trim(),
        'description': _desc.text.trim(),
        if (_category != null) 'category': _category,
        if (_imagePath != null) 'image': _imagePath,
        if (newStatus != null) 'status': newStatus,
      };
      if (_isNew) {
        await ref.read(adminApiProvider).createSkill({
          'name': _name.text.trim(),
          'slug': _slug.text.trim().isNotEmpty
              ? _slug.text.trim()
              : _name.text.trim().replaceAll(' ', '-'),
          if (_category != null) 'category': _category,
        });
      } else {
        await ref.read(adminApiProvider).updateSkill(widget.skillId, body);
      }
      ref.invalidate(skillsProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete() async {
    if (_isNew) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('حذف الخدمة؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('إلغاء')),
          TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('حذف')),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(adminApiProvider).deleteSkill(widget.skillId);
    ref.invalidate(skillsProvider);
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const AdminPage(
        title: 'تحرير خدمة',
        child: Center(child: CircularProgressIndicator(color: AdminColors.gold)),
      );
    }

    return AdminPage(
      title: _isNew ? 'خدمة جديدة' : 'تحرير خدمة',
      actions: [
        if (!_isNew)
          IconButton(icon: const Icon(Icons.delete, color: AdminColors.danger), onPressed: _delete),
      ],
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _field('الاسم (عربي)', _name),
          _field('الاسم (إنجليزي)', _nameEn),
          _field('الاسم (عبري)', _nameHe),
          if (_isNew) _field('Slug', _slug),
          _field('الوصف', _desc, maxLines: 3),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _category,
            decoration: const InputDecoration(labelText: 'القسم'),
            items: kServiceSections
                .map((s) => DropdownMenuItem(value: s['id'], child: Text(s['label']!)))
                .toList(),
            onChanged: (v) => setState(() => _category = v),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pickImage,
            icon: const Icon(Icons.upload, color: AdminColors.gold),
            label: Text(_imagePath != null ? 'تم رفع الصورة' : 'رفع صورة الخدمة'),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : () => _save(),
            style: FilledButton.styleFrom(
              backgroundColor: AdminColors.gold,
              foregroundColor: Colors.black,
              minimumSize: const Size.fromHeight(48),
            ),
            child: Text(_saving ? '...' : 'حفظ'),
          ),
          if (!_isNew && _status == 'pending') ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: _saving ? null : () => _save(newStatus: 'approved'),
                    style: FilledButton.styleFrom(backgroundColor: AdminColors.success),
                    child: const Text('اعتماد'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _saving ? null : () => _save(newStatus: 'rejected'),
                    child: const Text('رفض', style: TextStyle(color: AdminColors.danger)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController c, {int maxLines = 1}) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
          controller: c,
          maxLines: maxLines,
          decoration: InputDecoration(labelText: label),
        ),
      );
}
