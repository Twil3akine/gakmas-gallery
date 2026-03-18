CREATE TABLE idols (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE genres (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE screenshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key      TEXT NOT NULL,
  idol_id     INTEGER REFERENCES idols(id) ON DELETE SET NULL,
  genre_id    INTEGER REFERENCES genres(id) ON DELETE SET NULL,
  body        TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_screenshots_idol_id  ON screenshots(idol_id);
CREATE INDEX idx_screenshots_genre_id ON screenshots(genre_id);
CREATE INDEX idx_screenshots_is_favorite ON screenshots(is_favorite);
CREATE INDEX idx_screenshots_created_at ON screenshots(created_at);

INSERT INTO idols (name) VALUES
  ('花海咲季'),
  ('月村手毬'),
  ('藤田ことね'),
  ('姫崎莉波'),
  ('有村麻央'),
  ('葛城リーリヤ'),
  ('倉本千奈'),
  ('紫雲清夏'),
  ('篠澤広'),
  ('十王星南'),
  ('秦谷美鈴'),
  ('花海佑芽'),
  ('雨夜燕');

-- 初期ジャンルデータ
INSERT INTO genres (name) VALUES
  ('喜び'),
  ('悲しみ'),
  ('怒り'),
  ('恐怖'),
  ('驚き'),
  ('羨望'),
  ('日常'),
  ('ライブ'),
  ('コミュ');
