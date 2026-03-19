import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { listScreenshots } from "../../../lib/db";

export const GET: APIRoute = async ({ request }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const p = url.searchParams;

  const results = await listScreenshots(db, {
    idol_id: p.get("idol_id") ? Number(p.get("idol_id")) : undefined,
    genre_ids,
    scene: p.get("scene") ?? undefined,
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
  const thumbnails = formData.getAll("thumbnails") as File[];

  if (files.length === 0) {
    return new Response(JSON.stringify({ error: "No files provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const idolIds = formData.getAll("idol_ids");
  const scenes = formData.getAll("scenes");
  const bodies = formData.getAll("bodies");
  const genreIdsList = formData.getAll("genre_ids_list");

  const inserted: number[] = [];
  const skipped: string[] = []; // 重複してスキップされたファイル名を記録

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = await file.arrayBuffer();

    // 1. ファイルデータからSHA-256ハッシュを計算
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 2. 拡張子を取得し、ハッシュ値をファイル名にする
    const extension = file.name.split(".").pop() || "png";
    const r2Key = `screenshots/${hashHex}.${extension}`;

    // 3. 同じハッシュの画像がDBに存在するかチェック
    const existing = await db
      .prepare("SELECT id FROM screenshots WHERE r2_key = ?")
      .bind(r2Key)
      .first();

    if (existing) {
      // 既に存在する場合はR2保存とDB保存をスキップする
      skipped.push(file.name);
      continue;
    }

    // 存在しない場合のみ R2 への保存を実行
    await r2.put(r2Key, buffer, {
      httpMetadata: { contentType: file.type },
    });

    // サムネイル画像があれば、末尾を _thumb.webp にして保存
    if (thumbnails[i] && thumbnails[i].size > 0) {
      const thumbBuffer = await thumbnails[i].arrayBuffer();
      const thumbKey = r2Key.replace(/\.[^.]+$/, "_thumb.webp");
      await r2.put(thumbKey, thumbBuffer, {
        httpMetadata: { contentType: "image/webp" },
      });
    }

    // DB への INSERT を実行
    const result = await db
      .prepare(
        `INSERT INTO screenshots (r2_key, idol_id, scene, body)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(
        r2Key,
        idolIds[i] ? Number(idolIds[i]) : null,
        scenes[i] ? String(scenes[i]) : null,
        bodies[i] ? String(bodies[i]) : null,
      )
      .run();

    const screenshotId = result.meta.last_row_id as number;
    inserted.push(screenshotId);

    const genreIds = genreIdsList[i]
      ? String(genreIdsList[i]).split(",").filter(Boolean).map(Number)
      : [];

    for (const genreId of genreIds) {
      await db
        .prepare(
          "INSERT INTO screenshot_genres (screenshot_id, genre_id) VALUES (?, ?)",
        )
        .bind(screenshotId, genreId)
        .run();
    }
  }

  // レスポンスに成功数とスキップ数を明示する
  return new Response(
    JSON.stringify({
      insertedCount: inserted.length,
      skippedCount: skipped.length,
      skippedFiles: skipped,
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    },
  );
};
