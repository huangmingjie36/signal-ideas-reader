import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, post_id)
)`;

async function userId() {
  return (await headers()).get("oai-authenticated-user-email") ?? "local-preview";
}

async function readyDb() {
  const db = env.DB;
  if (!db) throw new Error("Favorites database is unavailable");
  await db.prepare(CREATE_TABLE).run();
  return db;
}

export async function GET() {
  try {
    const db = await readyDb();
    const user = await userId();
    const result = await db.prepare("SELECT post_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC").bind(user).all<{ post_id: string }>();
    return NextResponse.json({ ids: result.results.map((row) => row.post_id) });
  } catch {
    return NextResponse.json({ ids: [] });
  }
}

export async function POST(request: Request) {
  const { postId } = (await request.json()) as { postId?: string };
  if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 });
  const db = await readyDb();
  await db.prepare("INSERT OR IGNORE INTO favorites (user_id, post_id, created_at) VALUES (?, ?, ?)").bind(await userId(), postId, new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { postId } = (await request.json()) as { postId?: string };
  if (!postId) return NextResponse.json({ error: "postId is required" }, { status: 400 });
  const db = await readyDb();
  await db.prepare("DELETE FROM favorites WHERE user_id = ? AND post_id = ?").bind(await userId(), postId).run();
  return NextResponse.json({ ok: true });
}
