import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key;
  const url = new URL(request.url);
  const isThumb = url.searchParams.get("thumb") === "1"; // サムネイル要求かチェック

  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  const r2 = env.R2;
  let object = null;

  // サムネイルが要求された場合、まずサムネイル用ファイルを探す
  if (isThumb) {
    // 例: abc.png -> abc_thumb.webp
    const thumbKey = key.replace(/\.[^.]+$/, "_thumb.webp");
    object = await r2.get(thumbKey);
  }

  // サムネイルが見つからない（古い画像）、またはオリジナルが要求された場合はオリジナルを取得
  if (!object) {
    object = await r2.get(key);
  }

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(object.body, { headers });
};
