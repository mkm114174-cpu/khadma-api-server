import 'package:flutter/material.dart';
import 'package:flutter_feather_icons/flutter_feather_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/language_provider.dart';
import '../providers/request_providers.dart';

/// زر محادثة الدعم — يرسل رسالة إلى الأدمن (نفس API تواصل معنا).
class SupportChatFab extends ConsumerStatefulWidget {
  const SupportChatFab({super.key, this.bottomOffset = 0});

  final double bottomOffset;

  @override
  ConsumerState<SupportChatFab> createState() => _SupportChatFabState();
}

class _SupportChatFabState extends ConsumerState<SupportChatFab> {
  bool _open = false;
  final _input = TextEditingController();
  final _scroll = ScrollController();
  bool _sending = false;
  final _messages = <_ChatMsg>[];

  @override
  void initState() {
    super.initState();
    _messages.add(_ChatMsg(
      fromSupport: true,
      text: 'أهلاً! كيف يمكنني مساعدتك اليوم؟ 👋',
      time: _now(),
    ));
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  String _now() {
    final d = DateTime.now();
    return '${d.hour}:${d.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;
    final isRtl = ref.read(isRtlProvider);
    setState(() {
      _sending = true;
      _messages.add(_ChatMsg(fromSupport: false, text: text, time: _now()));
      _input.clear();
    });
    await Future<void>.delayed(const Duration(milliseconds: 100));
    _scroll.jumpTo(_scroll.position.maxScrollExtent);

    final auth = ref.read(authProvider);
    final name = auth.name.isNotEmpty ? auth.name : 'مستخدم التطبيق';
    try {
      await ref.read(khadmaApiProvider).sendContactMessage(
            name: name,
            email: auth.user?.email,
            subject: 'محادثة الدعم (التطبيق)',
            message: text,
          );
      if (mounted) {
        setState(() {
          _messages.add(_ChatMsg(
            fromSupport: true,
            text: 'تم استلام رسالتك ووصلت إلى الإدارة. سنرد عليك قريباً. 🙏',
            time: _now(),
          ));
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _messages.add(_ChatMsg(
            fromSupport: true,
            text: isRtl
                ? 'تعذّر الإرسال. تحقق من الاتصال وحاول مجدداً.'
                : 'Failed to send. Check connection.',
            time: _now(),
          ));
        });
      }
    } finally {
      if (mounted) setState(() => _sending = false);
      await Future<void>.delayed(const Duration(milliseconds: 100));
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        if (_open)
          Positioned.fill(
            child: GestureDetector(
              onTap: () => setState(() => _open = false),
              child: Container(color: Colors.black54),
            ),
          ),
        if (_open)
          Positioned(
            left: 16,
            right: 16,
            bottom: widget.bottomOffset + 80,
            top: 120,
            child: Material(
              color: const Color(0xFF161616),
              borderRadius: BorderRadius.circular(20),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        const Icon(FeatherIcons.messageCircle,
                            color: AppColors.gold),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'دعم خدما',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => setState(() => _open = false),
                          icon: const Icon(Icons.close, color: Colors.white54),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: Colors.white12),
                  Expanded(
                    child: ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.all(12),
                      itemCount: _messages.length,
                      itemBuilder: (_, i) {
                        final m = _messages[i];
                        return Align(
                          alignment: m.fromSupport
                              ? Alignment.centerRight
                              : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                            constraints: BoxConstraints(
                              maxWidth: MediaQuery.sizeOf(context).width * 0.7,
                            ),
                            decoration: BoxDecoration(
                              color: m.fromSupport
                                  ? Colors.white.withValues(alpha: 0.08)
                                  : AppColors.gold.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(m.text,
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 14)),
                          ),
                        );
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _input,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: 'اكتب رسالتك...',
                              hintStyle: const TextStyle(color: Colors.white38),
                              filled: true,
                              fillColor: Colors.white.withValues(alpha: 0.06),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(24),
                                borderSide: BorderSide.none,
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 10),
                            ),
                            onSubmitted: (_) => _send(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.filled(
                          onPressed: _sending ? null : _send,
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.black,
                          ),
                          icon: _sending
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child:
                                      CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(FeatherIcons.send, size: 18),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        Positioned(
          right: 16,
          bottom: widget.bottomOffset + 16,
          child: FloatingActionButton(
            onPressed: () => setState(() => _open = !_open),
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.black,
            child: Icon(_open ? FeatherIcons.x : FeatherIcons.messageCircle),
          ),
        ),
      ],
    );
  }
}

class _ChatMsg {
  _ChatMsg({
    required this.fromSupport,
    required this.text,
    required this.time,
  });

  final bool fromSupport;
  final String text;
  final String time;
}
