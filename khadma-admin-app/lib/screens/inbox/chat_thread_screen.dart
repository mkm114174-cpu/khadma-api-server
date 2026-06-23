import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../providers/admin_providers.dart';
import '../../widgets/admin_drawer.dart';
import '../../core/theme/admin_theme.dart';

final chatThreadProvider = FutureProvider.family<List<Map<String, dynamic>>,
    ({int requestId, int providerId})>((ref, params) async {
  return ref.watch(adminApiProvider).listChatMessages(
        requestId: params.requestId,
        providerId: params.providerId,
      );
});

class ChatThreadScreen extends ConsumerStatefulWidget {
  const ChatThreadScreen({
    super.key,
    required this.requestId,
    required this.providerId,
  });

  final int requestId;
  final int providerId;

  @override
  ConsumerState<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends ConsumerState<ChatThreadScreen> {
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _poll = Timer.periodic(const Duration(seconds: 15), (_) {
      ref.invalidate(
        chatThreadProvider((
          requestId: widget.requestId,
          providerId: widget.providerId,
        )),
      );
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final params = (requestId: widget.requestId, providerId: widget.providerId);
    final messages = ref.watch(chatThreadProvider(params));
    final fmt = DateFormat('HH:mm', 'ar');

    return AdminPage(
      title: 'محادثة #${widget.requestId}',
      child: messages.when(
        loading: () =>
            const Center(child: CircularProgressIndicator(color: AdminColors.gold)),
        error: (e, _) => Center(child: Text('$e')),
        data: (list) {
          if (list.isEmpty) {
            return const Center(
              child: Text('لا توجد رسائل في هذه المحادثة',
                  style: TextStyle(color: AdminColors.muted)),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            itemBuilder: (_, i) {
              final m = list[i];
              final at = DateTime.tryParse('${m['createdAt']}');
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: AdminColors.gold.withValues(alpha: 0.2),
                      child: Text(
                        '${'${m['senderName'] ?? '?'}'.characters.first}',
                        style: const TextStyle(
                            color: AdminColors.gold, fontSize: 12),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${m['senderName'] ?? 'مستخدم'}',
                              style: const TextStyle(
                                  color: AdminColors.gold,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12)),
                          const SizedBox(height: 4),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AdminColors.card,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AdminColors.border),
                            ),
                            child: Text('${m['body']}',
                                style: const TextStyle(
                                    color: Colors.white, height: 1.5)),
                          ),
                          if (at != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(fmt.format(at),
                                  style: const TextStyle(
                                      color: AdminColors.muted, fontSize: 10)),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}
