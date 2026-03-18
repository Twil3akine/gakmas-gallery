import { readFileSync, writeFileSync } from "fs";

const path = "./dist/server/wrangler.json";
const config = JSON.parse(readFileSync(path, "utf-8"));

// 不要なフィールドを削除
delete config.triggers;
delete config.kv_namespaces;
delete config.definedEnvironments;
delete config.secrets_store_secrets;
delete config.unsafe_hello_world;
delete config.worker_loaders;
delete config.ratelimits;
delete config.vpc_services;
delete config.python_modules;
if (config.dev) {
  delete config.dev.enable_containers;
  delete config.dev.generate_types;
}

// ASSETSバインディングをリネーム
if (config.assets?.binding === "ASSETS") {
  config.assets.binding = "__STATIC_CONTENT";
}

writeFileSync(path, JSON.stringify(config, null, 2));
console.log("✓ wrangler.json fixed");
