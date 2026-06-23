import { useEffect } from "react";
import { AppState } from "react-native";

import { pingPresence } from "@workspace/api-client-react";

/**
 * Periodically reports that the signed-in user is active so the admin
 * dashboard can show a live "active in the last few minutes" count.
 *
 * Pings on mount, whenever the app returns to the foreground, and on a slow
 * interval while foregrounded. The server throttles writes, so an over-eager
 * client never hammers the DB. Errors are swallowed — presence is best-effort.
 */
export function usePresenceHeartbeat(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const ping = () => {
      void pingPresence().catch(() => {});
    };

    ping();
    const interval = setInterval(ping, 90_000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") ping();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [enabled]);
}
