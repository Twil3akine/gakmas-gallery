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
  const body = formData.get("body");
  const newFile = formData.get("file") as File | null;
  const genreIds = formData.get("genre_ids_list")
    ? String(formData.get("genre_ids_list"))
        .split(",")
        .filter(Boolean)
        .map(Number)
    : [];

  if (newFile && newFile.size > 0) {
    const r2 = env.R2;

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

    await r2.delete(existing.r2_key);

    const newKey = `screenshots/${crypto.randomUUID()}-${newFile.name}`;
    await r2.put(newKey, await newFile.arrayBuffer(), {
      httpMetadata: { contentType: newFile.type },
    });

    await db
      .prepare(
        `UPDATE screenshots
         SET r2_key = ?, idol_id = ?, body = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(newKey, idolId ? Number(idolId) : null, body || null, id)
      .run();
  } else {
    await db
      .prepare(
        `UPDATE screenshots
         SET idol_id = ?, body = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(idolId ? Number(idolId) : null, body || null, id)
      .run();
  }

  // ジャンルを差し替え
  await db
    .prepare("DELETE FROM screenshot_genres WHERE screenshot_id = ?")
    .bind(id)
    .run();
  for (const genreId of genreIds) {
    await db
      .prepare(
        "INSERT INTO screenshot_genres (screenshot_id, genre_id) VALUES (?, ?)",
      )
      .bind(id, genreId)
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

  await r2.delete(existing.r2_key);
  await db.prepare("DELETE FROM screenshots WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
