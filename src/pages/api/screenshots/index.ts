import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { listScreenshots } from "../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const p = url.searchParams;

  const results = await listScreenshots(db, {
    idol_id: p.get("idol_id") ? Number(p.get("idol_id")) : undefined,
    genre_id: p.get("genre_id") ? Number(p.get("genre_id")) : undefined,
    favorite: p.get("favorite") === "1",
    q: p.get("q") ?? undefined,
    sort: (p.get("sort") as any) ?? "created_at_desc",
    limit: p.get("limit") ? Number(p.get("limit")) : 50,
    offset: p.get("offset") ? Number(p.get("offset")) : 0,
  });

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const r2 = env.R2;

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return new Response(JSON.stringify({ error: "No files provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 各ファイルに対応するメタデータを取得
  // フロントからは files[0], files[1]... に対して
  // idol_ids[0], genre_ids[0], bodies[0]... という形で送る
  const idolIds = formData.getAll("idol_ids");
  const genreIds = formData.getAll("genre_ids");
  const bodies = formData.getAll("bodies");

  const inserted: number[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const r2Key = `screenshots/${crypto.randomUUID()}-${file.name}`;

    // R2にアップロード
    await r2.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    // D1に保存
    const result = await db
      .prepare(
        `INSERT INTO screenshots (r2_key, idol_id, genre_id, body)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(
        r2Key,
        idolIds[i] ? Number(idolIds[i]) : null,
        genreIds[i] ? Number(genreIds[i]) : null,
        bodies[i] || null,
      )
      .run();

    inserted.push(result.meta.last_row_id as number);
  }

  return new Response(JSON.stringify({ inserted }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
