import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const PATCH: APIRoute = async ({ params }) => {
  const db = env.DB;
  const id = Number(params.id);

  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = await db
    .prepare("SELECT is_favorite FROM screenshots WHERE id = ?")
    .bind(id)
    .first<{ is_favorite: number }>();

  if (!existing) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const newValue = existing.is_favorite === 1 ? 0 : 1;

  await db
    .prepare(
      "UPDATE screenshots SET is_favorite = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(newValue, id)
    .run();

  return new Response(JSON.stringify({ is_favorite: newValue }), {
    headers: { "Content-Type": "application/json" },
  });
};
