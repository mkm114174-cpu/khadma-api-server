import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';
import '../../core/theme/admin_theme.dart';

class MessageDetailScreen extends ConsumerStatefulWidget {
  const MessageDetailScreen({super.key, required this.messageId});

  final int messageId;

  @override
  ConsumerState<MessageDetailScreen> createState() =>
      _MessageDetailScreenState();
}

class _MessageDetailScreenState extends ConsumerState<MessageDetailScreen> {
  final _reply = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  Future<void> _resolve({bool withReply = false}) async {
    setState(() => _saving = true);
    try {
      await ref.read(adminApiProvider).updateContactMessage(
            widget.messageId,
            status: 'resolved',
            reply: withReply && _reply.text.trim().isNotEmpty
                ? _reply.text.trim()
                : null,
          );
      ref.invalidate(contactMessagesProvider);
      ref.invalidate(inboxSummaryProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذّر الحفظ: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(contactMessagesProvider);
    final fmt = DateFormat('dd/MM/yyyy HH:mm', 'ar');

    return AdminPage(
      title: 'تفاصيل الرسالة',
      child: messages.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
        error: (e, _) => Center(child: Text('$e')),
        data: (list) {
          final m = list.cast<Map<String, dynamic>?>().firstWhere(
                (x) => x!['id'] == widget.messageId,
                orElse: () => null,
              );
          if (m == null) {
            return const Center(child: Text('الرسالة غير موجودة'));
          }
          final created = DateTime.tryParse('${m['createdAt']}');
          final open = m['status'] == 'open';

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('${m['subject'] ?? 'بدون عنوان'}',
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text('${m['name']} · ${m['email'] ?? ''}',
                  style: const TextStyle(color: AdminColors.muted)),
              if (created != null)
                Text(fmt.format(created),
                    style: const TextStyle(color: AdminColors.muted, fontSize: 12)),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('${m['message']}',
                      style: const TextStyle(color: Colors.white, height: 1.6)),
                ),
              ),
              if (m['reply'] != null) ...[
                const SizedBox(height: 12),
                const Text('رد الإدارة:',
                    style: TextStyle(color: AdminColors.gold, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text('${m['reply']}',
                        style: const TextStyle(color: Colors.white, height: 1.6)),
                  ),
                ),
              ],
              if (open) ...[
                const SizedBox(height: 20),
                TextField(
                  controller: _reply,
                  maxLines: 4,
                  textAlign: TextAlign.right,
                  decoration: const InputDecoration(
                    labelText: 'ردك (يُحفظ مع الرسالة)',
                    alignLabelWithHint: true,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _saving ? null : () => _resolve(),
                        child: const Text('إغلاق بدون رد'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton(
                        onPressed: _saving ? null : () => _resolve(withReply: true),
                        style: FilledButton.styleFrom(
                          backgroundColor: AdminColors.gold,
                          foregroundColor: Colors.black,
                        ),
                        child: _saving
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('إرسال وإغلاق'),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
