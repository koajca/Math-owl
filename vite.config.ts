import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEV_ENDPOINT = '/api/play-sessions';
const SESSIONS_FILE = path.resolve(process.cwd(), 'data', 'play-sessions.json');

type SessionRecord = { sessionId?: string } & Record<string, unknown>;

async function readSessionsFile(): Promise<SessionRecord[]> {
  try {
    const raw = await fs.readFile(SESSIONS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeSessionsFile(sessions: SessionRecord[]) {
  await fs.mkdir(path.dirname(SESSIONS_FILE), { recursive: true });
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

async function upsertSession(record: SessionRecord) {
  const sessions = await readSessionsFile();
  const index = sessions.findIndex((item) => item.sessionId === record.sessionId);
  if (index >= 0) sessions[index] = record;
  else sessions.push(record);
  await writeSessionsFile(sessions);
  return sessions.length;
}

/**
 * Nhận bản ghi lượt chơi từ frontend và ghi ra `data/play-sessions.json`.
 * Chỉ dùng cho dev/preview; tự tạo thư mục `data/` nếu chưa có.
 */
function playSessionLogPlugin(): Plugin {
  // Connect-style handler; giữ kiểu lỏng để không phụ thuộc @types/node.
  const handler = (req: any, res: any) => {
    if (req.method === 'GET') {
      void readSessionsFile().then((sessions) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(sessions, null, 2));
      });
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: { toString: () => string }) => {
      body += chunk ? chunk.toString() : '';
    });
    req.on('end', () => {
      void (async () => {
        try {
          const record = JSON.parse(body) as SessionRecord;
          const total = await upsertSession(record);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: true, total }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ ok: false, error: String(error) }));
        }
      })();
    });
  };

  return {
    name: 'owl-play-session-log',
    configureServer(server) {
      server.middlewares.use(DEV_ENDPOINT, handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(DEV_ENDPOINT, handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), playSessionLogPlugin()],
});
