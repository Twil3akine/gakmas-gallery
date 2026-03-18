import { useState } from "react";

interface Item {
  id: number;
  name: string;
}
interface Props {
  idols: Item[];
  genres: Item[];
}

function ItemList({
  title,
  items,
  apiPath,
}: {
  title: string;
  items: Item[];
  apiPath: string;
}) {
  const [list, setList] = useState<Item[]>(items);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setList((prev) => [...prev, { id: data.id, name: newName.trim() }]);
    setNewName("");
    setAdding(false);
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (item: Item) => {
    if (!editingName.trim() || editingName === item.name) {
      cancelEdit();
      return;
    }
    await fetch(`${apiPath}/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() }),
    });
    setList((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, name: editingName.trim() } : i,
      ),
    );
    cancelEdit();
  };

  const remove = async (item: Item) => {
    if (
      !confirm(
        `「${item.name}」を削除しますか？\n関連するスクリーンショットのデータは保持されます。`,
      )
    )
      return;
    await fetch(`${apiPath}/${item.id}`, { method: "DELETE" });
    setList((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 space-y-3">
      <h2 className="font-bold text-lg">{title}</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={`新しい${title}名`}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={add}
          disabled={adding || !newName.trim()}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm transition"
        >
          追加
        </button>
      </div>

      <ul className="space-y-1">
        {list.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg"
          >
            {editingId === item.id ? (
              <>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(item);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-0.5 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => saveEdit(item)}
                  className="text-blue-400 hover:text-blue-300 text-xs transition"
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="text-gray-500 hover:text-gray-300 text-xs transition"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{item.name}</span>
                <button
                  onClick={() => startEdit(item)}
                  className="text-gray-500 hover:text-blue-400 text-xs transition"
                >
                  編集
                </button>
                <button
                  onClick={() => remove(item)}
                  className="text-gray-600 hover:text-red-400 text-xs transition"
                >
                  削除
                </button>
              </>
            )}
          </li>
        ))}
        {list.length === 0 && (
          <li className="text-sm text-gray-500 text-center py-4">
            まだ登録されていません
          </li>
        )}
      </ul>
    </div>
  );
}

export default function MasterManager({ idols, genres }: Props) {
  return (
    <div className="space-y-6">
      <ItemList title="アイドル" items={idols} apiPath="/api/idols" />
      <ItemList title="ジャンル" items={genres} apiPath="/api/genres" />
    </div>
  );
}
