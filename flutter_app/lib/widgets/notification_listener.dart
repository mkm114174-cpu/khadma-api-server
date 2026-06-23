import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/notifications/notification_sound_service.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_providers.dart';
import '../providers/theme_provider.dart';

/// Polls notifications while logged in and plays sound on new unread items.
class KhadmaNotificationWatcher extends ConsumerStatefulWidget {
  const KhadmaNotificationWatcher({super.key, required this.child});

  final Widget child;

  @override
  ConsumerState<KhadmaNotificationWatcher> createState() =>
      _KhadmaNotificationWatcherState();
}

class _KhadmaNotificationWatcherState extends ConsumerState<KhadmaNotificationWatcher>
    with WidgetsBindingObserver {
  Timer? _timer;
  int _lastUnread = 0;
  NotificationSoundService? _sounds;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _sounds = NotificationSoundService(ref.read(sharedPreferencesProvider));
    _startPolling();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _sounds?.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _poll();
    }
  }

  void _startPolling() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 25), (_) => _poll());
    WidgetsBinding.instance.addPostFrameCallback((_) => _poll());
  }

  Future<void> _poll() async {
    final auth = ref.read(authProvider);
    if (auth.status != AuthStatus.ready) return;
    ref.invalidate(notificationsProvider);
    final list = await ref.read(notificationsProvider.future);
    final unread = list.where((n) => !n.isRead).length;
    if (_lastUnread == 0) {
      _lastUnread = unread;
      return;
    }
    if (unread > _lastUnread) {
      await _sounds?.play();
    }
    _lastUnread = unread;
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
