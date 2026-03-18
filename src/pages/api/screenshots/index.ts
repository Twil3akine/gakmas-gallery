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
