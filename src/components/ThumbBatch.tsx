// src/components/ThumbBatch.tsx
import { useState } from "react";

export default function ThumbBatch() {
  const [status, setStatus] = useState("待機中");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isRunning, setIsRunning] = useState(false);

  // URLから画像を読み込んでリサイズする関数
  const generateThumbnailFromUrl = (url: string, maxSize = 400): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject("Blob error")),
          "image/webp",
          0.8
        );
      };
      img.onerror = reject;
    });
  };

  const startBatch = async () => {
    setIsRunning(true);
    setStatus("画像のリストを取得中...");

    try {
      // 1. 全画像のリストを取得 (limitを大きめに設定)
      const res = await fetch("/api/screenshots?limit=1000");
      const screenshots = await res.json();
      setProgress({ current: 0, total: screenshots.length });

      // 2. 1枚ずつ処理する
      for (let i = 0; i < screenshots.length; i++) {
        const s = screenshots[i];
        setStatus(`処理中: ${s.r2_key} (${i + 1}/${screenshots.length})`);

        try {
          // オリジナル画像をBlobとして取得 (?thumb=1 は付けない)
          const imgRes = await fetch(`/api/images/${s.r2_key}`);
          const imgBlob = await imgRes.blob();
          const objUrl = URL.createObjectURL(imgBlob);

          // サムネイル生成
          const thumbBlob = await generateThumbnailFromUrl(objUrl);
          URL.revokeObjectURL(objUrl);

          // APIに送信
          const formData = new FormData();
          formData.append("r2_key", s.r2_key);
          formData.append("thumbnail", thumbBlob, "thumb.webp");

          await fetch("/api/screenshots/thumb", {
            method: "POST",
            body: formData,
          });

          setProgress({ current: i + 1, total: screenshots.length });
        } catch (err) {
          console.error(`エラー: ${s.r2_key}`, err);
          // エラーが起きても止めずに次へ
        }
      }

      setStatus("すべての処理が完了しました！🎉");
    } catch (err) {
      setStatus("リストの取得に失敗しました。");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-gray-900 rounded-xl mt-10">
      <h1 className="text-2xl font-bold mb-4 text-white">サムネイル一括生成ツール</h1>
      <p className="text-gray-400 mb-6 text-sm">
        R2に保存されているすべての画像をダウンロードし、WebPのサムネイルを生成してアップロードします。
        （※ブラウザを開いたままにしてください）
      </p>

      <button
        onClick={startBatch}
        disabled={isRunning}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold rounded-lg mb-6 transition"
      >
        {isRunning ? "処理中..." : "一括変換をスタート"}
      </button>

      <div className="space-y-2">
        <div className="text-white">{status}</div>
        {progress.total > 0 && (
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-500 h-4 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}
