import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const DELETE: APIRoute = async ({ params }) => {
  const db = env.DB;
  const id = Number(params.id);

  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await db.prepare("DELETE FROM genres WHERE id = ?").bind(id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
