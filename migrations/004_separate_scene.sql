-- screenshotsテーブルにsceneカラムを追加
ALTER TABLE screenshots ADD COLUMN scene TEXT;

-- 既存の「ライブ」ジャンルの紐付けをsceneに移行
UPDATE screenshots
SET scene = 'ライブ'
WHERE id IN (
  SELECT screenshot_id FROM screenshot_genres
  JOIN genres ON screenshot_genres.genre_id = genres.id
  WHERE genres.name = 'ライブ'
);

-- 既存の「コミュ」ジャンルの紐付けをsceneに移行
UPDATE screenshots
SET scene = 'コミュ'
WHERE id IN (
  SELECT screenshot_id FROM screenshot_genres
  JOIN genres ON screenshot_genres.genre_id = genres.id
  WHERE genres.name = 'コミュ'
);

-- 既存の「日常」ジャンルの紐付けをsceneに移行（必要に応じて）
UPDATE screenshots
SET scene = '日常'
WHERE id IN (
  SELECT screenshot_id FROM screenshot_genres
  JOIN genres ON screenshot_genres.genre_id = genres.id
  WHERE genres.name = '日常'
);

-- 不要になったジャンル紐付けを削除
DELETE FROM screenshot_genres
WHERE genre_id IN (
  SELECT id FROM genres WHERE name IN ('ライブ', 'コミュ', '日常')
);

-- genresテーブルから対象のレコードを削除
DELETE FROM genres
WHERE name IN ('ライブ', 'コミュ', '日常');
