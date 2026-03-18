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
  genre_id: string;
  body: string;
}

interface Props {
  idols: Idol[];
  genres: Genre[];
}

export default function UploadForm({ idols, genres }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newEntries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      idol_id: "",
      genre_id: "",
      body: "",
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    setDone(false);
  };

  const update = (
    index: number,
    field: keyof Omit<FileEntry, "file" | "preview">,
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
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
      formData.append("idol_ids", entry.idol_id);
      formData.append("genre_ids", entry.genre_id);
      formData.append("bodies", entry.body);
    }

    await fetch("/api/screenshots", { method: "POST", body: formData });
    setEntries([]);
    setUploading(false);
    setDone(true);
  };

  return (
    <div className="space-y-6">
      {/* ファイル選択エリア */}
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

      {/* 各画像のメタデータ入力 */}
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
            <select
              value={entry.idol_id}
              onChange={(e) => update(i, "idol_id", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
            >
              <option value="">アイドルを選択</option>
              {idols.map((idol) => (
                <option key={idol.id} value={idol.id}>
                  {idol.name}
                </option>
              ))}
            </select>
            <select
              value={entry.genre_id}
              onChange={(e) => update(i, "genre_id", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
            >
              <option value="">ジャンルを選択</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
            <textarea
              value={entry.body}
              onChange={(e) => update(i, "body", e.target.value)}
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
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
        >
          {uploading ? "アップロード中..." : `${entries.length}枚を投稿する`}
        </button>
      )}

      {done && (
        <div className="text-center space-y-2">
          <div className="text-green-400">✓ 投稿しました！</div>
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-white transition underline"
          >
            ギャラリーに戻る
          </a>
        </div>
      )}
    </div>
  );
}
