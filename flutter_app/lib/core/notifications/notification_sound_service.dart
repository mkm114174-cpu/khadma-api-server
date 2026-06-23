import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _soundKey = 'khadma:notificationSound';

/// Notification ringtone options (persisted in SharedPreferences).
enum NotificationSoundOption {
  defaultSound('default', 'افتراضي'),
  chime('chime', 'نغمة هادئة'),
  alert('alert', 'تنبيه قوي'),
  silent('silent', 'صامت');

  const NotificationSoundOption(this.id, this.labelAr);
  final String id;
  final String labelAr;

  static NotificationSoundOption fromId(String? id) {
    return NotificationSoundOption.values.firstWhere(
      (o) => o.id == id,
      orElse: () => NotificationSoundOption.defaultSound,
    );
  }
}

class NotificationSoundService {
  NotificationSoundService(this._prefs);

  final SharedPreferences _prefs;
  final AudioPlayer _player = AudioPlayer();

  NotificationSoundOption get selected =>
      NotificationSoundOption.fromId(_prefs.getString(_soundKey));

  Future<void> setSound(NotificationSoundOption option) async {
    await _prefs.setString(_soundKey, option.id);
  }

  Future<void> play() async {
    final option = selected;
    if (option == NotificationSoundOption.silent) return;

    try {
      switch (option) {
        case NotificationSoundOption.chime:
          await _player.play(UrlSource(
            'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
          ));
          break;
        case NotificationSoundOption.alert:
          await _player.play(UrlSource(
            'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
          ));
          break;
        case NotificationSoundOption.defaultSound:
        case NotificationSoundOption.silent:
          await SystemSound.play(SystemSoundType.alert);
          break;
      }
    } catch (_) {
      await SystemSound.play(SystemSoundType.click);
    }
  }

  Future<void> preview(NotificationSoundOption option) async {
    final prev = selected;
    await setSound(option);
    await play();
    await setSound(prev);
  }

  void dispose() => _player.dispose();
}
