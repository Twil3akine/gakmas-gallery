// src/pages/api/screenshots/thumb.ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const r2Key = formData.get("r2_key") as string | null;
  const thumbFile = formData.get("thumbnail") as File | null;

  if (!r2Key || !thumbFile) {
    return new Response(JSON.stringify({ error: "Missing data" }), { status: 400 });
  }

  const thumbKey = r2Key.replace(/\.[^.]+$/, "_thumb.webp");

  await env.R2.put(thumbKey, await thumbFile.arrayBuffer(), {
    httpMetadata: { contentType: "image/webp" },
  });

  return new Response(JSON.stringify({ success: true, thumbKey }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
