import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async () => {
  const db = env.DB;
  const result = await db.prepare("SELECT * FROM genres ORDER BY id ASC").all();

  return new Response(JSON.stringify(result.results), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const { name } = await request.json();

  if (!name?.trim()) {
    return new Response(JSON.stringify({ error: "name is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await db
    .prepare("INSERT INTO genres (name) VALUES (?)")
    .bind(name.trim())
    .run();

  return new Response(JSON.stringify({ id: result.meta.last_row_id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
