-- インデックスを先に削除
DROP INDEX IF EXISTS idx_screenshots_genre_id;

-- 中間テーブル作成
CREATE TABLE screenshot_genres (
  screenshot_id INTEGER NOT NULL REFERENCES screenshots(id) ON DELETE CASCADE,
  genre_id      INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (screenshot_id, genre_id)
);

-- 既存データを移行
INSERT INTO screenshot_genres (screenshot_id, genre_id)
SELECT id, genre_id FROM screenshots WHERE genre_id IS NOT NULL;

-- 旧カラムを削除
ALTER TABLE screenshots DROP COLUMN genre_id;
