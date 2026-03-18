import { env } from "cloudflare:workers";

type D1Database = typeof env.DB;

export interface Idol {
  id: number;
  name: string;
  created_at: string;
}

export interface Genre {
  id: number;
  name: string;
  created_at: string;
}

export interface Screenshot {
  id: number;
  r2_key: string;
  idol_id: number | null;
  body: string | null;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

export interface ScreenshotWithRelations extends Screenshot {
  idol_name: string | null;
  genre_ids: number[];
  genre_names: string[];
}

export type ListScreenshotsParams = {
  idol_id?: number;
  genre_id?: number;
  favorite?: boolean;
  q?: string;
  sort?: "created_at_desc" | "created_at_asc" | "idol_name";
  limit?: number;
  offset?: number;
};

export async function listScreenshots(
  db: D1Database,
  params: ListScreenshotsParams,
): Promise<ScreenshotWithRelations[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.idol_id) {
    conditions.push("s.idol_id = ?");
    values.push(params.idol_id);
  }
  if (params.genre_id) {
    conditions.push(`EXISTS (
      SELECT 1 FROM screenshot_genres sg
      WHERE sg.screenshot_id = s.id AND sg.genre_id = ?
    )`);
    values.push(params.genre_id);
  }
  if (params.favorite) {
    conditions.push("s.is_favorite = 1");
  }
  if (params.q) {
    conditions.push("s.body LIKE ?");
    values.push(`%${params.q}%`);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderMap = {
    created_at_desc: "s.created_at DESC",
    created_at_asc: "s.created_at ASC",
    idol_name: "i.sort_order ASC", // ← name → sort_order
  };
  const order = orderMap[params.sort ?? "created_at_desc"];

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  // スクリーンショット一覧を取得
  const sql = `
    SELECT
      s.*,
      i.name AS idol_name
    FROM screenshots s
    LEFT JOIN idols i ON s.idol_id = i.id
    ${where}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `;

  const rows = await db
    .prepare(sql)
    .bind(...values, limit, offset)
    .all<Screenshot & { idol_name: string | null }>();

  if (rows.results.length === 0) return [];

  // ジャンルを一括取得
  const ids = rows.results.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const genreRows = await db
    .prepare(
      `
      SELECT sg.screenshot_id, g.id AS genre_id, g.name AS genre_name
      FROM screenshot_genres sg
      JOIN genres g ON sg.genre_id = g.id
      WHERE sg.screenshot_id IN (${placeholders})
    `,
    )
    .bind(...ids)
    .all<{ screenshot_id: number; genre_id: number; genre_name: string }>();

  // マップに集約
  const genreMap = new Map<number, { ids: number[]; names: string[] }>();
  for (const row of genreRows.results) {
    if (!genreMap.has(row.screenshot_id)) {
      genreMap.set(row.screenshot_id, { ids: [], names: [] });
    }
    genreMap.get(row.screenshot_id)!.ids.push(row.genre_id);
    genreMap.get(row.screenshot_id)!.names.push(row.genre_name);
  }

  return rows.results.map((s) => ({
    ...s,
    genre_ids: genreMap.get(s.id)?.ids ?? [],
    genre_names: genreMap.get(s.id)?.names ?? [],
  }));
}
