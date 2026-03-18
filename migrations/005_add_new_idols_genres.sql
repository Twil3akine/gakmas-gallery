-- migrations/005_add_new_idols.sql
INSERT OR IGNORE INTO idols (name, sort_order) VALUES
  ('賀陽燐羽', 14), -- 14の部分は適切な順番の数字にしてください
  ('その他', 99);

INSERT OR IGNORE INTO genres (name) VALUES
  ('同意'),
  ('誇示'),
  ('傲慢'),
  ('その他');
