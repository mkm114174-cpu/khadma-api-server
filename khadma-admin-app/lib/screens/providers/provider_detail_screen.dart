import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/admin_api.dart';
import '../../core/theme/admin_theme.dart';
import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';
import '../../widgets/authed_image.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/status_chip.dart' show formatDate;

class ProviderDetailScreen extends ConsumerStatefulWidget {
  const ProviderDetailScreen({super.key, required this.providerId});

  final int providerId;

  @override
  ConsumerState<ProviderDetailScreen> createState() => _ProviderDetailScreenState();
}

class _ProviderDetailScreenState extends ConsumerState<ProviderDetailScreen> {
  final _rejectNote = TextEditingController();
  final _infoMsg = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _rejectNote.dispose();
    _infoMsg.dispose();
    super.dispose();
  }

  Future<void> _updateStatus(String status, {String? reviewNote}) async {
    setState(() => _busy = true);
    try {
      await ref.read(adminApiProvider).updateProvider(widget.providerId, {
        'status': status,
        if (reviewNote != null) 'reviewNote': reviewNote,
      });
      ref.invalidate(providerDetailProvider(widget.providerId));
      ref.invalidate(providersProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _requestInfo() async {
    final msg = _infoMsg.text.trim();
    if (msg.length < 3) return;
    setState(() => _busy = true);
    try {
      await ref.read(adminApiProvider).requestProviderInfo(widget.providerId, msg);
      ref.invalidate(providerDetailProvider(widget.providerId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم إرسال طلب المعلومات')),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = ref.watch(providerDetailProvider(widget.providerId));
    final api = ref.watch(adminApiProvider);

    return AdminPage(
      title: 'تفاصيل المزوّد',
      child: p.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
        error: (e, _) => Center(child: Text('$e')),
        data: (data) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Row(
                children: [
                  Text('${data['name'] ?? '—'}',
                      style: const TextStyle(
                          color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 8),
                  StatusChip(status: '${data['status']}'),
                ],
              ),
              const SizedBox(height: 8),
              _row('الهاتف', '${data['phone'] ?? '—'}'),
              _row('المدينة', '${data['city'] ?? '—'}'),
              _row('العنوان', '${data['addressText'] ?? '—'}'),
              _row('الخدمة', '${data['serviceType'] ?? '—'}'),
              _row('التقييم', '${data['rating']} (${data['ratingCount']} تقييم)'),
              _row('تاريخ التسجيل', formatDate(data['createdAt'])),
              if (data['bio'] != null) ...[
                const SizedBox(height: 12),
                const Text('الخبرة', style: TextStyle(color: AdminColors.gold, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('${data['bio']}', style: const TextStyle(color: Colors.white70, height: 1.5)),
              ],
              const SizedBox(height: 16),
              const Text('المستندات', style: TextStyle(color: AdminColors.gold, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (data['docOsekPaturPath'] != null)
                _doc(api, 'osek_patur', 'עוסק פטור'),
              if (data['docOsekMurshePath'] != null)
                _doc(api, 'osek_murshe', 'עוסק מורשה'),
              if (data['docIdPath'] != null) _doc(api, 'id', 'هوية / رخصة'),
              const SizedBox(height: 20),
              if (data['status'] != 'approved' && data['status'] != 'rejected') ...[
                FilledButton.icon(
                  onPressed: _busy ? null : () => _updateStatus('approved'),
                  icon: const Icon(Icons.check),
                  label: const Text('قبول'),
                  style: FilledButton.styleFrom(
                    backgroundColor: AdminColors.success,
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _rejectNote,
                  decoration: const InputDecoration(labelText: 'سبب الرفض (اختياري)'),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _busy ? null : () => _updateStatus('rejected', reviewNote: _rejectNote.text.trim()),
                  icon: const Icon(Icons.close, color: AdminColors.danger),
                  label: const Text('رفض', style: TextStyle(color: AdminColors.danger)),
                  style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _infoMsg,
                  decoration: const InputDecoration(labelText: 'طلب معلومات إضافية'),
                ),
                const SizedBox(height: 8),
                OutlinedButton(
                  onPressed: _busy ? null : _requestInfo,
                  child: const Text('إرسال طلب معلومات'),
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _row(String k, String v) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 90,
              child: Text(k, style: const TextStyle(color: AdminColors.muted, fontSize: 13)),
            ),
            Expanded(child: Text(v, style: const TextStyle(color: Colors.white))),
          ],
        ),
      );

  Widget _doc(AdminApi api, String kind, String label) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: AuthedImage(url: api.providerDocumentUrl(widget.providerId, kind), height: 200),
            ),
          ],
        ),
      );
}
