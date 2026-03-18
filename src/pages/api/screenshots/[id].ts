import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const PUT: APIRoute = async ({ params, request }) => {
  const db = env.DB;
  const id = Number(params.id);

  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const formData = await request.formData();
  const idolId = formData.get("idol_id");
  const genreId = formData.get("genre_id");
  const body = formData.get("body");
  const newFile = formData.get("file") as File | null;

  // 画像差し替えがある場合
  if (newFile && newFile.size > 0) {
    const r2 = env.R2;

    // 既存のr2_keyを取得
    const existing = await db
      .prepare("SELECT r2_key FROM screenshots WHERE id = ?")
      .bind(id)
      .first<{ r2_key: string }>();

    if (!existing) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 旧ファイルをR2から削除
    await r2.delete(existing.r2_key);

    // 新ファイルをR2にアップロード
    const newKey = `screenshots/${crypto.randomUUID()}-${newFile.name}`;
    await r2.put(newKey, await newFile.arrayBuffer(), {
      httpMetadata: { contentType: newFile.type },
    });

    await db
      .prepare(
        `UPDATE screenshots
         SET r2_key = ?, idol_id = ?, genre_id = ?, body = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        newKey,
        idolId ? Number(idolId) : null,
        genreId ? Number(genreId) : null,
        body || null,
        id,
      )
      .run();
  } else {
    await db
      .prepare(
        `UPDATE screenshots
         SET idol_id = ?, genre_id = ?, body = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        idolId ? Number(idolId) : null,
        genreId ? Number(genreId) : null,
        body || null,
        id,
      )
      .run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = env.DB;
  const r2 = env.R2;
  const id = Number(params.id);

  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = await db
    .prepare("SELECT r2_key FROM screenshots WHERE id = ?")
    .bind(id)
    .first<{ r2_key: string }>();

  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // R2から削除
  await r2.delete(existing.r2_key);

  // D1から削除
  await db.prepare("DELETE FROM screenshots WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
