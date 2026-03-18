import fs from "node:fs";
import path from "node:path";

const distDir = "./dist";
const clientDir = path.join(distDir, "client");
const serverDir = path.join(distDir, "server");
const workerDir = path.join(distDir, "_worker.js");

// 1. clientディレクトリの中身をdist直下に移動
if (fs.existsSync(clientDir)) {
  const files = fs.readdirSync(clientDir);
  for (const file of files) {
    fs.renameSync(path.join(clientDir, file), path.join(distDir, file));
  }
  fs.rmSync(clientDir, { recursive: true, force: true });
}

// 2. serverディレクトリをCloudflare Pages用の_worker.jsにリネーム
if (fs.existsSync(serverDir)) {
  fs.renameSync(serverDir, workerDir);
}

// 3. 不要なwrangler.jsonを削除
const wranglerJsonPath = path.join(workerDir, "wrangler.json");
if (fs.existsSync(wranglerJsonPath)) {
  fs.rmSync(wranglerJsonPath);
}

// 4. Astroが生成したWranglerのリダイレクト設定を削除（これがないとデプロイ時にエラーになる）
const wranglerDeployConfig = path.join(".wrangler", "deploy");
if (fs.existsSync(wranglerDeployConfig)) {
  fs.rmSync(wranglerDeployConfig, { recursive: true, force: true });
}

console.log(
  "✓ Adapted build output for Cloudflare Pages and cleaned up deploy config",
);
