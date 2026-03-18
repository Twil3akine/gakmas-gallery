/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare module "cloudflare:workers" {
  interface Env {
    DB: D1Database;
    R2: R2Bucket;
  }
}
