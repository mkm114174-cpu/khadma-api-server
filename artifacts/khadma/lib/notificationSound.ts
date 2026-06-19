import { createAudioPlayer, type AudioPlayer } from "expo-audio";

// A single shared player for the notification chime. Created lazily so the
// asset is only loaded once the first notification needs to play.
let player: AudioPlayer | null = null;

export function playNotificationSound(): void {
  try {
    if (!player) {
      player = createAudioPlayer(require("../assets/sounds/notification.wav"));
    }
    // Rewind so rapid consecutive notifications each play from the start.
    void player.seekTo(0);
    player.play();
  } catch {
    // Audio is a non-critical enhancement (e.g. blocked by web autoplay
    // policy before the first user gesture) — never let it break the app.
  }
}
