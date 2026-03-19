import { useState, useRef } from "react";

interface Idol {
  id: number;
  name: string;
}
interface Genre {
  id: number;
  name: string;
}

interface FileEntry {
  file: File;
  preview: string;
  idol_id: string;
  scene: string;
  genre_ids: number[];
  body: string;
  thumbnail: Blob | null;
}

interface Props {
  idols: Idol[];
  genres: Genre[];
}

const SCENES = ["ライブ", "コミュ", "その他"];

// 画像をリサイズしてWebP形式のBlobを生成する関数
const generateThumbnail = (file: File, maxSize = 400): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
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
        0.8 // 画質 (0〜1)
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
  });
};

export default function UploadForm({ idols, genres }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  // 何枚成功して、何枚重複したかを保持するステート
  const [uploadResult, setUploadResult] = useState<{
    inserted: number;
    skipped: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFilesSelected = async(e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // サムネイル生成を待つために Promise.all を使用する
    const newEntries = await Promise.all(
      files.map(async (file) => {
        const thumbnail = await generateThumbnail(file).catch(() => null);
        return {
          file,
          thumbnail,
          preview: URL.createObjectURL(file),
          idol_id: "",
          scene: "",
          genre_ids: [],
          body: "",
        };
      })
    );
    setEntries((prev) => [...prev, ...newEntries]);
    setDone(false);
    setUploadResult(null);
  };

  const updateField = (
    index: number,
    field: "idol_id" | "scene" | "body",
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  };

  const toggleGenre = (index: number, genreId: number) => {
    setEntries((prev) =>
      prev.map((e, i) => {
        if (i !== index) return e;
        const has = e.genre_ids.includes(genreId);
        return {
          ...e,
          genre_ids: has
            ? e.genre_ids.filter((g) => g !== genreId)
            : [...e.genre_ids, genreId],
        };
      }),
    );
  };

  const remove = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (entries.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    for (const entry of entries) {
      formData.append("files", entry.file);
      formData.append("thumbnails", entry.thumbnail || new Blob([]), "thumb.webp");
      formData.append("idol_ids", entry.idol_id);
      formData.append("scenes", entry.scene);
      formData.append("bodies", entry.body);
      formData.append("genre_ids_list", entry.genre_ids.join(","));
    }

    try {
      const res = await fetch("/api/screenshots", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadResult({
          inserted: data.insertedCount || 0,
          skipped: data.skippedCount || 0,
        });
        setDone(true);
        setEntries([]);
      }
    } catch (err) {
      alert("アップロード失敗");
    } finally {
      setUploading(false);
    }
  };

  // --- 完了画面（done が true のとき） ---
  if (done && uploadResult) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center space-y-6">
        <div className="space-y-2">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-bold text-white">処理が完了しました</h2>

          <div className="text-sm space-y-1">
            {uploadResult.inserted > 0 && (
              <p className="text-green-400">
                {uploadResult.inserted} 枚の画像を新しく登録しました。
              </p>
            )}
            {uploadResult.skipped > 0 && (
              <p className="text-amber-400">
                {uploadResult.skipped} 枚は既に登録済みのためスキップしました。
              </p>
            )}
            {uploadResult.inserted === 0 && uploadResult.skipped > 0 && (
              <p className="text-gray-500">
                新規に登録された画像はありません。
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setDone(false);
              setUploadResult(null);
            }}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-medium transition"
          >
            続けて投稿する
          </button>
          <a
            href="/"
            className="text-gray-400 hover:text-white transition underline text-sm"
          >
            ギャラリーに戻る
          </a>
        </div>
      </div>
    );
  }

  // --- アップロード画面（通常時） ---
  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center cursor-pointer hover:border-gray-500 transition"
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-4xl mb-2">📁</div>
        <div className="text-gray-400 text-sm">
          クリックして画像を選択（複数可）
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFilesSelected}
        />
      </div>

      {entries.map((entry, i) => (
        <div key={i} className="bg-gray-900 rounded-xl p-4 flex gap-4">
          <img
            src={entry.preview}
            alt=""
            className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400 truncate">
                {entry.file.name}
              </span>
              <button
                onClick={() => remove(i)}
                className="text-gray-600 hover:text-red-400 text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2">
              <select
                value={entry.idol_id}
                onChange={(e) => updateField(i, "idol_id", e.target.value)}
                className="w-1/2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">アイドル</option>
                {idols.map((idol) => (
                  <option key={idol.id} value={idol.id}>
                    {idol.name}
                  </option>
                ))}
              </select>

              <select
                value={entry.scene}
                onChange={(e) => updateField(i, "scene", e.target.value)}
                className="w-1/2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
              >
                <option value="">シーン</option>
                {SCENES.map((scene) => (
                  <option key={scene} value={scene}>
                    {scene}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {genres.map((genre) => {
                const selected = entry.genre_ids.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => toggleGenre(i, genre.id)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition ${
                      selected
                        ? "bg-blue-500/20 border-blue-500 text-blue-300"
                        : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>

            <textarea
              value={entry.body}
              onChange={(e) => updateField(i, "body", e.target.value)}
              placeholder="メモ（任意）"
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>
        </div>
      ))}

      {entries.length > 0 && (
        <button
          onClick={submit}
          disabled={uploading}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition"
        >
          {uploading ? "アップロード中..." : `${entries.length}枚を投稿する`}
        </button>
      )}
    </div>
  );
}
