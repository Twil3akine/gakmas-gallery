import { readFileSync, writeFileSync } from "fs";

const path = "./dist/server/wrangler.json";
const config = JSON.parse(readFileSync(path, "utf-8"));

// Pages非対応フィールドを削除
const removeFields = [
  "triggers",
  "kv_namespaces",
  "definedEnvironments",
  "secrets_store_secrets",
  "unsafe_hello_world",
  "worker_loaders",
  "ratelimits",
  "vpc_services",
  "python_modules",
  "main",
  "rules",
  "assets",
  "no_bundle",
];
for (const field of removeFields) {
  delete config[field];
}

if (config.dev) {
  delete config.dev.enable_containers;
  delete config.dev.generate_types;
}

writeFileSync(path, JSON.stringify(config, null, 2));
console.log("✓ wrangler.json fixed");
