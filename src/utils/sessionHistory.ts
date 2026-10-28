import type { PlaySessionExport, PlaySessionRecord } from '../types';

const STORAGE_KEY = 'owl_math_game_sessions_v1';
const MAX_SESSIONS = 200;
const DEV_ENDPOINT = '/api/play-sessions';

let sessionCache: PlaySessionRecord[] | null = null;

function readSessions(): PlaySessionRecord[] {
  if (sessionCache) return sessionCache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      sessionCache = [];
      return sessionCache;
    }
    const parsed = JSON.parse(raw);
    sessionCache = Array.isArray(parsed) ? (parsed as PlaySessionRecord[]) : [];
    return sessionCache;
  } catch {
    sessionCache = [];
    return sessionCache;
  }
}

function writeSessions(sessions: PlaySessionRecord[]) {
  sessionCache = sessions.slice(-MAX_SESSIONS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionCache));
}

/**
 * Ghi song song bản ghi lượt chơi ra file thật trên máy thông qua dev server.
 * Chỉ hoạt động khi chạy `npm run dev` (plugin trong vite.config.ts).
 * Ở bản build production, request này bị bỏ qua để tránh 404.
 */
function mirrorToDevServer(record: PlaySessionRecord) {
  if (!import.meta.env.DEV) return;
  if (typeof fetch !== 'function') return;
  try {
    void fetch(DEV_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Bỏ qua lỗi mạng; dữ liệu vẫn được lưu trong localStorage.
  }
}

export function getSessionRecords(): PlaySessionRecord[] {
  return readSessions();
}

/** Thêm mới hoặc cập nhật bản ghi theo `sessionId`, rồi lưu cục bộ và mirror ra file khi chạy dev. */
export function saveSessionRecord(record: PlaySessionRecord) {
  const sessions = readSessions();
  const index = sessions.findIndex((item) => item.sessionId === record.sessionId);
  if (index >= 0) {
    sessions[index] = record;
  } else {
    sessions.push(record);
  }
  writeSessions(sessions);
  mirrorToDevServer(record);
}

export function clearSessionRecords() {
  writeSessions([]);
}

export function buildSessionExport(sessions: PlaySessionRecord[] = readSessions()): PlaySessionExport {
  return {
    exportedAt: new Date().toISOString(),
    totalSessions: sessions.length,
    sessions,
  };
}

/** Tải toàn bộ lịch sử chơi về máy dưới dạng một file `.json`. */
export function exportSessionRecordsAsJson() {
  const payload = buildSessionExport();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `owl-math-play-sessions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
