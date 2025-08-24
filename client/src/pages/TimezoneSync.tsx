// TimezoneSync.tsx
import { useUserContext } from "@/contexts/UserContext";
import { trpc } from "@/utils/trpc";
import { useEffect } from "react";

function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="))
    ?.split("=")[1];
}

export function TimezoneSync({ daysBetweenChecks = 14 }: { daysBetweenChecks?: number }) {
  const {username} = useUserContext();
  const updateTimezone = trpc.users.updateTimezone.useMutation()

  useEffect(() => {

    if (!username) return;

    // Figure out browser tz
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Compare to cookie
    const cookieRaw = getCookie("tz");
    const cookieTz = cookieRaw ? decodeURIComponent(cookieRaw) : undefined;

    // light “staleness” gate so we eventually re-sync
    const lastSyncStr = localStorage.getItem("tz:lastSyncAt");
    const lastSyncAt = lastSyncStr ? new Date(lastSyncStr) : null;
    const now = new Date();
    const stale =
      !lastSyncAt ||
      now.getTime() - lastSyncAt.getTime() > daysBetweenChecks * 24 * 60 * 60 * 1000;

    const missing = !cookieTz;
    const changed = cookieTz !== browserTz;

    if (!(missing || changed || stale)) return;

    updateTimezone.mutate({username, timezone: browserTz})
    document.cookie = `tz=${encodeURIComponent(browserTz)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}`;

  }, [daysBetweenChecks]);

  return null;
}
