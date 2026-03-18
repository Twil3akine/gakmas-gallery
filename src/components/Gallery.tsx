import { useState, useEffect, useCallback } from "react";

interface Idol {
  id: number;
  name: string;
}

interface Genre {
  id: number;
  name: string;
}

interface Screenshot {
  id: number;
  r2_key: string;
  idol_id: number | null;
  genre_id: number | null;
  body: string | null;
  is_favorite: number;
  created_at: string;
  idol_name: string | null;
  genre_name: string | null;
}

interface Props {
  idols: Idol[];
  genres: Genre[];
}

export default function Gallery({ idols, genres }: Props) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Screenshot | null>(null);

  // フィルタ状態
  const [filterIdol, setFilterIdol] = useState<number | null>(null);
  const [filterGenre, setFilterGenre] = useState<number | null>(null);
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [sort, setSort] = useState("created_at_desc");

  const fetchScreenshots = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterIdol) p.set("idol_id", String(filterIdol));
    if (filterGenre) p.set("genre_id", String(filterGenre));
    if (filterFavorite) p.set("favorite", "1");
    if (searchQ) p.set("q", searchQ);
    p.set("sort", sort);

    const res = await fetch(`/api/screenshots?${p}`);
    const data = await res.json();
    setScreenshots(data);
    setLoading(false);
  }, [filterIdol, filterGenre, filterFavorite, searchQ, sort]);

  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  const toggleFavorite = async (s: Screenshot) => {
    await fetch(`/api/screenshots/${s.id}/favorite`, { method: "PATCH" });
    fetchScreenshots();
    if (selected?.id === s.id) {
      setSelected({ ...s, is_favorite: s.is_favorite === 1 ? 0 : 1 });
    }
  };

  const deleteScreenshot = async (s: Screenshot) => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/screenshots/${s.id}`, { method: "DELETE" });
    setSelected(null);
    fetchScreenshots();
  };

  return (
    <div>
      {/* フィルタパネル */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="本文を検索..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:border-gray-500"
        />
        <select
          value={filterIdol ?? ""}
          onChange={(e) =>
            setFilterIdol(e.target.value ? Number(e.target.value) : null)
          }
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
        >
          <option value="">すべてのアイドル</option>
          {idols.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <select
          value={filterGenre ?? ""}
          onChange={(e) =>
            setFilterGenre(e.target.value ? Number(e.target.value) : null)
          }
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
        >
          <option value="">すべてのジャンル</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setFilterFavorite(!filterFavorite)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition ${
            filterFavorite
              ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
              : "bg-gray-800 border-gray-700 text-gray-400"
          }`}
        >
          ★ お気に入り
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500 ml-auto"
        >
          <option value="created_at_desc">新しい順</option>
          <option value="created_at_asc">古い順</option>
          <option value="idol_name">アイドル名順</option>
        </select>
      </div>

      {/* グリッド */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">読み込み中...</div>
      ) : screenshots.length === 0 ? (
        <div className="text-center py-20 text-gray-500">画像がありません</div>
      ) : (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2">
          {screenshots.map((s) => (
            <div
              key={s.id}
              className="break-inside-avoid mb-2 relative group cursor-pointer rounded-lg overflow-hidden"
              onClick={() => setSelected(s)}
            >
              <img
                src={`/api/images/${s.r2_key}`}
                alt={s.idol_name ?? ""}
                className="w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end p-2 opacity-0 group-hover:opacity-100">
                <div className="text-xs text-white truncate">
                  {s.idol_name && (
                    <span className="font-medium">{s.idol_name}</span>
                  )}
                  {s.genre_name && (
                    <span className="ml-1 text-gray-300">#{s.genre_name}</span>
                  )}
                </div>
              </div>
              {s.is_favorite === 1 && (
                <div className="absolute top-1.5 right-1.5 text-yellow-400 text-sm">
                  ★
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`/api/images/${selected.r2_key}`}
              alt=""
              className="w-full rounded-t-2xl"
            />
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  {selected.idol_name && (
                    <div className="font-medium">{selected.idol_name}</div>
                  )}
                  {selected.genre_name && (
                    <div className="text-sm text-gray-400">
                      #{selected.genre_name}
                    </div>
                  )}
                  {selected.body && (
                    <div className="text-sm text-gray-300 mt-2">
                      {selected.body}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {selected.created_at}
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(selected)}
                  className={`text-2xl transition ${
                    selected.is_favorite === 1
                      ? "text-yellow-400"
                      : "text-gray-600 hover:text-yellow-400"
                  }`}
                >
                  ★
                </button>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <a
                  href={`/edit/${selected.id}`}
                  className="flex-1 text-center py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition"
                >
                  編集
                </a>
                <button
                  onClick={() => deleteScreenshot(selected)}
                  className="flex-1 py-2 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm transition"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
