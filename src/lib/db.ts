import type { D1Database } from "@cloudflare/workers-types";

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
  genre_id: number | null;
  body: string | null;
  is_favorite: number;
  created_at: string;
  updated_at: string;
}

export interface ScreenshotWithRelations extends Screenshot {
  idol_name: string | null;
  genre_name: string | null;
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
    conditions.push("s.genre_id = ?");
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
    idol_name: "i.name ASC",
  };
  const order = orderMap[params.sort ?? "created_at_desc"];

  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const sql = `
    SELECT
      s.*,
      i.name AS idol_name,
      g.name AS genre_name
    FROM screenshots s
    LEFT JOIN idols  i ON s.idol_id  = i.id
    LEFT JOIN genres g ON s.genre_id = g.id
    ${where}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `;

  const result = await db
    .prepare(sql)
    .bind(...values, limit, offset)
    .all<ScreenshotWithRelations>();

  return result.results;
}
