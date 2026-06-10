/**
 * Shared room/session helpers for multiplayer games.
 * Prioritizes URL room_id over storage (fixes iOS router.query race + ITP cookie issues).
 */

export const GAME_KEYS = {
  MAKE_IT_MEME: "make_it_meme",
  CAH: "cards_against_humanity",
  PB_GAMES: "pb_games",
  WHO_SAID_IT: "who_said_it",
};

export function getBackendUrl() {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_URL !== undefined
      ? process.env.NEXT_PUBLIC_BACKEND_URL
      : "http://localhost:8000";
  return raw.replace(/\/$/, "");
}

export function getWsBaseUrl() {
  const backend = getBackendUrl();
  const raw = process.env.NEXT_PUBLIC_WS_BASE_URL || backend;
  return raw
    .replace(/^http:\/\//, "ws://")
    .replace(/^https:\/\//, "wss://")
    .replace(/\/$/, "");
}

export function storageKeyForRoom(gameKey) {
  return `room_id_${gameKey}`;
}

export function getRoomIdFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("room_id");
}

/**
 * Resolve room ID: URL param > Next router query > per-game storage > legacy shared key.
 */
export function resolveRoomId(gameKey, queryRoomId = null) {
  const fromUrl = getRoomIdFromUrl();
  if (fromUrl) return String(fromUrl);
  if (queryRoomId) return String(queryRoomId);
  try {
    const perGame = localStorage.getItem(storageKeyForRoom(gameKey));
    if (perGame) return perGame;
    const legacy = localStorage.getItem("room_id");
    if (legacy) return legacy;
  } catch {
    // Safari private mode, in-app browsers
  }
  return null;
}

export function persistRoomId(gameKey, roomId) {
  if (!roomId) return;
  const id = String(roomId);
  try {
    localStorage.setItem(storageKeyForRoom(gameKey), id);
  } catch {
    // ignore
  }
  syncRoomIdToUrl(id);
}

export function syncRoomIdToUrl(roomId) {
  if (typeof window === "undefined" || !roomId) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("room_id") === String(roomId)) return;
  params.set("room_id", String(roomId));
  const qs = params.toString();
  window.history.replaceState(
    {},
    "",
    qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  );
}

export function getOrCreateClientId() {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem("client_id");
    if (!id) {
      if (window.crypto && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
          (
            c ^
            (window.crypto && crypto.getRandomValues
              ? crypto.getRandomValues(new Uint8Array(1))[0]
              : Math.random() * 16) &
            (15 >> (c / 4))
          ).toString(16)
        );
      }
      localStorage.setItem("client_id", id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Headers that identify the player and room without relying on cookies (ITP-safe). */
export function roomHeaders(clientId, roomId, extra = {}) {
  const headers = { ...extra };
  if (clientId) headers["x-client-id"] = clientId;
  if (roomId) headers["x-room-id"] = String(roomId);
  return headers;
}

/** Full page navigation — more reliable than router.push on mobile Safari. */
export function navigateToRoom(path, roomId) {
  window.location.href = `${path}?room_id=${encodeURIComponent(roomId)}`;
}

/** Poll game status over HTTP (works when WebSocket is down or tab was backgrounded). */
export async function fetchGameStatus(statusUrl, clientId, roomId) {
  const res = await fetch(statusUrl, {
    credentials: "include",
    headers: roomHeaders(clientId, roomId),
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * When user returns to the tab (iOS/Android), resync immediately.
 * Returns cleanup function.
 */
export function onPageVisible(callback) {
  if (typeof document === "undefined") return () => {};
  const run = () => {
    if (!document.hidden) callback();
  };
  document.addEventListener("visibilitychange", run);
  window.addEventListener("focus", run);
  window.addEventListener("pageshow", run);
  return () => {
    document.removeEventListener("visibilitychange", run);
    window.removeEventListener("focus", run);
    window.removeEventListener("pageshow", run);
  };
}

/** Intervals: HTTP always polls; WS supplements when connected. */
export const HTTP_POLL_MS = 1000;
export const WS_POLL_MS = 2000;

const MEME_PHASE_RANK = { captioning: 1, voting: 2, results: 3 };

/**
 * Reject stale WS frames that would roll the UI back to an earlier phase.
 */
export function shouldIgnoreMemeGameUpdate(incoming, current) {
  if (!incoming?.status || !current?.status) return false;

  const incRank = MEME_PHASE_RANK[incoming.status] ?? 0;
  const curRank = MEME_PHASE_RANK[current.status] ?? 0;

  if (incRank < curRank) {
    if (current.status === "results" && incoming.status === "captioning") {
      const incMeme = incoming.current_meme?.filename;
      const curMeme = current.current_meme?.filename;
      if (!incMeme || !curMeme || incMeme !== curMeme) return false;
    }
    return true;
  }

  if (
    incoming.status === "captioning" &&
    current.status === "captioning" &&
    incoming.current_meme?.filename &&
    current.current_meme?.filename &&
    incoming.current_meme.filename !== current.current_meme.filename
  ) {
    return false;
  }

  if (
    incoming.phase_epoch != null &&
    current.phase_epoch != null &&
    incoming.status === current.status &&
    incoming.phase_epoch < current.phase_epoch
  ) {
    return true;
  }

  return false;
}
